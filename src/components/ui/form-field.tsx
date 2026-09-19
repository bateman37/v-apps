import type { ReactNode } from "react";

/**
 * Envoltura común de un campo de formulario: etiqueta, control, ayuda y
 * error. El error se asocia al control mediante `aria-describedby` y el
 * control se marca con `aria-invalid`, de modo que el problema se percibe
 * también sin ver el color.
 */
export function FormField({
  id,
  label,
  error,
  hint,
  required,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: ReactNode;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="v-label" htmlFor={id}>
        {label}
        {required ? (
          <span
            aria-hidden="true"
            className="ml-1"
            style={{ color: "var(--color-danger)" }}
          >
            *
          </span>
        ) : null}
        {required ? <span className="sr-only"> (obligatorio)</span> : null}
      </label>
      {children}
      {hint ? (
        <p className="v-hint" id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <span className="v-field-error" id={`${id}-error`} role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}

/** Atributos ARIA de un control en función de su estado de error y ayuda. */
export function fieldAria(id: string, error?: string, hasHint = false) {
  const describedBy = [hasHint ? `${id}-hint` : null, error ? `${id}-error` : null]
    .filter(Boolean)
    .join(" ");

  return {
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy === "" ? undefined : describedBy,
  } as const;
}
