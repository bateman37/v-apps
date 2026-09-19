import type { Prisma } from "@prisma/client";

/**
 * Auditoría técnica de la plataforma.
 *
 * Desde DEV-004 cada entrada puede relacionarse con el **usuario autenticado**
 * que la provocó. `actorId` sigue siendo nullable por dos motivos legítimos:
 *
 * 1. Los registros creados antes de que existiera el login se conservan
 *    íntegros y se muestran como «Usuario no disponible (registro anterior al
 *    login)». No se reescribe el pasado ni se inventa un actor.
 * 2. Un proceso de línea de comandos (carga inicial, bootstrap) no actúa en
 *    nombre de ninguna persona.
 *
 * `changes` guarda exclusivamente valores de negocio en la forma
 * `{ campo: { antes, despues } }`. Nunca contraseñas, hashes, tokens de
 * sesión, cookies, contenido binario ni rutas físicas del servidor. Ver
 * docs/architecture/SECURITY.md.
 *
 * La auditoría es **append-only** desde la aplicación: no existe ninguna
 * función que actualice ni borre una entrada.
 */

export type AuditEntityType =
  | "Offer"
  | "OfferComment"
  | "OfferAttachment"
  | "Client"
  | "Person"
  | "MasterDataRecord"
  | "User"
  | "NotificationRule"
  | "SystemCounter";

export type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "STATUS_CHANGE"
  | "REVIEW"
  | "ACTIVATE"
  | "DEACTIVATE"
  | "ARCHIVE"
  | "RESTORE"
  | "COMMENT"
  | "ATTACHMENT_ADDED"
  | "ATTACHMENT_REMOVED"
  | "LOGIN"
  | "PASSWORD_CHANGED"
  | "PASSWORD_RESET"
  | "ROLE_CHANGED"
  | "COUNTER_ADJUSTED"
  | "COUNTER_INITIALIZED";

export type AuditChanges = Record<string, unknown>;

export type AuditEntry = {
  entityType: AuditEntityType;
  entityId: string;
  action: AuditAction;
  changes?: AuditChanges;
  /** Usuario autenticado responsable, o `null` si no lo hay. */
  actorId?: string | null;
};

/**
 * Registra una entrada de auditoría dentro de la transacción en curso, para
 * que el rastro y el dato auditado se confirmen o se reviertan juntos.
 */
export async function recordAudit(
  tx: Prisma.TransactionClient,
  entry: AuditEntry,
): Promise<void> {
  await tx.auditLog.create({
    data: {
      entityType: entry.entityType,
      entityId: entry.entityId,
      action: entry.action,
      changes: (entry.changes ?? undefined) as Prisma.InputJsonValue | undefined,
      actorId: entry.actorId ?? null,
    },
  });
}

/**
 * Calcula el conjunto de campos que realmente cambian entre dos versiones de
 * un registro, en la forma `{ campo: { antes, despues } }`. Los campos sin
 * cambio se omiten, para que la auditoría sea legible.
 */
export function diffChanges<T extends Record<string, unknown>>(
  before: T,
  after: T,
): AuditChanges {
  const changes: AuditChanges = {};
  for (const key of Object.keys(after)) {
    const previousValue = before[key];
    const nextValue = after[key];
    if (!Object.is(previousValue ?? null, nextValue ?? null)) {
      changes[key] = { antes: previousValue ?? null, despues: nextValue ?? null };
    }
  }
  return changes;
}

/** Texto con el que se presenta un actor desconocido. */
export const UNKNOWN_ACTOR_LABEL =
  "Usuario no disponible (registro anterior al login)";
