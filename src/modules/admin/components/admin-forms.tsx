"use client";

import { useActionState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import {
  INITIAL_ADMIN_ACTION_STATE,
  type AdminActionState,
} from "@/modules/admin/action-state";

/**
 * Piezas comunes de los formularios de Administración.
 *
 * Son componentes de cliente porque cada fila necesita su propio estado de
 * envío (`useActionState`), su indicación de «guardando…» y, en el caso de la
 * desactivación, una confirmación explícita antes de enviar.
 */

export type AdminAction = (
  state: AdminActionState,
  formData: FormData,
) => Promise<AdminActionState>;

/** Botón de envío que se inhabilita mientras la acción está en curso. */
export function AdminSubmit({
  children,
  variant = "secondary",
  confirmMessage,
}: {
  children: string;
  variant?: "primary" | "secondary" | "quiet";
  confirmMessage?: string;
}) {
  const { pending } = useFormStatus();
  const className =
    variant === "primary"
      ? "v-btn v-btn-primary"
      : variant === "quiet"
        ? "v-btn v-btn-quiet"
        : "v-btn v-btn-secondary";

  return (
    <button
      type="submit"
      className={className}
      disabled={pending}
      aria-busy={pending || undefined}
      onClick={(event) => {
        if (confirmMessage && !window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      {pending ? "Guardando…" : children}
    </button>
  );
}

/** Mensaje de resultado (éxito o error) de una acción de Administración. */
export function AdminFeedback({ state }: { state: AdminActionState }) {
  if (state.status === "idle") {
    return null;
  }

  const message =
    state.message ?? state.errors._form ?? Object.values(state.errors)[0] ?? null;

  if (!message) {
    return null;
  }

  const isError = state.status === "error";

  return (
    <p
      role={isError ? "alert" : "status"}
      className="mt-1 text-xs font-semibold"
      style={{ color: isError ? "var(--color-danger)" : "var(--color-success)" }}
    >
      {isError ? "Error: " : "Hecho: "}
      {message}
    </p>
  );
}

/**
 * Formulario de activación/desactivación de un registro de maestro.
 *
 * La desactivación siempre pide confirmación y explica que no se borra nada:
 * el histórico que referencia el registro se conserva íntegro.
 */
export function ToggleActiveForm({
  action,
  id,
  isActive,
  name,
  entityLabel,
  extraFields,
}: {
  action: AdminAction;
  id: string;
  isActive: boolean;
  name: string;
  entityLabel: string;
  /** Campos ocultos adicionales, por ejemplo el catálogo de un maestro. */
  extraFields?: Record<string, string>;
}) {
  const [state, formAction] = useActionState(action, INITIAL_ADMIN_ACTION_STATE);

  return (
    <form action={formAction}>
      {Object.entries(extraFields ?? {}).map(([key, value]) => (
        <input key={key} type="hidden" name={key} value={value} />
      ))}
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="isActive" value={isActive ? "false" : "true"} />
      <AdminSubmit
        variant="quiet"
        confirmMessage={
          isActive
            ? `¿Desactivar ${entityLabel} «${name}»?\n\nNo se borra nada: los registros históricos que lo utilizan se conservan y seguirán mostrándolo. Simplemente dejará de ofrecerse al crear datos nuevos.`
            : undefined
        }
      >
        {isActive ? "Desactivar" : "Activar"}
      </AdminSubmit>
      <AdminFeedback state={state} />
    </form>
  );
}

/** Contenedor de una tarjeta de Administración con título y descripción. */
export function AdminCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="v-card">
      <header className="v-card-header">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--color-primary)]">
            {title}
          </h2>
          {description ? <p className="v-hint">{description}</p> : null}
        </div>
      </header>
      <div className="px-4 py-4">{children}</div>
    </section>
  );
}
