"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { toSafeErrorMessage } from "@/lib/db/errors";
import { fromDateInputValue } from "@/lib/format";
import type { FieldErrors } from "@/lib/validation";
import type { OfferFormState } from "@/modules/offers/form-state";
import { diffChanges, recordAudit } from "@/modules/audit/audit";
import { assignOfferNumber } from "@/modules/offers/numbering";
import {
  CANCELLED_STATUS_CODE,
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
 * El alta y la modificación comparten las mismas reglas de validación
 * (`validation.ts`) y el mismo componente de formulario. Aquí se añaden las
 * comprobaciones que sí necesitan base de datos —existencia de las relaciones
 * y habilitación de las personas— y la persistencia transaccional de oferta,
 * jornadas, histórico de estados y auditoría.
 */

function errorState(errors: FieldErrors, values: OfferFormValues): OfferFormState {
  return { status: "error", errors, values };
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
        field: "clientId",
        label: "El cliente",
        id: data.clientId,
        currentId: current?.clientId ?? null,
        lookup: (id) =>
          prisma.client.findUnique({ where: { id }, select: { isActive: true } }),
      },
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
  } else {
    if (!commercial.canBeCommercial) {
      errors.commercialId =
        "La persona seleccionada no está habilitada como comercial.";
    } else if (!commercial.isActive && data.commercialId !== current?.commercialId) {
      errors.commercialId = "La persona seleccionada como comercial está inactiva.";
    }
  }

  if (!projectManager) {
    errors.projectManagerId = "La persona seleccionada como PM ya no existe.";
  } else {
    if (!projectManager.canBeProjectManager) {
      errors.projectManagerId =
        "La persona seleccionada no está habilitada como Project Manager.";
    } else if (
      !projectManager.isActive &&
      data.projectManagerId !== current?.projectManagerId
    ) {
      errors.projectManagerId = "La persona seleccionada como PM está inactiva.";
    }
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
  const [profiles, cancelledStatuses, activeCancellationReasons] = await Promise.all([
    prisma.professionalProfile.findMany({ select: { id: true } }),
    prisma.offerStatus.findMany({
      where: { code: CANCELLED_STATUS_CODE },
      select: { id: true },
    }),
    prisma.cancellationReason.count({ where: { isActive: true } }),
  ]);

  return {
    professionalProfileIds: profiles.map((profile) => profile.id),
    cancelledStatusIds: cancelledStatuses.map((status) => status.id),
    activeCancellationReasons,
  };
}

export async function createOfferAction(
  _previousState: OfferFormState,
  formData: FormData,
): Promise<OfferFormState> {
  let createdOfferId: string;

  try {
    const context = await loadValidationContext();
    const values = readOfferFormValues(formData, context.professionalProfileIds);

    const validation = validateOfferInput(values, {
      cancelledStatusIds: context.cancelledStatusIds,
      professionalProfileIds: context.professionalProfileIds,
      hasSelectableCancellationReasons: context.activeCancellationReasons > 0,
    });

    if (!validation.ok) {
      return errorState(validation.errors, values);
    }

    const databaseErrors = await validateAgainstDatabase(validation.data, null);
    if (Object.keys(databaseErrors).length > 0) {
      return errorState(databaseErrors, values);
    }

    const data = validation.data;

    createdOfferId = await prisma.$transaction(async (tx) => {
      const createdAt = new Date();
      // El número se consume aquí y solo aquí: abrir o cancelar el
      // formulario nunca gasta un número (DEC-011).
      const number = await assignOfferNumber(tx, createdAt);

      const offer = await tx.offer.create({
        data: {
          number,
          ...toOfferScalarData(data),
          profileDays: {
            create: data.profileDays.map((entry) => ({
              professionalProfileId: entry.professionalProfileId,
              days: entry.days,
            })),
          },
          statusHistory: {
            // Primer evento del histórico: sin estado anterior.
            create: [{ newStatusId: data.statusId, actorId: null }],
          },
        },
        select: { id: true },
      });

      await recordAudit(tx, {
        entityType: "Offer",
        entityId: offer.id,
        action: "CREATE",
        changes: { number, ...auditSnapshot(data) },
      });

      return offer.id;
    });
  } catch (error) {
    return errorState(
      { _form: toSafeErrorMessage(error) },
      readSubmittedValues(formData),
    );
  }

  revalidatePath("/offers");
  redirect(`/offers/${createdOfferId}?saved=created`);
}

export async function updateOfferAction(
  _previousState: OfferFormState,
  formData: FormData,
): Promise<OfferFormState> {
  const offerId = formData.get("offerId");
  if (typeof offerId !== "string" || offerId === "") {
    return errorState(
      { _form: "No se ha podido identificar la oferta que se está modificando." },
      emptyOfferFormValues(),
    );
  }

  try {
    const context = await loadValidationContext();
    const values = readOfferFormValues(formData, context.professionalProfileIds);

    const current = await prisma.offer.findFirst({
      where: { id: offerId, deletedAt: null },
      select: {
        id: true,
        number: true,
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

    if (!current) {
      return errorState(
        { _form: "La oferta ya no existe. Vuelve al listado y recarga la página." },
        values,
      );
    }

    // El motivo de cancelación actual sigue siendo seleccionable aunque su
    // maestro se haya desactivado después.
    const hasSelectableCancellationReasons =
      context.activeCancellationReasons > 0 || current.cancellationReasonId !== null;

    const validation = validateOfferInput(values, {
      cancelledStatusIds: context.cancelledStatusIds,
      professionalProfileIds: context.professionalProfileIds,
      hasSelectableCancellationReasons,
    });

    if (!validation.ok) {
      return errorState(validation.errors, values);
    }

    const databaseErrors = await validateAgainstDatabase(validation.data, current);
    if (Object.keys(databaseErrors).length > 0) {
      return errorState(databaseErrors, values);
    }

    const data = validation.data;
    const statusChanged = current.statusId !== data.statusId;

    await prisma.$transaction(async (tx) => {
      // `number` y `createdAt` no se tocan nunca: el número es inmutable.
      await tx.offer.update({
        where: { id: current.id },
        data: toOfferScalarData(data),
      });

      // Sincronización de jornadas: se eliminan las filas que ya no tienen
      // valor y se insertan o actualizan las demás. La restricción única
      // (oferta, perfil) impide duplicados incluso ante envíos repetidos.
      const desiredIds = data.profileDays.map((entry) => entry.professionalProfileId);
      await tx.offerProfileDays.deleteMany({
        where: {
          offerId: current.id,
          ...(desiredIds.length > 0
            ? { professionalProfileId: { notIn: desiredIds } }
            : {}),
        },
      });

      for (const entry of data.profileDays) {
        await tx.offerProfileDays.upsert({
          where: {
            offerId_professionalProfileId: {
              offerId: current.id,
              professionalProfileId: entry.professionalProfileId,
            },
          },
          create: {
            offerId: current.id,
            professionalProfileId: entry.professionalProfileId,
            days: entry.days,
          },
          update: { days: entry.days },
        });
      }

      if (statusChanged) {
        await tx.offerStatusHistory.create({
          data: {
            offerId: current.id,
            previousStatusId: current.statusId,
            newStatusId: data.statusId,
            actorId: null,
          },
        });
      }

      const before: Record<string, unknown> = {
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
                (entry) =>
                  [entry.professionalProfileId, entry.days.toFixed(2)] as const,
              )
              .sort((left, right) => left[0].localeCompare(right[0])),
          ),
        ),
      };

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

      const changes = diffChanges(before, after);

      if (Object.keys(changes).length > 0) {
        await recordAudit(tx, {
          entityType: "Offer",
          entityId: current.id,
          action: "UPDATE",
          changes,
        });
      }

      if (statusChanged) {
        await recordAudit(tx, {
          entityType: "Offer",
          entityId: current.id,
          action: "STATUS_CHANGE",
          changes: {
            estado: { antes: current.statusId, despues: data.statusId },
          },
        });
      }
    });
  } catch (error) {
    return errorState(
      { _form: toSafeErrorMessage(error) },
      readSubmittedValues(formData),
    );
  }

  revalidatePath("/offers");
  revalidatePath(`/offers/${offerId}`);
  redirect(`/offers/${offerId}?saved=updated`);
}
