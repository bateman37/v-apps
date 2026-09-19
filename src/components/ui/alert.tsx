import type { ReactNode } from "react";

export type AlertTone = "success" | "warning" | "error" | "info";

const TONE_STYLE: Record<AlertTone, { background: string; border: string; text: string }> =
  {
    success: {
      background: "var(--color-success-soft)",
      border: "var(--color-success)",
      text: "var(--color-success)",
    },
    warning: {
      background: "var(--color-warning-soft)",
      border: "var(--color-warning)",
      text: "var(--color-warning)",
    },
    error: {
      background: "var(--color-danger-soft)",
      border: "var(--color-danger)",
      text: "var(--color-danger)",
    },
    info: {
      background: "var(--color-primary-soft)",
      border: "var(--color-primary)",
      text: "var(--color-primary)",
    },
  };

const TONE_LABEL: Record<AlertTone, string> = {
  success: "Correcto",
  warning: "Aviso",
  error: "Error",
  info: "Información",
};

/**
 * Aviso accesible. El prefijo textual (`Error`, `Aviso`, ...) evita que el
 * significado dependa únicamente del color, tal como exige la guía de
 * accesibilidad de `docs/design/BRAND_UI.md`.
 */
export function Alert({
  tone,
  title,
  children,
}: {
  tone: AlertTone;
  title?: string;
  children?: ReactNode;
}) {
  const style = TONE_STYLE[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className="flex flex-col gap-1 rounded-md border px-4 py-3 text-sm"
      style={{
        backgroundColor: style.background,
        borderColor: style.border,
        color: "var(--color-text)",
      }}
    >
      <p className="font-semibold" style={{ color: style.text }}>
        {title ?? TONE_LABEL[tone]}
      </p>
      {children ? <div className="max-w-prose">{children}</div> : null}
    </div>
  );
}
