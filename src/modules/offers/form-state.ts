import type { FieldErrors } from "@/lib/validation";
import type { OfferFormValues } from "@/modules/offers/validation";

/**
 * Estado devuelto por las Server Actions del formulario de oferta.
 *
 * Vive en un módulo propio, y no junto a las acciones, porque un archivo
 * marcado con `"use server"` solo puede exportar funciones asíncronas.
 *
 * `submission` se incrementa en cada respuesta del servidor. El formulario lo
 * usa como testigo para saber que ha llegado una respuesta **nueva** y volcar
 * en su estado los valores que el servidor devuelve. Sin ese contador, dos
 * errores consecutivos con los mismos valores serían indistinguibles y la
 * interfaz no se resincronizaría. Ver el comentario de `offer-form.tsx`.
 */
export type OfferFormState = {
  status: "idle" | "error";
  errors: FieldErrors;
  /** Valores enviados, para volver a pintarlos si el guardado falla. */
  values: OfferFormValues | null;
  /** Número de respuestas del servidor recibidas en este formulario. */
  submission: number;
};

export const INITIAL_OFFER_FORM_STATE: OfferFormState = {
  status: "idle",
  errors: {},
  values: null,
  submission: 0,
};
