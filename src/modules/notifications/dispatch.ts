import type { Prisma } from "@prisma/client";
import { truncate } from "@/lib/text";
import {
  resolveRecipients,
  ruleMatches,
  TRIGGER_LABELS,
  type EvaluableRule,
  type NotificationTrigger,
  type OfferEventSubject,
} from "@/modules/notifications/rules";

/**
 * Entrega de notificaciones internas.
 *
 * Se ejecuta **dentro de la misma transacción** que la mutación que la
 * provoca, de modo que una operación revertida no deja notificaciones de un
 * cambio que nunca ocurrió.
 *
 * Reglas aplicadas:
 *
 * - Una regla inactiva no se evalúa.
 * - Un destinatario sin usuario activo no genera notificación accesible: se
 *   descarta en silencio, sin inventar una cuenta ni una dirección de correo.
 * - No se notifica al propio actor por su propia acción.
 * - `dedupeKey` garantiza que dos reglas que producen exactamente la misma
 *   notificación dentro del mismo evento no la dupliquen.
 * - El canal `Interna + email` crea la notificación interna y **conserva la
 *   intención** elegida, pero no intenta ni simula ningún envío: no hay
 *   proveedor configurado y no se registra ningún correo como enviado ni como
 *   fallido.
 */

export type NotificationEvent = {
  trigger: NotificationTrigger;
  offer: OfferEventSubject;
  /** Usuario que provoca el evento, o `null` en un proceso sin sesión. */
  actorUserId: string | null;
  /**
   * Identificador del hecho concreto (id del comentario, del adjunto, del
   * estado resultante...). Forma parte de la clave de idempotencia, de modo
   * que dos eventos distintos del mismo tipo sí generan dos notificaciones.
   */
  eventId: string;
  /** Detalle corto y seguro que se añade al cuerpo del mensaje. */
  detail?: string;
};

type RuleRecord = Prisma.NotificationRuleGetPayload<{
  include: { conditions: true; actions: true };
}>;

function toEvaluableRule(rule: RuleRecord): EvaluableRule {
  return {
    id: rule.id,
    name: rule.name,
    isActive: rule.isActive,
    trigger: rule.trigger,
    channel: rule.channel,
    conditions: rule.conditions.map((condition) => ({
      group: condition.group,
      field: condition.field,
      operator: condition.operator,
      statusId: condition.statusId,
      personId: condition.personId,
      clientId: condition.clientId,
      booleanValue: condition.booleanValue,
    })),
    actions: rule.actions.map((action) => ({
      kind: action.kind,
      personId: action.personId,
    })),
  };
}

/** Título y cuerpo, siempre en español y sin datos técnicos. */
function composeMessage(event: NotificationEvent): {
  title: string;
  body: string;
} {
  const label = TRIGGER_LABELS[event.trigger];
  const title = `${label} · ${event.offer.number}`;
  const base = `${event.offer.clientName} — ${truncate(event.offer.description, 120)}`;
  const body = event.detail ? `${base}\n${event.detail}` : base;
  return { title, body };
}

/**
 * Evalúa todas las reglas activas del disparador y crea las notificaciones que
 * correspondan. Devuelve cuántas se han creado realmente.
 */
export async function dispatchNotifications(
  tx: Prisma.TransactionClient,
  event: NotificationEvent,
): Promise<number> {
  const rules = await tx.notificationRule.findMany({
    where: { isActive: true, trigger: event.trigger },
    include: { conditions: true, actions: true },
    orderBy: { sortOrder: "asc" },
  });

  if (rules.length === 0) {
    return 0;
  }

  // Se resuelven primero todos los destinatarios; después se traducen a
  // usuarios activos en una sola consulta, para no hacer una por regla.
  const personIds = new Set<string>();
  let needsAdmins = false;
  const applicable: Array<{ rule: EvaluableRule }> = [];

  for (const record of rules) {
    const rule = toEvaluableRule(record);
    if (!ruleMatches(rule, event.trigger, event.offer)) {
      continue;
    }
    applicable.push({ rule });
    for (const recipient of resolveRecipients(rule, event.offer)) {
      if (recipient.kind === "ALL_ADMINS") {
        needsAdmins = true;
      } else {
        personIds.add(recipient.personId);
      }
    }
  }

  if (applicable.length === 0) {
    return 0;
  }

  const [usersByPerson, admins] = await Promise.all([
    personIds.size > 0
      ? tx.user.findMany({
          where: { personId: { in: [...personIds] }, isActive: true },
          select: { id: true, personId: true },
        })
      : Promise.resolve([]),
    needsAdmins
      ? tx.user.findMany({
          where: { role: "ADMIN", isActive: true },
          select: { id: true },
        })
      : Promise.resolve([]),
  ]);

  const userIdByPerson = new Map(
    usersByPerson.map((user) => [user.personId, user.id] as const),
  );

  const { title, body } = composeMessage(event);
  let created = 0;

  for (const { rule } of applicable) {
    const targetUserIds = new Set<string>();

    for (const recipient of resolveRecipients(rule, event.offer)) {
      if (recipient.kind === "ALL_ADMINS") {
        for (const admin of admins) {
          targetUserIds.add(admin.id);
        }
      } else {
        const userId = userIdByPerson.get(recipient.personId);
        if (userId) {
          targetUserIds.add(userId);
        }
      }
    }

    for (const userId of targetUserIds) {
      // Nadie recibe una notificación por su propia acción.
      if (event.actorUserId && userId === event.actorUserId) {
        continue;
      }

      const dedupeKey = [
        event.trigger,
        event.offer.id,
        event.eventId,
        userId,
      ].join("|");

      // `createMany` con `skipDuplicates` aplica la clave de idempotencia sin
      // necesidad de leer antes: si dos reglas producen exactamente la misma
      // notificación, la segunda simplemente no se inserta.
      const result = await tx.notification.createMany({
        data: [
          {
            userId,
            offerId: event.offer.id,
            ruleId: rule.id,
            trigger: event.trigger,
            channel: rule.channel,
            title,
            body,
            actorId: event.actorUserId,
            dedupeKey,
          },
        ],
        skipDuplicates: true,
      });
      created += result.count;
    }
  }

  return created;
}
