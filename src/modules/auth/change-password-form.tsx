"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { fieldAria, FormField } from "@/components/ui/form-field";
import { changeOwnPasswordAction } from "@/modules/auth/actions";
import { INITIAL_AUTH_FORM_STATE } from "@/modules/auth/action-state";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="v-btn v-btn-primary"
      disabled={pending}
      aria-busy={pending || undefined}
    >
      {pending ? "Guardando…" : "Cambiar contraseña"}
    </button>
  );
}

export function ChangePasswordForm() {
  const [state, formAction] = useActionState(
    changeOwnPasswordAction,
    INITIAL_AUTH_FORM_STATE,
  );

  return (
    <form action={formAction} noValidate className="flex flex-col gap-4">
      <FormField
        id="currentPassword"
        label="Contraseña actual"
        error={state.errors.currentPassword}
      >
        <input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          className="v-input"
          {...fieldAria("currentPassword", state.errors.currentPassword)}
        />
      </FormField>

      <FormField
        id="newPassword"
        label="Contraseña nueva"
        error={state.errors.newPassword}
        hint="Debe ser distinta de la actual y suficientemente robusta."
      >
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          className="v-input"
          {...fieldAria("newPassword", state.errors.newPassword, true)}
        />
      </FormField>

      <FormField
        id="repeatPassword"
        label="Repite la contraseña nueva"
        error={state.errors.repeatPassword}
      >
        <input
          id="repeatPassword"
          name="repeatPassword"
          type="password"
          autoComplete="new-password"
          className="v-input"
          {...fieldAria("repeatPassword", state.errors.repeatPassword)}
        />
      </FormField>

      {state.errors._form ? (
        <p className="v-field-error" role="alert">
          {state.errors._form}
        </p>
      ) : null}
      {state.status === "success" && state.message ? (
        <p
          role="status"
          className="text-sm font-semibold"
          style={{ color: "var(--color-success)" }}
        >
          {state.message}
        </p>
      ) : null}

      <Submit />
    </form>
  );
}
