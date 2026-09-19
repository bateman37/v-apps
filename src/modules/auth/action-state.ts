import type { FieldErrors } from "@/lib/validation";

/** Estado devuelto por las Server Actions de autenticación. */
export type AuthFormState = {
  status: "idle" | "error" | "success";
  errors: FieldErrors;
  message: string | null;
};

export const INITIAL_AUTH_FORM_STATE: AuthFormState = {
  status: "idle",
  errors: {},
  message: null,
};

export function authError(errors: FieldErrors): AuthFormState {
  return { status: "error", errors, message: null };
}
