"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { formatDateTime } from "@/lib/format";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/modules/notifications/actions";
import { INITIAL_OFFER_ACTION_STATE } from "@/modules/offers/offer-action-state";
import type { NotificationRow } from "@/modules/notifications/data";

function MarkAllSubmit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="v-btn v-btn-secondary" disabled={pending}>
      {pending ? "Marcando…" : "Marcar todas como leídas"}
    </button>
  );
}

export function NotificationsScreen({ notifications }: { notifications: NotificationRow[] }) {
  const [, markAllAction] = useActionState(
    markAllNotificationsReadAction,
    INITIAL_OFFER_ACTION_STATE,
  );
  const hasUnread = notifications.some((notification) => notification.readAt === null);

  return (
    <div className="flex flex-col gap-4">
      {hasUnread ? (
        <form action={markAllAction} className="self-end">
          <MarkAllSubmit />
        </form>
      ) : null}

      {notifications.length === 0 ? (
        <p className="text-sm text-[var(--color-text-muted)]">
          No tienes notificaciones todavía.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {notifications.map((notification) => (
            <NotificationItem key={notification.id} notification={notification} />
          ))}
        </ul>
      )}
    </div>
  );
}

function NotificationItem({ notification }: { notification: NotificationRow }) {
  const [, markReadAction] = useActionState(
    markNotificationReadAction,
    INITIAL_OFFER_ACTION_STATE,
  );
  const isUnread = notification.readAt === null;

  return (
    <li
      className="v-card flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-start sm:justify-between"
      style={
        isUnread
          ? { borderColor: "var(--color-primary)", backgroundColor: "var(--color-primary-soft)" }
          : undefined
      }
    >
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-sm font-bold">
          {isUnread ? (
            <span aria-hidden="true" className="text-[var(--color-primary)]">
              ●
            </span>
          ) : null}
          {notification.title}
          <span className="sr-only">{isUnread ? "(sin leer)" : "(leída)"}</span>
        </p>
        <p className="mt-1 whitespace-pre-line text-sm">{notification.body}</p>
        <p className="v-hint mt-1">
          {formatDateTime(notification.createdAt)}
          {notification.actorName ? ` · ${notification.actorName}` : ""}
          {notification.ruleName ? ` · ${notification.ruleName}` : ""}
        </p>
        {notification.offerId && notification.canOpenOffer ? (
          <Link className="v-link text-sm" href={`/offers/${notification.offerId}`}>
            Abrir oferta {notification.offerNumber}
          </Link>
        ) : notification.offerId ? (
          <p className="v-hint">Ya no tienes acceso a esta oferta.</p>
        ) : null}
      </div>

      {isUnread ? (
        <form action={markReadAction}>
          <input type="hidden" name="id" value={notification.id} />
          <button type="submit" className="v-btn v-btn-quiet whitespace-nowrap">
            Marcar leída
          </button>
        </form>
      ) : null}
    </li>
  );
}
