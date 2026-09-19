"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { archiveOfferAction, restoreOfferAction } from "@/modules/offers/actions";
import { INITIAL_OFFER_ACTION_STATE } from "@/modules/offers/offer-action-state";

function Submit({ children, confirmMessage }: { children: string; confirmMessage: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="v-btn v-btn-secondary"
      disabled={pending}
      aria-busy={pending || undefined}
      onClick={(event) => {
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      {pending ? "Guardando…" : children}
    </button>
  );
}

/** Archivar/recuperar (bloque 7): eliminación lógica, nunca borrado físico. */
export function ArchiveControls({
  offerId,
  offerNumber,
  isArchived,
}: {
  offerId: string;
  offerNumber: string;
  isArchived: boolean;
}) {
  const [state, formAction] = useActionState(
    isArchived ? restoreOfferAction : archiveOfferAction,
    INITIAL_OFFER_ACTION_STATE,
  );

  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <input type="hidden" name="offerId" value={offerId} />
      <Submit
        confirmMessage={
          isArchived
            ? `¿Recuperar la oferta ${offerNumber}?\n\nVolverá al listado ordinario con el mismo número y los mismos datos.`
            : `¿Archivar la oferta ${offerNumber}?\n\nNo se borra nada: se ocultará del listado ordinario y podrás recuperarla en cualquier momento desde «Ofertas archivadas».`
        }
      >
        {isArchived ? "Recuperar" : "Archivar"}
      </Submit>
      {state.errors._form ? (
        <span className="v-field-error" role="alert">
          {state.errors._form}
        </span>
      ) : null}
    </form>
  );
}
