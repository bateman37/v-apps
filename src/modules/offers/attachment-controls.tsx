"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  removeOfferAttachmentAction,
  uploadOfferAttachmentAction,
} from "@/modules/offers/actions";
import { INITIAL_OFFER_ACTION_STATE } from "@/modules/offers/offer-action-state";

function UploadSubmit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="v-btn v-btn-primary"
      disabled={pending}
      aria-busy={pending || undefined}
    >
      {pending ? "Subiendo…" : "Adjuntar archivo"}
    </button>
  );
}

/** Subida de un adjunto (bloque 6): validación real en servidor. */
export function AttachmentUploadForm({ offerId }: { offerId: string }) {
  const [state, formAction] = useActionState(
    uploadOfferAttachmentAction,
    INITIAL_OFFER_ACTION_STATE,
  );

  return (
    <form action={formAction} noValidate className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="offerId" value={offerId} />
      <div>
        <label className="v-label" htmlFor="attachment-file">
          Adjuntar documento
        </label>
        <input
          id="attachment-file"
          name="file"
          type="file"
          className="v-input"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.xlsm,.ppt,.pptx,.png,.jpg,.jpeg,.msg"
          aria-invalid={state.errors.file ? true : undefined}
          aria-describedby={state.errors.file ? "attachment-file-error" : undefined}
        />
      </div>
      <UploadSubmit />
      <div className="w-full">
        {state.errors.file ? (
          <span className="v-field-error" id="attachment-file-error" role="alert">
            {state.errors.file}
          </span>
        ) : null}
        {state.errors._form ? (
          <span className="v-field-error" role="alert">
            {state.errors._form}
          </span>
        ) : null}
        {state.status === "success" && state.message ? (
          <p role="status" className="text-sm font-semibold" style={{ color: "var(--color-success)" }}>
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}

function RemoveSubmit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="v-btn v-btn-quiet"
      disabled={pending}
      aria-busy={pending || undefined}
      onClick={(event) => {
        if (!window.confirm("¿Retirar este adjunto?\n\nNo se borra el archivo: deja de poder descargarse y queda registrado quién lo retiró.")) {
          event.preventDefault();
        }
      }}
    >
      {pending ? "Retirando…" : "Retirar"}
    </button>
  );
}

export function RemoveAttachmentForm({
  offerId,
  attachmentId,
}: {
  offerId: string;
  attachmentId: string;
}) {
  const [state, formAction] = useActionState(
    removeOfferAttachmentAction,
    INITIAL_OFFER_ACTION_STATE,
  );

  return (
    <form action={formAction}>
      <input type="hidden" name="offerId" value={offerId} />
      <input type="hidden" name="attachmentId" value={attachmentId} />
      <RemoveSubmit />
      {state.errors._form ? (
        <span className="v-field-error" role="alert">
          {state.errors._form}
        </span>
      ) : null}
    </form>
  );
}
