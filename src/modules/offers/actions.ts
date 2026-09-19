"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { toSafeErrorMessage } from "@/lib/db/errors";
import { fromDateInputValue } from "@/lib/format";
import { normalizeSpaces } from "@/lib/text";
import { readString, type FieldErrors } from "@/lib/validation";
import type { OfferFormState } from "@/modules/offers/form-state";
import {
  offerActionError as actionError,
  offerActionSuccess as actionSuccess,
  type OfferActionState,
} from "@/modules/offers/offer-action-state";
import { diffChanges, recordAudit } from "@/modules/audit/audit";
import {
  canAccessOffer,
  isAdmin,
  PENDING_PM_REVIEW_STATUS_CODE,
  PENDING_SALES_REVIEW_STATUS_CODE,
  type AuthenticatedUser,
} from "@/modules/auth/identity";
import { requireUser } from "@/modules/auth/session";
import {
  ATTACHMENT_VALIDATION_MESSAGES,
  deleteAttachmentFile,
  saveAttachmentFile,
  validateAttachment,
} from "@/lib/storage";
import { dispatchNotifications } from "@/modules/notifications/dispatch";
import type { OfferEventSubject } from "@/modules/notifications/rules";
import { assignOfferNumber } from "@/modules/offers/numbering";
import {
  buildOfferSnapshot,
  createOfferVersion,
  OFFER_SNAPSHOT_SELECT,
  readLatestSnapshot,
} from "@/modules/offers/versions";
import {
  ACCEPTED_STATUS_CODE,
  CANCELLED_STATUS_CODE,
  MAX_COMMENT_LENGTH,
  PROFILE_DAYS_FIELD_PREFIX,
  emptyOfferFormValues,
  readOfferFormValues,
  validateOfferInput,
  type OfferFormValues,
  type ValidatedOffer,
} from "@/modules/offers/validation";

/**
 * Casos de uso de escritura del Gestor de Ofertas.
 *
 * Toda mutación empieza exigiendo sesión (`requireUser`) y comprobando en
 * **servidor** que el usuario puede actuar sobre esa oferta: ocultar un botón
 * en la interfaz nunca es autorización. Los recursos no autorizados devuelven
 * el mismo resultado que los inexistentes, para no filtrar su existencia.
 *
 * El alta y la modificación comparten reglas de validación (`validation.ts`) y
 * componente de formulario. Aquí se añaden las comprobaciones que necesitan
 * base de datos y la persistencia transaccional de oferta, jornadas, histórico
 * de estados, versión funcional, auditoría y notificaciones.
 */

function errorState(
  errors: FieldErrors,
  values: OfferFormValues,
  previous: OfferFormState,
): OfferFormState {
  return {
    status: "error",
    errors,
    values,
    // Testigo que permite al formulario distinguir una respuesta nueva y
    // volcar de nuevo los valores enviados (ver `offer-form.tsx`).
    submission: previous.submission + 1,
  };
}

type ReferenceCheckTarget = {
  field: string;
  label: string;
  id: string | null;
  currentId: string | null;
  lookup: (id: string) => Promise<{ isActive: boolean } | null>;
};

/**
 * Comprueba que cada relación enviada existe y sigue siendo utilizable.
 *
 * Un maestro desactivado no puede seleccionarse de nuevo, pero sí puede
 * conservarse si la oferta que se edita ya lo tenía: desactivar un catálogo
 * nunca debe impedir guardar una oferta histórica que lo referencia.
 */
async function checkReferences(
  targets: ReferenceCheckTarget[],
  errors: FieldErrors,
): Promise<void> {
  await Promise.all(
    targets.map(async (target) => {
      if (!target.id) {
        return;
      }
      const record = await target.lookup(target.id);
      if (!record) {
        errors[target.field] = `${target.label} seleccionado ya no existe. Recarga la página.`;
        return;
      }
      if (!record.isActive && target.id !== target.currentId) {
        errors[target.field] =
          `${target.label} seleccionado está desactivado y no puede asignarse.`;
      }
    }),
  );
}

type CurrentOffer = {
  id: string;
  number: string;
  clientId: string;
  priorityId: string;
  commercialId: string;
  projectManagerId: string;
  originId: string;
  offerTypeId: string;
  statusId: string;
  segmentationId: string | null;
  languageId: string | null;
  cancellationReasonId: string | null;
};

async function validateAgainstDatabase(
  data: ValidatedOffer,
  current: CurrentOffer | null,
): Promise<FieldErrors> {
  const errors: FieldErrors = {};

  await checkReferences(
    [
      {
        field: "priorityId",
        label: "La prioridad",
        id: data.priorityId,
        currentId: current?.priorityId ?? null,
        lookup: (id) =>
          prisma.priority.findUnique({ where: { id }, select: { isActive: true } }),
      },
      {
        field: "originId",
        label: "El origen",
        id: data.originId,
        currentId: current?.originId ?? null,
        lookup: (id) =>
          prisma.origin.findUnique({ where: { id }, select: { isActive: true } }),
      },
      {
        field: "offerTypeId",
        label: "El tipo de oferta",
        id: data.offerTypeId,
        currentId: current?.offerTypeId ?? null,
        lookup: (id) =>
          prisma.offerType.findUnique({ where: { id }, select: { isActive: true } }),
      },
      {
        field: "statusId",
        label: "El estado",
        id: data.statusId,
        currentId: current?.statusId ?? null,
        lookup: (id) =>
          prisma.offerStatus.findUnique({ where: { id }, select: { isActive: true } }),
      },
      {
        field: "segmentationId",
        label: "La segmentación",
        id: data.segmentationId,
        currentId: current?.segmentationId ?? null,
        lookup: (id) =>
          prisma.segmentation.findUnique({ where: { id }, select: { isActive: true } }),
      },
      {
        field: "languageId",
        label: "El idioma",
        id: data.languageId,
        currentId: current?.languageId ?? null,
        lookup: (id) =>
          prisma.language.findUnique({ where: { id }, select: { isActive: true } }),
      },
      {
        field: "cancellationReasonId",
        label: "El motivo de cancelación",
        id: data.cancellationReasonId,
        currentId: current?.cancellationReasonId ?? null,
        lookup: (id) =>
          prisma.cancellationReason.findUnique({
            where: { id },
            select: { isActive: true },
          }),
      },
    ],
    errors,
  );

  // Cliente: además de existir y estar activo, un cliente **sin código** no
  // puede elegirse para una oferta nueva (DEV-004). La oferta histórica que ya
  // lo usaba sí puede seguir guardándose sin inventar un código.
  const client = await prisma.client.findUnique({
    where: { id: data.clientId },
    select: { isActive: true, code: true },
  });

  if (!client) {
    errors.clientId = "El cliente seleccionado ya no existe. Recarga la página.";
  } else if (!client.isActive && data.clientId !== current?.clientId) {
    errors.clientId = "El cliente seleccionado está desactivado y no puede asignarse.";
  } else if (client.code === null && data.clientId !== current?.clientId) {
    errors.clientId =
      "El cliente seleccionado todavía no tiene código. Infórmalo en Administración > Clientes antes de usarlo en una oferta.";
  }

  // Personas: además de existir y estar activas, deben tener la habilitación
  // correspondiente (DEC-013: una sola tabla con dos indicadores).
  const [commercial, projectManager] = await Promise.all([
    prisma.person.findUnique({
      where: { id: data.commercialId },
      select: { isActive: true, canBeCommercial: true },
    }),
    prisma.person.findUnique({
      where: { id: data.projectManagerId },
      select: { isActive: true, canBeProjectManager: true },
    }),
  ]);

  if (!commercial) {
    errors.commercialId = "La persona seleccionada como comercial ya no existe.";
  } else if (!commercial.canBeCommercial) {
    errors.commercialId = "La persona seleccionada no está habilitada como comercial.";
  } else if (!commercial.isActive && data.commercialId !== current?.commercialId) {
    errors.commercialId = "La persona seleccionada como comercial está inactiva.";
  }

  if (!projectManager) {
    errors.projectManagerId = "La persona seleccionada como PM ya no existe.";
  } else if (!projectManager.canBeProjectManager) {
    errors.projectManagerId =
      "La persona seleccionada no está habilitada como Project Manager.";
  } else if (
    !projectManager.isActive &&
    data.projectManagerId !== current?.projectManagerId
  ) {
    errors.projectManagerId = "La persona seleccionada como PM está inactiva.";
  }

  // Perfiles con jornadas: deben existir.
  if (data.profileDays.length > 0) {
    const ids = data.profileDays.map((entry) => entry.professionalProfileId);
    const found = await prisma.professionalProfile.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    });
    if (found.length !== ids.length) {
      errors._form =
        "Alguno de los perfiles profesionales enviados ya no existe. Recarga la página.";
    }
  }

  return errors;
}

/** Campos escalares de la oferta compartidos por el alta y la modificación. */
function toOfferScalarData(data: ValidatedOffer) {
  return {
    clientId: data.clientId,
    priorityId: data.priorityId,
    commercialId: data.commercialId,
    offerDate: fromDateInputValue(data.offerDate),
    originId: data.originId,
    projectManagerId: data.projectManagerId,
    description: data.description,
    offerTypeId: data.offerTypeId,
    totalAmount: data.totalAmount,
    statusId: data.statusId,
    requesterName: data.requesterName,
    implantationText: data.implantationText,
    estimatedCommercialDeliveryDate: data.estimatedCommercialDeliveryDate
      ? fromDateInputValue(data.estimatedCommercialDeliveryDate)
      : null,
    estimatedClientDeliveryDate: data.estimatedClientDeliveryDate
      ? fromDateInputValue(data.estimatedClientDeliveryDate)
      : null,
    commercialDays: data.commercialDays,
    estimatedPortfolioDate: data.estimatedPortfolioDate
      ? fromDateInputValue(data.estimatedPortfolioDate)
      : null,
    segmentationId: data.segmentationId,
    notes: data.notes,
    languageId: data.languageId,
    navisionOrder: data.navisionOrder,
    cancellationReasonId: data.cancellationReasonId,
  };
}

/**
 * Relee los valores enviados cuando el guardado falla por un error técnico,
 * conservando también las jornadas escritas por el usuario.
 */
function readSubmittedValues(formData: FormData): OfferFormValues {
  const profileIds: string[] = [];
  for (const key of formData.keys()) {
    if (key.startsWith(`${PROFILE_DAYS_FIELD_PREFIX}.`)) {
      profileIds.push(key.slice(PROFILE_DAYS_FIELD_PREFIX.length + 1));
    }
  }
  return readOfferFormValues(formData, profileIds);
}

/** Representación de la oferta para la auditoría (sin datos técnicos). */
function auditSnapshot(data: ValidatedOffer): Record<string, unknown> {
  return {
    clientId: data.clientId,
    priorityId: data.priorityId,
    commercialId: data.commercialId,
    projectManagerId: data.projectManagerId,
    originId: data.originId,
    offerTypeId: data.offerTypeId,
    statusId: data.statusId,
    segmentationId: data.segmentationId,
    languageId: data.languageId,
    cancellationReasonId: data.cancellationReasonId,
    offerDate: data.offerDate,
    description: data.description,
    requesterName: data.requesterName,
    totalAmount: data.totalAmount,
    implantationText: data.implantationText,
    estimatedCommercialDeliveryDate: data.estimatedCommercialDeliveryDate,
    estimatedClientDeliveryDate: data.estimatedClientDeliveryDate,
    estimatedPortfolioDate: data.estimatedPortfolioDate,
    commercialDays: data.commercialDays,
    notes: data.notes,
    navisionOrder: data.navisionOrder,
    profileDays: Object.fromEntries(
      data.profileDays.map((entry) => [entry.professionalProfileId, entry.days]),
    ),
  };
}

async function loadValidationContext() {
  const [profiles, specialStatuses, activeCancellationReasons] = await Promise.all([
    prisma.professionalProfile.findMany({ select: { id: true } }),
    prisma.offerStatus.findMany({
      where: { code: { in: [CANCELLED_STATUS_CODE, ACCEPTED_STATUS_CODE] } },
      select: { id: true, code: true },
    }),
    prisma.cancellationReason.count({ where: { isActive: true } }),
  ]);

  return {
    professionalProfileIds: profiles.map((profile) => profile.id),
    cancelledStatusIds: specialStatuses
      .filter((status) => status.code === CANCELLED_STATUS_CODE)
      .map((status) => status.id),
    acceptedStatusIds: specialStatuses
      .filter((status) => status.code === ACCEPTED_STATUS_CODE)
      .map((status) => status.id),
    activeCancellationReasons,
  };
}

/** Datos de la oferta que necesita el motor de notificaciones. */
async function loadEventSubject(
  tx: Prisma.TransactionClient,
  offerId: string,
): Promise<OfferEventSubject> {
  const offer = await tx.offer.findUniqueOrThrow({
    where: { id: offerId },
    select: {
      id: true,
      number: true,
      statusId: true,
      clientId: true,
      description: true,
      commercialId: true,
      projectManagerId: true,
      createdById: true,
      deletedAt: true,
      status: { select: { name: true } },
      client: { select: { name: true } },
      createdBy: { select: { personId: true } },
    },
  });

  return {
    id: offer.id,
    number: offer.number,
    statusId: offer.statusId,
    statusName: offer.status.name,
    clientId: offer.clientId,
    clientName: offer.client.name,
    description: offer.description,
    commercialPersonId: offer.commercialId,
    projectManagerPersonId: offer.projectManagerId,
    createdByUserId: offer.createdById,
    createdByPersonId: offer.createdBy?.personId ?? null,
    isArchived: offer.deletedAt !== null,
  };
}

/** Códigos de estado que generan una revisión pendiente, con sus ids. */
async function loadReviewStatusIds(tx: Prisma.TransactionClient) {
  const statuses = await tx.offerStatus.findMany({
    where: {
      code: { in: [PENDING_PM_REVIEW_STATUS_CODE, PENDING_SALES_REVIEW_STATUS_CODE] },
    },
    select: { id: true, code: true },
  });
  return {
    pendingPmIds: statuses
      .filter((status) => status.code === PENDING_PM_REVIEW_STATUS_CODE)
      .map((status) => status.id),
    pendingSalesIds: statuses
      .filter((status) => status.code === PENDING_SALES_REVIEW_STATUS_CODE)
      .map((status) => status.id),
  };
}

/**
 * Dispara, además del evento principal, los disparadores de «pendiente de
 * revisión» cuando el estado resultante los genera.
 */
async function dispatchReviewPending(
  tx: Prisma.TransactionClient,
  subject: OfferEventSubject,
  actorUserId: string | null,
): Promise<void> {
  const { pendingPmIds, pendingSalesIds } = await loadReviewStatusIds(tx);

  if (pendingPmIds.includes(subject.statusId)) {
    await dispatchNotifications(tx, {
      trigger: "OFFER_PENDING_PM_REVIEW",
      offer: subject,
      actorUserId,
      eventId: `pending-pm:${subject.statusId}:${Date.now()}`,
      detail: "Pendiente de tu revisión como Project Manager.",
    });
  }

  if (pendingSalesIds.includes(subject.statusId)) {
    await dispatchNotifications(tx, {
      trigger: "OFFER_PENDING_SALES_REVIEW",
      offer: subject,
      actorUserId,
      eventId: `pending-sales:${subject.statusId}:${Date.now()}`,
      detail: "Pendiente de tu revisión como comercial.",
    });
  }
}

// ---------------------------------------------------------------------------
// Alta y modificación
// ---------------------------------------------------------------------------

export async function createOfferAction(
  previousState: OfferFormState,
  formData: FormData,
): Promise<OfferFormState> {
  const user = await requireUser();
  let createdOfferId: string;

  try {
    const context = await loadValidationContext();
    const values = readOfferFormValues(formData, context.professionalProfileIds);

    const validation = validateOfferInput(values, {
      cancelledStatusIds: context.cancelledStatusIds,
      acceptedStatusIds: context.acceptedStatusIds,
      professionalProfileIds: context.professionalProfileIds,
      hasSelectableCancellationReasons: context.activeCancellationReasons > 0,
    });

    if (!validation.ok) {
      return errorState(validation.errors, values, previousState);
    }

    const databaseErrors = await validateAgainstDatabase(validation.data, null);
    if (Object.keys(databaseErrors).length > 0) {
      return errorState(databaseErrors, values, previousState);
    }

    const data = validation.data;

    createdOfferId = await prisma.$transaction(async (tx) => {
      const createdAt = new Date();
      // El número se consume aquí y solo aquí: abrir o cancelar el
      // formulario nunca gasta un número (DEC-011). Si el contador no existe,
      // la transacción falla entera y **no** se inicializa en silencio.
      const number = await assignOfferNumber(tx, createdAt);

      const offer = await tx.offer.create({
        data: {
          number,
          createdById: user.id,
          ...toOfferScalarData(data),
          profileDays: {
            create: data.profileDays.map((entry) => ({
              professionalProfileId: entry.professionalProfileId,
              days: entry.days,
            })),
          },
          statusHistory: {
            // Primer evento del histórico: sin estado anterior.
            create: [{ newStatusId: data.statusId, actorId: user.id }],
          },
        },
        select: { id: true },
      });

      const persisted = await tx.offer.findUniqueOrThrow({
        where: { id: offer.id },
        select: OFFER_SNAPSHOT_SELECT,
      });

      await createOfferVersion(tx, {
        offerId: offer.id,
        authorId: user.id,
        snapshot: buildOfferSnapshot(persisted),
      });

      await recordAudit(tx, {
        entityType: "Offer",
        entityId: offer.id,
        action: "CREATE",
        actorId: user.id,
        changes: { number, ...auditSnapshot(data) },
      });

      const subject = await loadEventSubject(tx, offer.id);
      await dispatchNotifications(tx, {
        trigger: "OFFER_CREATED",
        offer: subject,
        actorUserId: user.id,
        eventId: "created",
      });
      await dispatchReviewPending(tx, subject, user.id);

      return offer.id;
    });
  } catch (error) {
    return errorState(
      { _form: toSafeErrorMessage(error) },
      readSubmittedValues(formData),
      previousState,
    );
  }

  revalidatePath("/offers");
  redirect(`/offers/${createdOfferId}?saved=created`);
}

export async function updateOfferAction(
  previousState: OfferFormState,
  formData: FormData,
): Promise<OfferFormState> {
  const user = await requireUser();

  const offerId = formData.get("offerId");
  if (typeof offerId !== "string" || offerId === "") {
    return errorState(
      { _form: "No se ha podido identificar la oferta que se está modificando." },
      emptyOfferFormValues(),
      previousState,
    );
  }

  try {
    const context = await loadValidationContext();
    const values = readOfferFormValues(formData, context.professionalProfileIds);

    const current = await prisma.offer.findFirst({
      where: { id: offerId },
      select: {
        id: true,
        number: true,
        deletedAt: true,
        createdById: true,
        clientId: true,
        priorityId: true,
        commercialId: true,
        projectManagerId: true,
        originId: true,
        offerTypeId: true,
        statusId: true,
        segmentationId: true,
        languageId: true,
        cancellationReasonId: true,
        offerDate: true,
        description: true,
        requesterName: true,
        totalAmount: true,
        implantationText: true,
        estimatedCommercialDeliveryDate: true,
        estimatedClientDeliveryDate: true,
        estimatedPortfolioDate: true,
        commercialDays: true,
        notes: true,
        navisionOrder: true,
        profileDays: { select: { professionalProfileId: true, days: true } },
      },
    });

    // Una oferta inexistente y una a la que el usuario no tiene acceso dan el
    // mismo mensaje: no se filtra la existencia de un recurso ajeno.
    if (!current || !canAccessOffer(user, current)) {
      return errorState(
        { _form: "La oferta ya no está disponible. Vuelve al listado y recarga la página." },
        values,
        previousState,
      );
    }

    if (current.deletedAt !== null) {
      return errorState(
        {
          _form:
            "Esta oferta está archivada y solo puede consultarse. Recupérala antes de modificar sus datos.",
        },
        values,
        previousState,
      );
    }

    // El motivo de cancelación actual sigue siendo seleccionable aunque su
    // maestro se haya desactivado después.
    const hasSelectableCancellationReasons =
      context.activeCancellationReasons > 0 || current.cancellationReasonId !== null;

    const validation = validateOfferInput(values, {
      cancelledStatusIds: context.cancelledStatusIds,
      acceptedStatusIds: context.acceptedStatusIds,
      professionalProfileIds: context.professionalProfileIds,
      hasSelectableCancellationReasons,
    });

    if (!validation.ok) {
      return errorState(validation.errors, values, previousState);
    }

    const databaseErrors = await validateAgainstDatabase(validation.data, current);
    if (Object.keys(databaseErrors).length > 0) {
      return errorState(databaseErrors, values, previousState);
    }

    const data = validation.data;

    await prisma.$transaction(async (tx) => {
      await persistOfferChanges(tx, {
        offerId: current.id,
        actor: user,
        data,
        previousStatusId: current.statusId,
        auditBefore: buildAuditBefore(current),
      });
    });
  } catch (error) {
    return errorState(
      { _form: toSafeErrorMessage(error) },
      readSubmittedValues(formData),
      previousState,
    );
  }

  revalidatePath("/offers");
  revalidatePath(`/offers/${offerId}`);
  redirect(`/offers/${offerId}?saved=updated`);
}

type AuditBeforeSource = {
  clientId: string;
  priorityId: string;
  commercialId: string;
  projectManagerId: string;
  originId: string;
  offerTypeId: string;
  statusId: string;
  segmentationId: string | null;
  languageId: string | null;
  cancellationReasonId: string | null;
  offerDate: Date;
  description: string;
  requesterName: string;
  totalAmount: Prisma.Decimal;
  implantationText: string | null;
  estimatedCommercialDeliveryDate: Date | null;
  estimatedClientDeliveryDate: Date | null;
  estimatedPortfolioDate: Date | null;
  commercialDays: Prisma.Decimal | null;
  notes: string | null;
  navisionOrder: string | null;
  profileDays: Array<{ professionalProfileId: string; days: Prisma.Decimal }>;
};

function buildAuditBefore(current: AuditBeforeSource): Record<string, unknown> {
  return {
    clientId: current.clientId,
    priorityId: current.priorityId,
    commercialId: current.commercialId,
    projectManagerId: current.projectManagerId,
    originId: current.originId,
    offerTypeId: current.offerTypeId,
    statusId: current.statusId,
    segmentationId: current.segmentationId,
    languageId: current.languageId,
    cancellationReasonId: current.cancellationReasonId,
    offerDate: current.offerDate.toISOString().slice(0, 10),
    description: current.description,
    requesterName: current.requesterName,
    totalAmount: current.totalAmount.toFixed(2),
    implantationText: current.implantationText,
    estimatedCommercialDeliveryDate:
      current.estimatedCommercialDeliveryDate?.toISOString().slice(0, 10) ?? null,
    estimatedClientDeliveryDate:
      current.estimatedClientDeliveryDate?.toISOString().slice(0, 10) ?? null,
    estimatedPortfolioDate:
      current.estimatedPortfolioDate?.toISOString().slice(0, 10) ?? null,
    commercialDays: current.commercialDays?.toFixed(2) ?? null,
    notes: current.notes,
    navisionOrder: current.navisionOrder,
    profileDays: JSON.stringify(
      Object.fromEntries(
        current.profileDays
          .map(
            (entry) => [entry.professionalProfileId, entry.days.toFixed(2)] as const,
          )
          .sort((left, right) => left[0].localeCompare(right[0])),
      ),
    ),
  };
}

/**
 * Persiste una modificación completa de la oferta: escalares, jornadas,
 * histórico de estados, versión funcional, auditoría y notificaciones.
 *
 * Todo ocurre dentro de la transacción que recibe, de modo que o se confirma
 * entero o no queda nada: nunca una versión sin su dato, ni una notificación
 * de un cambio revertido.
 */
async function persistOfferChanges(
  tx: Prisma.TransactionClient,
  options: {
    offerId: string;
    actor: AuthenticatedUser;
    data: ValidatedOffer;
    previousStatusId: string;
    auditBefore: Record<string, unknown>;
  },
): Promise<void> {
  const { offerId, actor, data, previousStatusId } = options;
  const statusChanged = previousStatusId !== data.statusId;

  const previousSnapshot = await readLatestSnapshot(tx, offerId);

  // `number` y `createdAt` no se tocan nunca: el número es inmutable.
  await tx.offer.update({
    where: { id: offerId },
    data: toOfferScalarData(data),
  });

  // Sincronización de jornadas: se eliminan las filas que ya no tienen valor y
  // se insertan o actualizan las demás. La restricción única (oferta, perfil)
  // impide duplicados incluso ante envíos repetidos.
  const desiredIds = data.profileDays.map((entry) => entry.professionalProfileId);
  await tx.offerProfileDays.deleteMany({
    where: {
      offerId,
      ...(desiredIds.length > 0
        ? { professionalProfileId: { notIn: desiredIds } }
        : {}),
    },
  });

  for (const entry of data.profileDays) {
    await tx.offerProfileDays.upsert({
      where: {
        offerId_professionalProfileId: {
          offerId,
          professionalProfileId: entry.professionalProfileId,
        },
      },
      create: {
        offerId,
        professionalProfileId: entry.professionalProfileId,
        days: entry.days,
      },
      update: { days: entry.days },
    });
  }

  if (statusChanged) {
    await tx.offerStatusHistory.create({
      data: {
        offerId,
        previousStatusId,
        newStatusId: data.statusId,
        actorId: actor.id,
      },
    });
  }

  const persisted = await tx.offer.findUniqueOrThrow({
    where: { id: offerId },
    select: OFFER_SNAPSHOT_SELECT,
  });

  // Una nueva versión solo si algún campo funcional o alguna jornada cambió.
  await createOfferVersion(tx, {
    offerId,
    authorId: actor.id,
    snapshot: buildOfferSnapshot(persisted),
    previousSnapshot,
  });

  const after = {
    ...auditSnapshot(data),
    profileDays: JSON.stringify(
      Object.fromEntries(
        data.profileDays
          .map((entry) => [entry.professionalProfileId, entry.days] as const)
          .sort((left, right) => left[0].localeCompare(right[0])),
      ),
    ),
  };

  const changes = diffChanges(options.auditBefore, after);

  if (Object.keys(changes).length > 0) {
    await recordAudit(tx, {
      entityType: "Offer",
      entityId: offerId,
      action: "UPDATE",
      actorId: actor.id,
      changes,
    });
  }

  if (statusChanged) {
    await recordAudit(tx, {
      entityType: "Offer",
      entityId: offerId,
      action: "STATUS_CHANGE",
      actorId: actor.id,
      changes: { estado: { antes: previousStatusId, despues: data.statusId } },
    });

    const subject = await loadEventSubject(tx, offerId);
    await dispatchNotifications(tx, {
      trigger: "OFFER_STATUS_CHANGED",
      offer: subject,
      actorUserId: actor.id,
      eventId: `status:${previousStatusId}->${data.statusId}:${Date.now()}`,
      detail: `Nuevo estado: ${subject.statusName}.`,
    });
    await dispatchReviewPending(tx, subject, actor.id);
  }
}

// ---------------------------------------------------------------------------
// Comentarios internos
// ---------------------------------------------------------------------------

/**
 * Añade un comentario interno.
 *
 * El autor y la fecha proceden **siempre** de la sesión y del reloj del
 * servidor: el formulario no los envía ni puede alterarlos.
 */
export async function addOfferCommentAction(
  _previousState: OfferActionState,
  formData: FormData,
): Promise<OfferActionState> {
  const user = await requireUser();
  const offerId = readString(formData, "offerId");
  const body = normalizeSpaces(readString(formData, "body"));

  if (!offerId) {
    return actionError({ _form: "No se ha podido identificar la oferta." });
  }
  if (body === "") {
    return actionError({ body: "El comentario no puede estar vacío." });
  }
  if (body.length > MAX_COMMENT_LENGTH) {
    return actionError({
      body: `El comentario no puede superar ${MAX_COMMENT_LENGTH} caracteres.`,
    });
  }

  try {
    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      select: { id: true, createdById: true, commercialId: true, projectManagerId: true },
    });

    if (!offer || !canAccessOffer(user, offer)) {
      return actionError({ _form: "La oferta ya no está disponible." });
    }

    await prisma.$transaction(async (tx) => {
      const comment = await tx.offerComment.create({
        data: { offerId, authorId: user.id, body },
        select: { id: true },
      });

      await recordAudit(tx, {
        entityType: "OfferComment",
        entityId: comment.id,
        action: "COMMENT",
        actorId: user.id,
        changes: { oferta: offerId, longitud: body.length },
      });

      const subject = await loadEventSubject(tx, offerId);
      await dispatchNotifications(tx, {
        trigger: "OFFER_COMMENT_ADDED",
        offer: subject,
        actorUserId: user.id,
        eventId: `comment:${comment.id}`,
        detail: `Nuevo comentario de ${user.personName}.`,
      });
    });
  } catch (error) {
    return actionError({ _form: toSafeErrorMessage(error) });
  }

  revalidatePath(`/offers/${offerId}`);
  return actionSuccess("Comentario añadido.");
}

// ---------------------------------------------------------------------------
// Archivo lógico y recuperación
// ---------------------------------------------------------------------------

/**
 * Archiva una oferta (eliminación lógica, `DEC-016`).
 *
 * Archivar **no** cambia el estado de negocio ni borra nada: la oferta
 * desaparece del listado ordinario, conserva su número, sus jornadas, su
 * histórico, sus versiones, sus comentarios, sus adjuntos y sus
 * notificaciones, y puede recuperarse en cualquier momento.
 */
export async function archiveOfferAction(
  _previousState: OfferActionState,
  formData: FormData,
): Promise<OfferActionState> {
  return setOfferArchived(formData, true);
}

/** Recupera una oferta archivada, devolviéndola al listado ordinario. */
export async function restoreOfferAction(
  _previousState: OfferActionState,
  formData: FormData,
): Promise<OfferActionState> {
  return setOfferArchived(formData, false);
}

async function setOfferArchived(
  formData: FormData,
  archive: boolean,
): Promise<OfferActionState> {
  const user = await requireUser();
  const offerId = readString(formData, "offerId");

  if (!offerId) {
    return actionError({ _form: "No se ha podido identificar la oferta." });
  }

  try {
    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      select: {
        id: true,
        number: true,
        deletedAt: true,
        createdById: true,
        commercialId: true,
        projectManagerId: true,
      },
    });

    if (!offer || !canAccessOffer(user, offer)) {
      return actionError({ _form: "La oferta ya no está disponible." });
    }

    const alreadyInTargetState = archive
      ? offer.deletedAt !== null
      : offer.deletedAt === null;

    if (alreadyInTargetState) {
      return actionError({
        _form: archive
          ? "La oferta ya estaba archivada."
          : "La oferta no está archivada.",
      });
    }

    await prisma.$transaction(async (tx) => {
      const now = new Date();
      await tx.offer.update({
        where: { id: offerId },
        data: archive
          ? { deletedAt: now, archivedById: user.id }
          : { deletedAt: null, restoredAt: now, restoredById: user.id },
      });

      await recordAudit(tx, {
        entityType: "Offer",
        entityId: offerId,
        action: archive ? "ARCHIVE" : "RESTORE",
        actorId: user.id,
        changes: {
          archivada: { antes: !archive, despues: archive },
          numero: offer.number,
        },
      });
    });
  } catch (error) {
    return actionError({ _form: toSafeErrorMessage(error) });
  }

  revalidatePath("/offers");
  revalidatePath(`/offers/${offerId}`);
  return actionSuccess(
    archive
      ? "Oferta archivada. No se ha borrado nada: puedes consultarla y recuperarla desde «Ofertas archivadas»."
      : "Oferta recuperada con el mismo número y los mismos datos.",
  );
}

// ---------------------------------------------------------------------------
// Revisión
// ---------------------------------------------------------------------------

/**
 * Completa una revisión pendiente.
 *
 * Regla aprobada (`DEC-051`): para dar por revisada una oferta es obligatorio
 * elegir un estado **distinto** del que generó la pendiente. Cualquier otra
 * transición entre estados activos sigue permitida; no existe una máquina de
 * estados ni estados terminales.
 *
 * Si otra persona ya movió la oferta, no se sobrescribe en silencio: se avisa
 * del conflicto para que se recarguen los datos.
 */
export async function reviewOfferAction(
  _previousState: OfferActionState,
  formData: FormData,
): Promise<OfferActionState> {
  const user = await requireUser();
  const offerId = readString(formData, "offerId");
  const newStatusId = readString(formData, "statusId");
  const expectedStatusId = readString(formData, "expectedStatusId");
  const comment = normalizeSpaces(readString(formData, "comment"));
  const navisionOrderInput = normalizeSpaces(readString(formData, "navisionOrder"));

  if (!offerId) {
    return actionError({ _form: "No se ha podido identificar la oferta." });
  }
  if (!newStatusId) {
    return actionError({ statusId: "Selecciona el nuevo estado de la oferta." });
  }
  if (comment.length > MAX_COMMENT_LENGTH) {
    return actionError({
      comment: `El comentario no puede superar ${MAX_COMMENT_LENGTH} caracteres.`,
    });
  }

  try {
    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      select: {
        id: true,
        number: true,
        statusId: true,
        deletedAt: true,
        navisionOrder: true,
        createdById: true,
        commercialId: true,
        projectManagerId: true,
      },
    });

    if (!offer || !canAccessOffer(user, offer)) {
      return actionError({ _form: "La oferta ya no está disponible." });
    }
    if (offer.deletedAt !== null) {
      return actionError({
        _form: "La oferta está archivada. Recupérala antes de revisarla.",
      });
    }
    if (expectedStatusId && offer.statusId !== expectedStatusId) {
      return actionError({
        _form:
          "Otra persona ha cambiado el estado de esta oferta mientras la revisabas. Vuelve a abrirla para ver los datos actuales.",
      });
    }
    if (offer.statusId === newStatusId) {
      return actionError({
        statusId:
          "Para completar la revisión tienes que elegir un estado distinto del actual.",
      });
    }

    const status = await prisma.offerStatus.findUnique({
      where: { id: newStatusId },
      select: { isActive: true, code: true, name: true },
    });

    if (!status || !status.isActive) {
      return actionError({ statusId: "El estado seleccionado no está disponible." });
    }

    // El pedido de Navision se exige también al revisar (DEC-052).
    const navisionOrder = navisionOrderInput || offer.navisionOrder;
    if (status.code === ACCEPTED_STATUS_CODE && !navisionOrder) {
      return actionError({
        navisionOrder:
          "El pedido de Navision es obligatorio cuando el estado es Aceptado.",
      });
    }

    // Anular desde la revisión exige un motivo, que esta pantalla no pide: se
    // remite al formulario completo en lugar de inventar uno.
    if (status.code === CANCELLED_STATUS_CODE) {
      return actionError({
        statusId:
          "Para anular una oferta usa «Modificar»: el motivo de cancelación es obligatorio y se elige allí.",
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.offer.update({
        where: { id: offerId },
        data: {
          statusId: newStatusId,
          ...(navisionOrderInput ? { navisionOrder: navisionOrderInput } : {}),
        },
      });

      await tx.offerStatusHistory.create({
        data: {
          offerId,
          previousStatusId: offer.statusId,
          newStatusId,
          actorId: user.id,
        },
      });

      const persisted = await tx.offer.findUniqueOrThrow({
        where: { id: offerId },
        select: OFFER_SNAPSHOT_SELECT,
      });
      const previousSnapshot = await readLatestSnapshot(tx, offerId);

      // Una revisión cambia el estado, así que genera versión (bloque 4.2).
      await createOfferVersion(tx, {
        offerId,
        authorId: user.id,
        snapshot: buildOfferSnapshot(persisted),
        previousSnapshot,
      });

      await recordAudit(tx, {
        entityType: "Offer",
        entityId: offerId,
        action: "REVIEW",
        actorId: user.id,
        changes: {
          estado: { antes: offer.statusId, despues: newStatusId },
          conComentario: comment !== "",
        },
      });

      if (comment !== "") {
        const created = await tx.offerComment.create({
          data: { offerId, authorId: user.id, body: comment },
          select: { id: true },
        });
        await recordAudit(tx, {
          entityType: "OfferComment",
          entityId: created.id,
          action: "COMMENT",
          actorId: user.id,
          changes: { oferta: offerId, longitud: comment.length },
        });
      }

      const subject = await loadEventSubject(tx, offerId);
      await dispatchNotifications(tx, {
        trigger: "OFFER_STATUS_CHANGED",
        offer: subject,
        actorUserId: user.id,
        eventId: `review:${offer.statusId}->${newStatusId}:${Date.now()}`,
        detail: `Revisada por ${user.personName}. Nuevo estado: ${status.name}.`,
      });
      await dispatchReviewPending(tx, subject, user.id);
    });
  } catch (error) {
    return actionError({ _form: toSafeErrorMessage(error) });
  }

  revalidatePath("/offers");
  revalidatePath("/offers/pending-review");
  revalidatePath(`/offers/${offerId}`);
  return actionSuccess("Revisión completada y estado actualizado.");
}

/** Reexportado para las pantallas que solo necesitan saber si es administrador. */
export async function currentUserIsAdmin(): Promise<boolean> {
  const user = await requireUser();
  return isAdmin(user);
}

// ---------------------------------------------------------------------------
// Adjuntos de oferta (bloque 6)
// ---------------------------------------------------------------------------

/**
 * Sube un adjunto a una oferta.
 *
 * El fichero se escribe en disco con un nombre físico aleatorio (nunca el
 * nombre original) antes de guardar los metadatos; si la base de datos falla
 * después, se limpia el fichero para no dejar binarios huérfanos.
 */
export async function uploadOfferAttachmentAction(
  _previousState: OfferActionState,
  formData: FormData,
): Promise<OfferActionState> {
  const user = await requireUser();
  const offerId = readString(formData, "offerId");
  const file = formData.get("file");

  if (!offerId) {
    return actionError({ _form: "No se ha podido identificar la oferta." });
  }
  if (!(file instanceof File) || file.size === 0) {
    return actionError({ file: "Selecciona un archivo." });
  }

  const validationError = validateAttachment({
    name: file.name,
    size: file.size,
    type: file.type,
  });
  if (validationError) {
    return actionError({ file: ATTACHMENT_VALIDATION_MESSAGES[validationError] });
  }

  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    select: { id: true, createdById: true, commercialId: true, projectManagerId: true },
  });

  if (!offer || !canAccessOffer(user, offer)) {
    return actionError({ _form: "La oferta ya no está disponible." });
  }

  let storageKey: string | null = null;
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    storageKey = await saveAttachmentFile(file.name, buffer);

    await prisma.$transaction(async (tx) => {
      const attachment = await tx.offerAttachment.create({
        data: {
          offerId,
          originalName: file.name.slice(0, 255),
          storageKey: storageKey!,
          contentType: file.type || "application/octet-stream",
          sizeBytes: file.size,
          uploadedById: user.id,
        },
        select: { id: true },
      });

      await recordAudit(tx, {
        entityType: "OfferAttachment",
        entityId: attachment.id,
        action: "ATTACHMENT_ADDED",
        actorId: user.id,
        changes: { oferta: offerId, nombre: file.name, tamano: file.size },
      });

      const subject = await loadEventSubject(tx, offerId);
      await dispatchNotifications(tx, {
        trigger: "OFFER_ATTACHMENT_ADDED",
        offer: subject,
        actorUserId: user.id,
        eventId: `attachment:${attachment.id}`,
        detail: `${user.personName} ha adjuntado «${file.name}».`,
      });
    });
  } catch (error) {
    // La base de datos falló después de escribir el fichero: se limpia para
    // no dejar un binario huérfano sin metadatos que lo referencien.
    if (storageKey) {
      await deleteAttachmentFile(storageKey);
    }
    return actionError({ _form: toSafeErrorMessage(error) });
  }

  revalidatePath(`/offers/${offerId}`);
  return actionSuccess(`Archivo «${file.name}» adjuntado.`);
}

/**
 * Retira lógicamente un adjunto. Solo su autor o un administrador pueden
 * hacerlo. No se purga el binario: queda registrado como retirado y deja de
 * poder descargarse.
 */
export async function removeOfferAttachmentAction(
  _previousState: OfferActionState,
  formData: FormData,
): Promise<OfferActionState> {
  const user = await requireUser();
  const offerId = readString(formData, "offerId");
  const attachmentId = readString(formData, "attachmentId");

  if (!offerId || !attachmentId) {
    return actionError({ _form: "No se ha podido identificar el adjunto." });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const offer = await tx.offer.findUnique({
        where: { id: offerId },
        select: { id: true, createdById: true, commercialId: true, projectManagerId: true },
      });
      if (!offer || !canAccessOffer(user, offer)) {
        return null;
      }

      const attachment = await tx.offerAttachment.findUnique({
        where: { id: attachmentId },
        select: { id: true, offerId: true, originalName: true, uploadedById: true, removedAt: true },
      });
      if (!attachment || attachment.offerId !== offerId) {
        return null;
      }
      if (attachment.removedAt !== null) {
        return { alreadyRemoved: true as const };
      }
      if (attachment.uploadedById !== user.id && !isAdmin(user)) {
        return { forbidden: true as const };
      }

      await tx.offerAttachment.update({
        where: { id: attachmentId },
        data: { removedAt: new Date(), removedById: user.id },
      });

      await recordAudit(tx, {
        entityType: "OfferAttachment",
        entityId: attachmentId,
        action: "ATTACHMENT_REMOVED",
        actorId: user.id,
        changes: { oferta: offerId, nombre: attachment.originalName },
      });

      return { removed: true as const };
    });

    if (result === null) {
      return actionError({ _form: "El adjunto ya no está disponible." });
    }
    if ("forbidden" in result) {
      return actionError({ _form: "Solo el autor del adjunto o un administrador puede retirarlo." });
    }
    if ("alreadyRemoved" in result) {
      return actionError({ _form: "El adjunto ya estaba retirado." });
    }
  } catch (error) {
    return actionError({ _form: toSafeErrorMessage(error) });
  }

  revalidatePath(`/offers/${offerId}`);
  return actionSuccess("Adjunto retirado.");
}
