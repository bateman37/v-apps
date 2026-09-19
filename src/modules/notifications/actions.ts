"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { toSafeErrorMessage } from "@/lib/db/errors";
import { readString } from "@/lib/validation";
import { requireUser } from "@/modules/auth/session";
import {
  offerActionError,
  offerActionSuccess,
  type OfferActionState,
} from "@/modules/offers/offer-action-state";

/** Marca una notificación propia como leída. No se puede leer la de otro. */
export async function markNotificationReadAction(
  _previousState: OfferActionState,
  formData: FormData,
): Promise<OfferActionState> {
  const user = await requireUser();
  const id = readString(formData, "id");
  if (!id) {
    return offerActionError({ _form: "No se ha podido identificar la notificación." });
  }

  try {
    await prisma.notification.updateMany({
      where: { id, userId: user.id, readAt: null },
      data: { readAt: new Date() },
    });
  } catch (error) {
    return offerActionError({ _form: toSafeErrorMessage(error) });
  }

  revalidatePath("/notificaciones");
  return offerActionSuccess("Notificación marcada como leída.");
}

/** Marca todas las notificaciones propias como leídas. */
/* eslint-disable @typescript-eslint/no-unused-vars -- firma exigida por useActionState; esta acción no necesita datos del formulario. */
export async function markAllNotificationsReadAction(
  _previousState: OfferActionState,
  _formData: FormData,
): Promise<OfferActionState> {
  /* eslint-enable @typescript-eslint/no-unused-vars */
  const user = await requireUser();

  try {
    await prisma.notification.updateMany({
      where: { userId: user.id, readAt: null },
      data: { readAt: new Date() },
    });
  } catch (error) {
    return offerActionError({ _form: toSafeErrorMessage(error) });
  }

  revalidatePath("/notificaciones");
  return offerActionSuccess("Todas las notificaciones se han marcado como leídas.");
}
