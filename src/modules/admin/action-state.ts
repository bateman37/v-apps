import type { FieldErrors } from "@/lib/validation";

/**
 * Estado común devuelto por las Server Actions de Administración.
 *
 * `targetId` permite que la pantalla muestre el mensaje o el error junto al
 * registro concreto que se estaba editando, en lugar de en un aviso global.
 */
export type AdminActionState = {
  status: "idle" | "success" | "error";
  message: string | null;
  errors: FieldErrors;
  targetId: string | null;
};

export const INITIAL_ADMIN_ACTION_STATE: AdminActionState = {
  status: "idle",
  message: null,
  errors: {},
  targetId: null,
};

export function adminSuccess(
  message: string,
  targetId: string | null = null,
): AdminActionState {
  return { status: "success", message, errors: {}, targetId };
}

export function adminError(
  errors: FieldErrors,
  targetId: string | null = null,
  message: string | null = null,
): AdminActionState {
  return { status: "error", message, errors, targetId };
}
