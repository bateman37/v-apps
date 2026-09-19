export function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className="v-badge"
      style={
        active
          ? {
              backgroundColor: "var(--color-success-soft)",
              borderColor: "var(--color-success)",
              color: "var(--color-success)",
            }
          : {
              backgroundColor: "var(--color-surface-muted)",
              borderColor: "var(--color-border-strong)",
              color: "var(--color-text-muted)",
            }
      }
    >
      {active ? "Activo" : "Inactivo"}
    </span>
  );
}
