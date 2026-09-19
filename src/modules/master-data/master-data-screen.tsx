import type { MasterDataGroup } from "@/modules/master-data/data";
import { StatusBadge } from "@/components/ui/status-badge";

export function MasterDataScreen({ groups }: { groups: MasterDataGroup[] }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-text)]">
          Maestros
        </h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          Consulta de los valores maestros del Gestor de Ofertas. En esta
          entrega solo es posible consultarlos: el alta, la edición y la
          activación o desactivación se incorporarán en Administración común
          más adelante.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {groups.map((group) => (
          <MasterDataGroupCard key={group.key} group={group} />
        ))}
      </div>
    </div>
  );
}

function MasterDataGroupCard({ group }: { group: MasterDataGroup }) {
  return (
    <section
      aria-labelledby={`group-${group.key}`}
      className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]"
    >
      <header className="flex items-center justify-between gap-4 border-b border-[var(--color-border)] px-4 py-3">
        <h2
          id={`group-${group.key}`}
          className="text-sm font-semibold text-[var(--color-text)]"
        >
          {group.label}
        </h2>
        <span className="text-xs text-[var(--color-text-muted)]">
          {group.records.length}{" "}
          {group.records.length === 1 ? "registro" : "registros"}
        </span>
      </header>

      {group.records.length === 0 ? (
        <p className="px-4 py-4 text-sm text-[var(--color-text-muted)]">
          Todavía no hay valores aprobados para este maestro.
        </p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
              <th scope="col" className="px-4 py-2 font-medium">
                Orden
              </th>
              <th scope="col" className="px-4 py-2 font-medium">
                Nombre visible
              </th>
              <th scope="col" className="px-4 py-2 font-medium">
                Código técnico
              </th>
              <th scope="col" className="px-4 py-2 font-medium">
                Estado
              </th>
            </tr>
          </thead>
          <tbody>
            {group.records.map((record) => (
              <tr
                key={record.id}
                className="border-b border-[var(--color-border)] last:border-b-0"
              >
                <td className="px-4 py-2 text-[var(--color-text-muted)]">
                  {record.sortOrder}
                </td>
                <td className="px-4 py-2 text-[var(--color-text)]">
                  {record.name}
                </td>
                <td className="px-4 py-2 font-mono text-xs text-[var(--color-text-muted)]">
                  {record.code}
                </td>
                <td className="px-4 py-2">
                  <StatusBadge active={record.isActive} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
