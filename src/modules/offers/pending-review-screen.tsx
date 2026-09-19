import Link from "next/link";
import { formatDate } from "@/lib/format";
import type { PendingReviewFilters, PendingReviewRow } from "@/modules/offers/data";
import type { SelectOption } from "@/modules/offers/data";

/**
 * Bandeja «Pendiente de revisión» (bloque 8): se deriva del estado y de la
 * asignación, no de un circuito paralelo de aprobaciones. La revisión en sí
 * se completa desde la ficha de cada oferta (`ReviewForm`).
 */
export function PendingReviewScreen({
  rows,
  filters,
  isAdmin,
  commercials,
  projectManagers,
  clients,
}: {
  rows: PendingReviewRow[];
  filters: PendingReviewFilters;
  isAdmin: boolean;
  commercials: SelectOption[];
  projectManagers: SelectOption[];
  clients: SelectOption[];
}) {
  return (
    <div className="flex flex-col gap-4">
      {isAdmin ? (
        <form
          method="get"
          className="v-card flex flex-wrap items-end gap-3 px-4 py-4"
        >
          <div className="sm:w-40">
            <label className="v-label" htmlFor="kind">
              Tipo
            </label>
            <select id="kind" name="kind" className="v-input" defaultValue={filters.kind}>
              <option value="all">Todas</option>
              <option value="PM">A valorar PM</option>
              <option value="COMMERCIAL">Entregado a comercial</option>
            </select>
          </div>
          <div className="sm:w-48">
            <label className="v-label" htmlFor="commercialId">
              Comercial
            </label>
            <select
              id="commercialId"
              name="commercialId"
              className="v-input"
              defaultValue={filters.commercialId}
            >
              <option value="">Todos</option>
              {commercials.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:w-48">
            <label className="v-label" htmlFor="projectManagerId">
              Project Manager
            </label>
            <select
              id="projectManagerId"
              name="projectManagerId"
              className="v-input"
              defaultValue={filters.projectManagerId}
            >
              <option value="">Todos</option>
              {projectManagers.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:w-48">
            <label className="v-label" htmlFor="clientId">
              Cliente
            </label>
            <select id="clientId" name="clientId" className="v-input" defaultValue={filters.clientId}>
              <option value="">Todos</option>
              {clients.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:w-32">
            <label className="v-label" htmlFor="minDays">
              Antigüedad mín. (días)
            </label>
            <input
              id="minDays"
              name="minDays"
              type="number"
              min={0}
              className="v-input"
              defaultValue={filters.minDays ?? ""}
            />
          </div>
          <button type="submit" className="v-btn v-btn-secondary">
            Filtrar
          </button>
        </form>
      ) : null}

      <div className="v-card">
        {rows.length === 0 ? (
          <p className="px-4 py-6 text-sm text-[var(--color-text-muted)]">
            No hay ofertas pendientes de revisión.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="v-table">
              <thead>
                <tr>
                  <th scope="col">Número</th>
                  <th scope="col">Cliente</th>
                  <th scope="col">Descripción</th>
                  <th scope="col">Tipo</th>
                  <th scope="col">Estado</th>
                  <th scope="col">Comercial</th>
                  <th scope="col">PM</th>
                  <th scope="col">Pendiente desde</th>
                  <th scope="col" className="text-right">
                    Días
                  </th>
                  <th scope="col">Acción</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="v-num">{row.number}</td>
                    <td>{row.clientName}</td>
                    <td className="max-w-xs truncate">{row.description}</td>
                    <td>{row.kind === "PM" ? "A valorar PM" : "Entregado a comercial"}</td>
                    <td>{row.statusName}</td>
                    <td>{row.commercialName}</td>
                    <td>{row.projectManagerName}</td>
                    <td className="v-num">{formatDate(row.pendingSince)}</td>
                    <td className="v-num text-right">{row.pendingDays}</td>
                    <td>
                      <Link className="v-btn v-btn-secondary" href={`/offers/${row.id}`}>
                        Revisar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
