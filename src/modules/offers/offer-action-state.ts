import type { FieldErrors } from "@/lib/validation";

/**
 * Estado común de las acciones puntuales de una oferta (comentario, archivo,
 * recuperación, revisión, adjuntos).
 *
 * Vive en un módulo propio porque un archivo marcado con `"use server"` solo
 * puede exportar funciones asíncronas.
 */
export type OfferActionState = {
  status: "idle" | "success" | "error";
  message: string | null;
  errors: FieldErrors;
};

export const INITIAL_OFFER_ACTION_STATE: OfferActionState = {
  status: "idle",
  message: null,
  errors: {},
};

export function offerActionError(errors: FieldErrors): OfferActionState {
  return { status: "error", message: null, errors };
}

export function offerActionSuccess(message: string): OfferActionState {
  return { status: "success", message, errors: {} };
}
