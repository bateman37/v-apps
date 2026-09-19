import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  children,
}: {
  title: string;
  description: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-10">
      <p className="text-base font-semibold text-[var(--color-text)]">
        {title}
      </p>
      <div className="max-w-prose text-sm leading-relaxed text-[var(--color-text-muted)]">
        {description}
      </div>
      {children}
    </div>
  );
}
