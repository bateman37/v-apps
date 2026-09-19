"use client";

import { useFormStatus } from "react-dom";

/**
 * Botón de envío que se deshabilita mientras la Server Action está en curso.
 * Es la protección real contra dobles clics y reenvíos accidentales: el
 * navegador no puede enviar el formulario dos veces con el botón inhabilitado.
 */
export function SubmitButton({
  children,
  pendingLabel,
  variant = "primary",
}: {
  children: string;
  pendingLabel?: string;
  variant?: "primary" | "secondary";
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className={`v-btn ${variant === "primary" ? "v-btn-primary" : "v-btn-secondary"}`}
      disabled={pending}
      aria-busy={pending || undefined}
    >
      {pending ? (pendingLabel ?? "Guardando…") : children}
    </button>
  );
}
