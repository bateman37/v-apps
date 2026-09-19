import { prisma } from "@/lib/db/prisma";
import { canAccessOffer, type AuthenticatedUser } from "@/modules/auth/identity";
import {
  TRIGGER_LABELS,
  type NotificationChannel,
  type NotificationTrigger,
} from "@/modules/notifications/rules";

/** Lecturas del centro de notificaciones. */

export type NotificationRow = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  readAt: string | null;
  triggerLabel: string;
  channel: NotificationChannel;
  ruleName: string | null;
  actorName: string | null;
  offerId: string | null;
  offerNumber: string | null;
  /** El usuario conserva permiso para abrir la oferta enlazada. */
  canOpenOffer: boolean;
};

/**
 * Número de notificaciones sin leer del usuario. Se consulta en cada petición
 * para el contador del layout: es un `count` sobre un índice
 * `(user_id, read_at, created_at)`, no una carga completa.
 */
export async function countUnreadNotifications(userId: string): Promise<number> {
  return prisma.notification.count({ where: { userId, readAt: null } });
}

/** Límite de notificaciones mostradas. No se borra ninguna: solo se pagina. */
export const NOTIFICATIONS_PAGE_SIZE = 100;

/**
 * Notificaciones propias, de la más reciente a la más antigua.
 *
 * El enlace a la oferta solo se ofrece si el usuario **sigue** teniendo
 * permiso: una notificación antigua no puede convertirse en una puerta de
 * atrás a una oferta que ya no le corresponde.
 */
export async function getNotifications(
  user: AuthenticatedUser,
): Promise<NotificationRow[]> {
  const rows = await prisma.notification.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      title: true,
      body: true,
      createdAt: true,
      readAt: true,
      trigger: true,
      channel: true,
      offerId: true,
      rule: { select: { name: true } },
      actor: { select: { person: { select: { name: true } } } },
      offer: {
        select: {
          number: true,
          createdById: true,
          commercialId: true,
          projectManagerId: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: NOTIFICATIONS_PAGE_SIZE,
  });

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
    readAt: row.readAt?.toISOString() ?? null,
    triggerLabel: TRIGGER_LABELS[row.trigger as NotificationTrigger] ?? row.trigger,
    channel: row.channel,
    ruleName: row.rule?.name ?? null,
    actorName: row.actor?.person.name ?? null,
    offerId: row.offerId,
    offerNumber: row.offer?.number ?? null,
    canOpenOffer: row.offer ? canAccessOffer(user, row.offer) : false,
  }));
}
