export function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
        active
          ? "bg-[color-mix(in_srgb,var(--color-success)_12%,transparent)] text-[var(--color-success)]"
          : "bg-[var(--color-border)] text-[var(--color-text-muted)]"
      }`}
    >
      {active ? "Activo" : "Inactivo"}
    </span>
  );
}
