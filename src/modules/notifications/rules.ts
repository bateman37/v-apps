/**
 * Motor **limitado** de reglas de notificación (bloque 9 de DEV-004).
 *
 * Este módulo es puro: no importa Prisma ni Next.js. Recibe una regla ya leída
 * y el contexto del evento, y decide si la regla se aplica y a qué tipos de
 * destinatario. La resolución de esos tipos a usuarios concretos y la
 * escritura de las notificaciones viven en `dispatch.ts`, que sí necesita la
 * base de datos.
 *
 * Deliberadamente **no** es un motor genérico de workflow: los disparadores,
 * los campos, los operadores y los destinatarios son listas cerradas. No hay
 * expresiones libres, ni scripts, ni SQL, ni plantillas de correo.
 */

export type NotificationTrigger =
  | "OFFER_CREATED"
  | "OFFER_STATUS_CHANGED"
  | "OFFER_COMMENT_ADDED"
  | "OFFER_ATTACHMENT_ADDED"
  | "OFFER_PENDING_PM_REVIEW"
  | "OFFER_PENDING_SALES_REVIEW";

export type NotificationChannel = "INTERNAL" | "INTERNAL_AND_EMAIL";

export type ConditionField =
  | "STATUS"
  | "PROJECT_MANAGER"
  | "COMMERCIAL"
  | "CREATOR"
  | "CLIENT"
  | "ARCHIVED";

export type ConditionOperator = "IS" | "IS_NOT";
export type ConditionGroup = "ALL" | "ANY";

export type RecipientKind =
  | "PROJECT_MANAGER"
  | "COMMERCIAL"
  | "CREATOR"
  | "ALL_ADMINS"
  | "SPECIFIC_PERSON";

export type RuleCondition = {
  group: ConditionGroup;
  field: ConditionField;
  operator: ConditionOperator;
  statusId: string | null;
  personId: string | null;
  clientId: string | null;
  booleanValue: boolean | null;
};

export type RuleAction = {
  kind: RecipientKind;
  personId: string | null;
};

export type EvaluableRule = {
  id: string;
  name: string;
  isActive: boolean;
  trigger: NotificationTrigger;
  channel: NotificationChannel;
  conditions: RuleCondition[];
  actions: RuleAction[];
};

/** Datos de la oferta sobre los que una condición puede decidir. */
export type OfferEventSubject = {
  id: string;
  number: string;
  statusId: string;
  statusName: string;
  clientId: string;
  clientName: string;
  description: string;
  commercialPersonId: string;
  projectManagerPersonId: string;
  /** Usuario creador de la oferta, o `null` si es anterior al login. */
  createdByUserId: string | null;
  /** Persona del usuario creador, para las condiciones por creador. */
  createdByPersonId: string | null;
  isArchived: boolean;
};

/** Valor efectivo de un campo de condición para una oferta concreta. */
function fieldValue(
  field: ConditionField,
  offer: OfferEventSubject,
): string | boolean | null {
  switch (field) {
    case "STATUS":
      return offer.statusId;
    case "PROJECT_MANAGER":
      return offer.projectManagerPersonId;
    case "COMMERCIAL":
      return offer.commercialPersonId;
    case "CREATOR":
      return offer.createdByPersonId;
    case "CLIENT":
      return offer.clientId;
    case "ARCHIVED":
      return offer.isArchived;
  }
}

/** Valor esperado por la condición, según el campo que evalúa. */
function expectedValue(condition: RuleCondition): string | boolean | null {
  switch (condition.field) {
    case "STATUS":
      return condition.statusId;
    case "PROJECT_MANAGER":
    case "COMMERCIAL":
    case "CREATOR":
      return condition.personId;
    case "CLIENT":
      return condition.clientId;
    case "ARCHIVED":
      return condition.booleanValue;
  }
}

/** Evalúa una condición aislada. */
export function evaluateCondition(
  condition: RuleCondition,
  offer: OfferEventSubject,
): boolean {
  const actual = fieldValue(condition.field, offer);
  const expected = expectedValue(condition);
  const matches = actual === expected;
  return condition.operator === "IS" ? matches : !matches;
}

/**
 * Decide si una regla se aplica a un evento.
 *
 * Semántica acordada:
 *
 * - Una regla inactiva nunca se ejecuta.
 * - El disparador debe coincidir exactamente.
 * - **Todas** las condiciones del bloque `TODAS` deben cumplirse.
 * - Si el bloque `CUALQUIERA` tiene condiciones, al menos una debe cumplirse.
 * - Un bloque vacío no invalida por sí solo la regla.
 */
export function ruleMatches(
  rule: EvaluableRule,
  trigger: NotificationTrigger,
  offer: OfferEventSubject,
): boolean {
  if (!rule.isActive || rule.trigger !== trigger) {
    return false;
  }

  const all = rule.conditions.filter((condition) => condition.group === "ALL");
  const any = rule.conditions.filter((condition) => condition.group === "ANY");

  if (!all.every((condition) => evaluateCondition(condition, offer))) {
    return false;
  }
  if (any.length > 0 && !any.some((condition) => evaluateCondition(condition, offer))) {
    return false;
  }
  return true;
}

/** Destinatario resuelto en términos de persona o de «todos los administradores». */
export type ResolvedRecipient =
  | { kind: "PERSON"; personId: string }
  | { kind: "ALL_ADMINS" };

/**
 * Traduce las acciones de una regla a destinatarios, sin duplicados.
 *
 * El creador solo se resuelve si la oferta tiene creador conocido: una oferta
 * anterior al login no genera un destinatario inventado.
 */
export function resolveRecipients(
  rule: EvaluableRule,
  offer: OfferEventSubject,
): ResolvedRecipient[] {
  const recipients: ResolvedRecipient[] = [];
  const seen = new Set<string>();

  function push(recipient: ResolvedRecipient) {
    const key =
      recipient.kind === "ALL_ADMINS" ? "ALL_ADMINS" : `PERSON:${recipient.personId}`;
    if (!seen.has(key)) {
      seen.add(key);
      recipients.push(recipient);
    }
  }

  for (const action of rule.actions) {
    switch (action.kind) {
      case "PROJECT_MANAGER":
        push({ kind: "PERSON", personId: offer.projectManagerPersonId });
        break;
      case "COMMERCIAL":
        push({ kind: "PERSON", personId: offer.commercialPersonId });
        break;
      case "CREATOR":
        if (offer.createdByPersonId) {
          push({ kind: "PERSON", personId: offer.createdByPersonId });
        }
        break;
      case "ALL_ADMINS":
        push({ kind: "ALL_ADMINS" });
        break;
      case "SPECIFIC_PERSON":
        if (action.personId) {
          push({ kind: "PERSON", personId: action.personId });
        }
        break;
    }
  }

  return recipients;
}

/** Etiquetas en español de los disparadores. */
export const TRIGGER_LABELS: Record<NotificationTrigger, string> = {
  OFFER_CREATED: "Oferta creada",
  OFFER_STATUS_CHANGED: "Estado de oferta cambiado",
  OFFER_COMMENT_ADDED: "Comentario añadido",
  OFFER_ATTACHMENT_ADDED: "Adjunto añadido",
  OFFER_PENDING_PM_REVIEW: "Oferta pendiente de revisión para PM",
  OFFER_PENDING_SALES_REVIEW: "Oferta pendiente de revisión para comercial",
};

export const CHANNEL_LABELS: Record<NotificationChannel, string> = {
  INTERNAL: "Solo interna",
  INTERNAL_AND_EMAIL: "Interna + email",
};

export const CONDITION_FIELD_LABELS: Record<ConditionField, string> = {
  STATUS: "Estado",
  PROJECT_MANAGER: "Project Manager",
  COMMERCIAL: "Comercial",
  CREATOR: "Creador",
  CLIENT: "Cliente",
  ARCHIVED: "Archivada",
};

export const CONDITION_OPERATOR_LABELS: Record<ConditionOperator, string> = {
  IS: "es",
  IS_NOT: "no es",
};

export const RECIPIENT_KIND_LABELS: Record<RecipientKind, string> = {
  PROJECT_MANAGER: "Project Manager asignado",
  COMMERCIAL: "Comercial asignado",
  CREATOR: "Creador de la oferta",
  ALL_ADMINS: "Todos los administradores activos",
  SPECIFIC_PERSON: "Una persona concreta",
};

/**
 * Aviso honesto que Administración debe mostrar junto al canal
 * `Interna + email`. El texto es único y vive aquí para no divergir entre
 * pantallas.
 */
export const EMAIL_PENDING_NOTICE =
  "El envío por email está pendiente de configuración; en esta versión solo se genera la notificación interna.";
