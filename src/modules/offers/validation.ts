import { sumDecimalStrings } from "@/lib/decimal";
import {
  checkField,
  optionalDate,
  optionalDecimal,
  optionalSelection,
  optionalText,
  readString,
  requiredDate,
  requiredDecimal,
  requiredSelection,
  requiredText,
  type FieldErrors,
} from "@/lib/validation";

/**
 * Reglas de validación del formulario de oferta, compartidas literalmente
 * entre el alta (`/offers/new`) y la modificación (`/offers/[id]/edit`).
 *
 * Este módulo es deliberadamente puro: no importa Prisma ni accede a la base
 * de datos. Recibe el contexto que necesita (qué estados son `CANCELLED`, qué
 * perfiles admiten jornadas) y devuelve, o bien los datos ya normalizados, o
 * bien un mapa de errores por campo. Las comprobaciones que sí requieren base
 * de datos (existencia de las relaciones, habilitaciones de las personas)
 * viven en `actions.ts`.
 */

/** Código estable del estado que obliga a informar el motivo de cancelación. */
export const CANCELLED_STATUS_CODE = "CANCELLED";

/** Prefijo de los campos de jornadas por perfil dentro del formulario. */
export const PROFILE_DAYS_FIELD_PREFIX = "profileDays";

/** Clave de error para un campo de jornadas de un perfil concreto. */
export function profileDaysFieldName(professionalProfileId: string): string {
  return `${PROFILE_DAYS_FIELD_PREFIX}.${professionalProfileId}`;
}

/** Valores tal y como se escriben en el formulario (siempre cadenas). */
export type OfferFormValues = {
  clientId: string;
  implantationText: string;
  priorityId: string;
  originId: string;
  commercialId: string;
  projectManagerId: string;
  offerDate: string;
  description: string;
  offerTypeId: string;
  segmentationId: string;
  requesterName: string;
  languageId: string;
  notes: string;
  estimatedCommercialDeliveryDate: string;
  estimatedClientDeliveryDate: string;
  estimatedPortfolioDate: string;
  commercialDays: string;
  totalAmount: string;
  statusId: string;
  cancellationReasonId: string;
  navisionOrder: string;
  profileDays: Record<string, string>;
};

/** Datos ya validados y normalizados, listos para persistir. */
export type ValidatedOffer = {
  clientId: string;
  priorityId: string;
  commercialId: string;
  offerDate: string;
  originId: string;
  projectManagerId: string;
  description: string;
  offerTypeId: string;
  totalAmount: string;
  statusId: string;
  requesterName: string;
  implantationText: string | null;
  estimatedCommercialDeliveryDate: string | null;
  estimatedClientDeliveryDate: string | null;
  commercialDays: string | null;
  estimatedPortfolioDate: string | null;
  segmentationId: string | null;
  notes: string | null;
  languageId: string | null;
  navisionOrder: string | null;
  cancellationReasonId: string | null;
  /** Solo perfiles con jornadas mayores que cero. */
  profileDays: Array<{ professionalProfileId: string; days: string }>;
};

export type OfferValidationContext = {
  /** Identificadores de estados cuyo código estable es `CANCELLED`. */
  cancelledStatusIds: readonly string[];
  /** Perfiles para los que el formulario admite jornadas. */
  professionalProfileIds: readonly string[];
  /** Si no hay motivos de cancelación disponibles, se avisa sin inventar uno. */
  hasSelectableCancellationReasons: boolean;
};

export type OfferValidationResult =
  | { ok: true; data: ValidatedOffer }
  | { ok: false; errors: FieldErrors };

const EMPTY_PROFILE_DAYS: Record<string, string> = {};

/** Valores vacíos iniciales del formulario de alta. */
export function emptyOfferFormValues(): OfferFormValues {
  return {
    clientId: "",
    implantationText: "",
    priorityId: "",
    originId: "",
    commercialId: "",
    projectManagerId: "",
    offerDate: "",
    description: "",
    offerTypeId: "",
    segmentationId: "",
    requesterName: "",
    languageId: "",
    notes: "",
    estimatedCommercialDeliveryDate: "",
    estimatedClientDeliveryDate: "",
    estimatedPortfolioDate: "",
    commercialDays: "",
    totalAmount: "",
    statusId: "",
    cancellationReasonId: "",
    navisionOrder: "",
    profileDays: EMPTY_PROFILE_DAYS,
  };
}

/** Extrae del `FormData` los valores del formulario, sin validarlos todavía. */
export function readOfferFormValues(
  formData: FormData,
  professionalProfileIds: readonly string[],
): OfferFormValues {
  const profileDays: Record<string, string> = {};
  for (const professionalProfileId of professionalProfileIds) {
    profileDays[professionalProfileId] = readString(
      formData,
      profileDaysFieldName(professionalProfileId),
    );
  }

  return {
    clientId: readString(formData, "clientId"),
    implantationText: readString(formData, "implantationText"),
    priorityId: readString(formData, "priorityId"),
    originId: readString(formData, "originId"),
    commercialId: readString(formData, "commercialId"),
    projectManagerId: readString(formData, "projectManagerId"),
    offerDate: readString(formData, "offerDate"),
    description: readString(formData, "description"),
    offerTypeId: readString(formData, "offerTypeId"),
    segmentationId: readString(formData, "segmentationId"),
    requesterName: readString(formData, "requesterName"),
    languageId: readString(formData, "languageId"),
    notes: readString(formData, "notes"),
    estimatedCommercialDeliveryDate: readString(
      formData,
      "estimatedCommercialDeliveryDate",
    ),
    estimatedClientDeliveryDate: readString(formData, "estimatedClientDeliveryDate"),
    estimatedPortfolioDate: readString(formData, "estimatedPortfolioDate"),
    commercialDays: readString(formData, "commercialDays"),
    totalAmount: readString(formData, "totalAmount"),
    statusId: readString(formData, "statusId"),
    cancellationReasonId: readString(formData, "cancellationReasonId"),
    navisionOrder: readString(formData, "navisionOrder"),
    profileDays,
  };
}

/** Suma las jornadas por perfil con decimal exacto. */
export function totalProfileDays(
  entries: ReadonlyArray<{ days: string }>,
): string {
  return sumDecimalStrings(
    entries.map((entry) => entry.days),
    2,
  );
}

export function validateOfferInput(
  values: OfferFormValues,
  context: OfferValidationContext,
): OfferValidationResult {
  const errors: FieldErrors = {};

  const clientId = checkField(errors, "clientId", requiredSelection("El cliente"), values.clientId);
  const priorityId = checkField(errors, "priorityId", requiredSelection("La prioridad"), values.priorityId);
  const commercialId = checkField(errors, "commercialId", requiredSelection("El comercial"), values.commercialId);
  const offerDate = checkField(errors, "offerDate", requiredDate("La fecha de la oferta"), values.offerDate);
  const originId = checkField(errors, "originId", requiredSelection("El origen"), values.originId);
  const projectManagerId = checkField(
    errors,
    "projectManagerId",
    requiredSelection("El Project Manager"),
    values.projectManagerId,
  );
  const description = checkField(errors, "description", requiredText("La descripción", 2000), values.description);
  const offerTypeId = checkField(errors, "offerTypeId", requiredSelection("El tipo de oferta"), values.offerTypeId);
  const totalAmount = checkField(
    errors,
    "totalAmount",
    requiredDecimal("El importe total", { scale: 2, maxIntegerDigits: 12 }),
    values.totalAmount,
  );
  const statusId = checkField(errors, "statusId", requiredSelection("El estado"), values.statusId);
  const requesterName = checkField(
    errors,
    "requesterName",
    requiredText("El nombre del solicitante", 200),
    values.requesterName,
  );

  const implantationText = checkField(
    errors,
    "implantationText",
    optionalText("La implantación", 300),
    values.implantationText,
  );
  const notes = checkField(errors, "notes", optionalText("Las observaciones", 4000), values.notes);
  const navisionOrder = checkField(
    errors,
    "navisionOrder",
    optionalText("El pedido de Navision", 100),
    values.navisionOrder,
  );
  const segmentationId = checkField(errors, "segmentationId", optionalSelection(), values.segmentationId);
  const languageId = checkField(errors, "languageId", optionalSelection(), values.languageId);
  const rawCancellationReasonId = checkField(
    errors,
    "cancellationReasonId",
    optionalSelection(),
    values.cancellationReasonId,
  );

  const estimatedCommercialDeliveryDate = checkField(
    errors,
    "estimatedCommercialDeliveryDate",
    optionalDate("La fecha estimada de entrega comercial"),
    values.estimatedCommercialDeliveryDate,
  );
  const estimatedClientDeliveryDate = checkField(
    errors,
    "estimatedClientDeliveryDate",
    optionalDate("La fecha estimada de entrega al cliente"),
    values.estimatedClientDeliveryDate,
  );
  const estimatedPortfolioDate = checkField(
    errors,
    "estimatedPortfolioDate",
    optionalDate("La fecha estimada de cartera"),
    values.estimatedPortfolioDate,
  );
  const commercialDays = checkField(
    errors,
    "commercialDays",
    optionalDecimal("Las jornadas comerciales", { scale: 2, maxIntegerDigits: 6 }),
    values.commercialDays,
  );

  // Jornadas por perfil: solo se conservan las mayores que cero. Un campo
  // vacío o a cero no genera fila (ver docs/offers/BUSINESS_RULES.md).
  const profileDays: Array<{ professionalProfileId: string; days: string }> = [];
  for (const professionalProfileId of context.professionalProfileIds) {
    const fieldName = profileDaysFieldName(professionalProfileId);
    const raw = values.profileDays[professionalProfileId] ?? "";
    const days = checkField(
      errors,
      fieldName,
      optionalDecimal("Las jornadas", { scale: 2, maxIntegerDigits: 6 }),
      raw,
    );
    if (days !== undefined && days !== null && Number(days) > 0) {
      profileDays.push({ professionalProfileId, days });
    }
  }

  // Motivo de cancelación: obligatorio solo para el estado `CANCELLED`; para
  // cualquier otro estado no se conserva un motivo antiguo.
  const isCancelled = statusId !== undefined && context.cancelledStatusIds.includes(statusId);
  let cancellationReasonId: string | null = null;

  if (isCancelled) {
    if (!context.hasSelectableCancellationReasons) {
      errors.cancellationReasonId =
        "No hay motivos de cancelación activos. Crea uno en Administración > Maestros de oferta antes de anular la oferta.";
    } else if (!rawCancellationReasonId) {
      errors.cancellationReasonId =
        "El motivo de cancelación es obligatorio cuando el estado es Anulado.";
    } else {
      cancellationReasonId = rawCancellationReasonId;
    }
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  // A partir de aquí todos los campos obligatorios están presentes: el mapa
  // de errores está vacío, así que las comprobaciones son solo de tipo.
  if (
    clientId === undefined ||
    priorityId === undefined ||
    commercialId === undefined ||
    offerDate === undefined ||
    originId === undefined ||
    projectManagerId === undefined ||
    description === undefined ||
    offerTypeId === undefined ||
    totalAmount === undefined ||
    statusId === undefined ||
    requesterName === undefined ||
    implantationText === undefined ||
    notes === undefined ||
    navisionOrder === undefined ||
    segmentationId === undefined ||
    languageId === undefined ||
    estimatedCommercialDeliveryDate === undefined ||
    estimatedClientDeliveryDate === undefined ||
    estimatedPortfolioDate === undefined ||
    commercialDays === undefined
  ) {
    return { ok: false, errors: { _form: "Revisa los campos del formulario." } };
  }

  return {
    ok: true,
    data: {
      clientId,
      priorityId,
      commercialId,
      offerDate,
      originId,
      projectManagerId,
      description,
      offerTypeId,
      totalAmount,
      statusId,
      requesterName,
      implantationText,
      estimatedCommercialDeliveryDate,
      estimatedClientDeliveryDate,
      commercialDays,
      estimatedPortfolioDate,
      segmentationId,
      notes,
      languageId,
      navisionOrder,
      cancellationReasonId,
      profileDays,
    },
  };
}
