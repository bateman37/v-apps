import type { FieldErrors } from "@/lib/validation";
import type { OfferFormValues } from "@/modules/offers/validation";

/**
 * Estado devuelto por las Server Actions del formulario de oferta.
 *
 * Vive en un módulo propio, y no junto a las acciones, porque un archivo
 * marcado con `"use server"` solo puede exportar funciones asíncronas.
 */
export type OfferFormState = {
  status: "idle" | "error";
  errors: FieldErrors;
  /** Valores enviados, para volver a pintarlos si la validación falla. */
  values: OfferFormValues | null;
};

export const INITIAL_OFFER_FORM_STATE: OfferFormState = {
  status: "idle",
  errors: {},
  values: null,
};
