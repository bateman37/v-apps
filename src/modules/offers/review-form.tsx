"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { fieldAria, FormField } from "@/components/ui/form-field";
import { reviewOfferAction } from "@/modules/offers/actions";
import {
  INITIAL_OFFER_ACTION_STATE,
} from "@/modules/offers/offer-action-state";
import type { ReviewStatusOption } from "@/modules/offers/data";

const ACCEPTED_STATUS_CODE = "ACCEPTED";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="v-btn v-btn-primary"
      disabled={pending}
      aria-busy={pending || undefined}
    >
      {pending ? "Guardando…" : "Completar revisión"}
    </button>
  );
}

/**
 * Formulario de revisión (bloque 8.3): exige elegir un estado distinto del
 * que generó la pendiente. `expectedStatusId` detecta si otra persona movió
 * la oferta mientras se revisaba.
 */
export function ReviewForm({
  offerId,
  currentStatusId,
  statusOptions,
}: {
  offerId: string;
  currentStatusId: string;
  statusOptions: ReviewStatusOption[];
}) {
  const [state, formAction] = useActionState(
    reviewOfferAction,
    INITIAL_OFFER_ACTION_STATE,
  );
  const [selectedStatusId, setSelectedStatusId] = useState("");
  const selectedStatus = statusOptions.find((option) => option.id === selectedStatusId);
  const needsNavision = selectedStatus?.code === ACCEPTED_STATUS_CODE;

  return (
    <form action={formAction} noValidate className="flex flex-col gap-4">
      <input type="hidden" name="offerId" value={offerId} />
      <input type="hidden" name="expectedStatusId" value={currentStatusId} />

      <FormField id="review-status" label="Nuevo estado" required error={state.errors.statusId}>
        <select
          id="review-status"
          name="statusId"
          className="v-input"
          value={selectedStatusId}
          onChange={(event) => setSelectedStatusId(event.target.value)}
          {...fieldAria("review-status", state.errors.statusId)}
        >
          <option value="" disabled>
            Selecciona un estado…
          </option>
          {statusOptions
            .filter((option) => option.id !== currentStatusId)
            .map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
        </select>
      </FormField>

      {needsNavision ? (
        <FormField
          id="review-navision"
          label="Pedido de Navision"
          required
          error={state.errors.navisionOrder}
          hint="Obligatorio porque el nuevo estado es Aceptado."
        >
          <input
            id="review-navision"
            name="navisionOrder"
            type="text"
            className="v-input"
            {...fieldAria("review-navision", state.errors.navisionOrder, true)}
          />
        </FormField>
      ) : null}

      <FormField
        id="review-comment"
        label="Comentario (opcional)"
        error={state.errors.comment}
      >
        <textarea
          id="review-comment"
          name="comment"
          rows={3}
          className="v-input"
          {...fieldAria("review-comment", state.errors.comment)}
        />
      </FormField>

      {state.errors._form ? (
        <p className="v-field-error" role="alert">
          {state.errors._form}
        </p>
      ) : null}
      {state.status === "success" && state.message ? (
        <p role="status" className="text-sm font-semibold" style={{ color: "var(--color-success)" }}>
          {state.message}
        </p>
      ) : null}

      <div>
        <Submit />
      </div>
    </form>
  );
}
