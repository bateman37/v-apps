"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { addOfferCommentAction } from "@/modules/offers/actions";
import { INITIAL_OFFER_ACTION_STATE } from "@/modules/offers/offer-action-state";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="v-btn v-btn-primary"
      disabled={pending}
      aria-busy={pending || undefined}
    >
      {pending ? "Guardando…" : "Añadir comentario"}
    </button>
  );
}

/**
 * Alta de un comentario interno (bloque 5). Autor y fecha proceden siempre
 * de la sesión: el formulario solo envía el texto.
 */
export function CommentForm({ offerId }: { offerId: string }) {
  const [state, formAction] = useActionState(
    addOfferCommentAction,
    INITIAL_OFFER_ACTION_STATE,
  );

  return (
    <form action={formAction} noValidate className="flex flex-col gap-2">
      <input type="hidden" name="offerId" value={offerId} />
      <label className="v-label" htmlFor="comment-body">
        Añadir comentario
      </label>
      <textarea
        id="comment-body"
        name="body"
        rows={3}
        className="v-input"
        aria-invalid={state.errors.body ? true : undefined}
        aria-describedby={state.errors.body ? "comment-body-error" : undefined}
      />
      {state.errors.body ? (
        <span className="v-field-error" id="comment-body-error" role="alert">
          {state.errors.body}
        </span>
      ) : null}
      {state.errors._form ? (
        <span className="v-field-error" role="alert">
          {state.errors._form}
        </span>
      ) : null}
      <div>
        <Submit />
      </div>
    </form>
  );
}
