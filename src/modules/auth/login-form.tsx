"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { fieldAria, FormField } from "@/components/ui/form-field";
import { INITIAL_AUTH_FORM_STATE } from "@/modules/auth/action-state";
import { loginAction } from "@/modules/auth/actions";

function LoginSubmit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="v-btn v-btn-primary w-full"
      disabled={pending}
      aria-busy={pending || undefined}
    >
      {pending ? "Comprobando…" : "Iniciar sesión"}
    </button>
  );
}

/**
 * Formulario de inicio de sesión.
 *
 * El mensaje de error es siempre el mismo tanto si el usuario no existe,
 * como si la contraseña es incorrecta, como si la cuenta está desactivada
 * (ver `loginAction`): no se revela qué cuentas existen.
 */
export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const [state, formAction] = useActionState(loginAction, INITIAL_AUTH_FORM_STATE);

  return (
    <form action={formAction} noValidate className="flex flex-col gap-4">
      <input type="hidden" name="redirectTo" value={redirectTo} />

      <FormField id="username" label="Usuario">
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          className="v-input"
          {...fieldAria("username")}
        />
      </FormField>

      <FormField id="password" label="Contraseña">
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          className="v-input"
          {...fieldAria("password")}
        />
      </FormField>

      {state.status === "error" && state.errors._form ? (
        <p className="v-field-error" role="alert">
          {state.errors._form}
        </p>
      ) : null}

      <LoginSubmit />
    </form>
  );
}
