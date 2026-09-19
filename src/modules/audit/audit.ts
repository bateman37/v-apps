import type { Prisma } from "@prisma/client";

/**
 * Auditoría mínima real de la plataforma.
 *
 * Limitación conocida y documentada: mientras la autenticación siga
 * pospuesta (DEC-019), `actorId` es siempre `null`. No se inventa ningún
 * usuario `admin`, `system` ni una identidad temporal, de modo que la
 * atribución de los cambios registrados en esta fase es desconocida. Ver
 * docs/architecture/SECURITY.md.
 *
 * `changes` guarda exclusivamente valores de negocio (nombres, importes,
 * identificadores de maestro). Nunca credenciales, cadenas de conexión ni
 * detalles técnicos del motor.
 */

export type AuditEntityType =
  | "Offer"
  | "Client"
  | "Person"
  | "MasterDataRecord";

export type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "STATUS_CHANGE"
  | "ACTIVATE"
  | "DEACTIVATE";

export type AuditChanges = Record<string, unknown>;

export type AuditEntry = {
  entityType: AuditEntityType;
  entityId: string;
  action: AuditAction;
  changes?: AuditChanges;
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
      // Sin autenticación no hay actor conocido (DEC-019).
      actorId: null,
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
