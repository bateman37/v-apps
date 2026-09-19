import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { formatCurrencyEur, formatDate, formatDays } from "@/lib/format";
import { truncate } from "@/lib/text";
import {
  hasActiveOfferFilters,
  type OfferFilterOptions,
  type OfferListFilters,
  type OfferListResult,
  type OfferSortField,
  type SelectOption,
} from "@/modules/offers/data";
import { buildOffersExportUrl, buildOffersUrl, nextSortDirection } from "@/modules/offers/list-url";

/**
 * Pantalla «Todas las ofertas». Es un componente de servidor: la búsqueda, los
 * filtros, la ordenación y la paginación se resuelven en PostgreSQL y nunca
 * cargando todas las ofertas en el navegador.
 */

const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const COLUMNS: Array<{ key: OfferSortField | null; label: string }> = [
  { key: "number", label: "Número" },
  { key: "date", label: "Fecha" },
  { key: "client", label: "Cliente" },
  { key: null, label: "Descripción" },
  { key: null, label: "Comercial" },
  { key: null, label: "PM" },
  { key: "status", label: "Estado" },
  { key: "amount", label: "Importe" },
  { key: null, label: "Jornadas" },
  { key: null, label: "Acción" },
];

export function OffersListScreen({
  filters,
  filterOptions,
  result,
}: {
  filters: OfferListFilters;
  filterOptions: OfferFilterOptions;
  result: OfferListResult;
}) {
  const filtersActive = hasActiveOfferFilters(filters);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={filters.scope === "archivadas" ? "Ofertas archivadas" : "Gestor de Ofertas"}
        subtitle={
          filters.scope === "archivadas"
            ? "Eliminación lógica (DEC-016): nada se ha borrado. Puedes consultarlas y recuperarlas."
            : "Todas las ofertas registradas en PostgreSQL."
        }
        actions={
          <>
            {result.total > 0 ? (
              <a className="v-btn v-btn-secondary" href={buildOffersExportUrl(filters)}>
                Exportar a Excel
              </a>
            ) : null}
            {filters.scope !== "archivadas" ? (
              <Link className="v-btn v-btn-primary" href="/offers/new">
                Nueva oferta
              </Link>
            ) : null}
          </>
        }
      />

      <OfferFilters filters={filters} options={filterOptions} active={filtersActive} />

      {result.total === 0 ? (
        <EmptyState
          title={
            filtersActive
              ? "Ninguna oferta coincide con los filtros"
              : "Todavía no existen ofertas"
          }
          description={
            filtersActive ? (
              <p>
                Prueba a limpiar los filtros o a ampliar la búsqueda. El histórico
                no se ha borrado: simplemente no hay coincidencias.
              </p>
            ) : (
              <p>
                Aún no se ha registrado ninguna oferta. Puedes crear la primera
                desde el botón siguiente.
              </p>
            )
          }
        >
          {filtersActive ? (
            <Link className="v-btn v-btn-secondary" href="/offers">
              Limpiar filtros
            </Link>
          ) : (
            <Link className="v-btn v-btn-primary" href="/offers/new">
              Crear la primera oferta
            </Link>
          )}
        </EmptyState>
      ) : (
        <>
          <ResultSummary result={result} />

          <div className="v-card overflow-x-auto">
            <table className="v-table">
              <caption className="sr-only">
                Listado de ofertas con número, fecha, cliente, descripción,
                comercial, Project Manager, estado, importe y total de jornadas.
              </caption>
              <thead>
                <tr>
                  {COLUMNS.map((column) => (
                    <th key={column.label} scope="col">
                      {column.key ? (
                        <SortLink
                          filters={filters}
                          column={column.key}
                          label={column.label}
                        />
                      ) : (
                        column.label
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.rows.map((row) => (
                  <tr key={row.id}>
                    <td className="v-num font-semibold">{row.number}</td>
                    <td className="v-num">{formatDate(row.offerDate)}</td>
                    <td>{row.clientName}</td>
                    <td className="max-w-xs">{truncate(row.description, 80)}</td>
                    <td>{row.commercialName}</td>
                    <td>{row.projectManagerName}</td>
                    <td>{row.statusName}</td>
                    <td className="v-num text-right">
                      {formatCurrencyEur(row.totalAmount)}
                    </td>
                    <td className="v-num text-right">
                      {formatDays(row.totalProfileDays)}
                    </td>
                    <td>
                      <Link className="v-link" href={`/offers/${row.id}`}>
                        Abrir
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination filters={filters} result={result} />
        </>
      )}
    </div>
  );
}

function ResultSummary({ result }: { result: OfferListResult }) {
  return (
    <div
      className="flex flex-wrap items-center gap-x-6 gap-y-1 rounded-md border px-4 py-3 text-sm"
      style={{
        borderColor: "var(--color-border)",
        backgroundColor: "var(--color-surface)",
      }}
    >
      <p>
        <span className="font-semibold">{result.total}</span>{" "}
        {result.total === 1 ? "oferta" : "ofertas"} en el resultado filtrado
      </p>
      <p className="text-[var(--color-text-muted)]">
        Importe total:{" "}
        <span
          className="v-num font-semibold"
          style={{ color: "var(--color-accent-text)" }}
        >
          {formatCurrencyEur(result.filteredTotalAmount)}
        </span>
      </p>
      <p className="text-[var(--color-text-muted)]">
        Jornadas por perfil:{" "}
        <span
          className="v-num font-semibold"
          style={{ color: "var(--color-accent-text)" }}
        >
          {formatDays(result.filteredTotalProfileDays)}
        </span>
      </p>
    </div>
  );
}

function SortLink({
  filters,
  column,
  label,
}: {
  filters: OfferListFilters;
  column: OfferSortField;
  label: string;
}) {
  const isActive = filters.sort === column;
  const direction = nextSortDirection(filters, column);
  const ariaSort = isActive
    ? filters.dir === "asc"
      ? "ascendente"
      : "descendente"
    : null;

  return (
    <Link
      href={buildOffersUrl(filters, { sort: column, dir: direction, page: 1 })}
      className="inline-flex items-center gap-1"
      style={{ color: isActive ? "var(--color-primary)" : undefined }}
    >
      {label}
      <span aria-hidden="true">{isActive ? (filters.dir === "asc" ? "▲" : "▼") : ""}</span>
      {ariaSort ? <span className="sr-only">(orden {ariaSort})</span> : null}
    </Link>
  );
}

function Pagination({
  filters,
  result,
}: {
  filters: OfferListFilters;
  result: OfferListResult;
}) {
  if (result.pageCount <= 1) {
    return null;
  }

  const hasPrevious = result.page > 1;
  const hasNext = result.page < result.pageCount;

  return (
    <nav
      aria-label="Paginación del listado de ofertas"
      className="flex items-center justify-between gap-4"
    >
      {hasPrevious ? (
        <Link
          className="v-btn v-btn-secondary"
          href={buildOffersUrl(filters, { page: result.page - 1 })}
        >
          Anterior
        </Link>
      ) : (
        <span className="v-btn v-btn-secondary" aria-disabled="true">
          Anterior
        </span>
      )}

      <p className="text-sm text-[var(--color-text-muted)]">
        Página <span className="font-semibold">{result.page}</span> de{" "}
        {result.pageCount}
      </p>

      {hasNext ? (
        <Link
          className="v-btn v-btn-secondary"
          href={buildOffersUrl(filters, { page: result.page + 1 })}
        >
          Siguiente
        </Link>
      ) : (
        <span className="v-btn v-btn-secondary" aria-disabled="true">
          Siguiente
        </span>
      )}
    </nav>
  );
}

/**
 * Filtros como formulario `GET`: no necesita JavaScript y deja el estado
 * completo en la URL. El orden activo se conserva mediante campos ocultos; la
 * página se reinicia al aplicar un filtro nuevo, que es el comportamiento
 * esperado.
 */
function OfferFilters({
  filters,
  options,
  active,
}: {
  filters: OfferListFilters;
  options: OfferFilterOptions;
  active: boolean;
}) {
  return (
    <form method="get" action="/offers" className="v-card px-4 py-4">
      <input type="hidden" name="sort" value={filters.sort} />
      <input type="hidden" name="dir" value={filters.dir} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <label className="v-label" htmlFor="q">
            Búsqueda
          </label>
          <input
            id="q"
            name="q"
            type="search"
            className="v-input"
            defaultValue={filters.q}
            placeholder="Número, descripción, cliente o solicitante"
          />
        </div>

        <FilterSelect
          id="year"
          label="Año"
          emptyLabel="Todos"
          defaultValue={filters.year === null ? "" : String(filters.year)}
          options={options.years.map((year) => ({
            id: String(year),
            label: String(year),
            isActive: true,
          }))}
        />

        <FilterSelect
          id="month"
          label="Mes"
          emptyLabel="Todos"
          defaultValue={filters.month === null ? "" : String(filters.month)}
          options={MONTHS.map((month, index) => ({
            id: String(index + 1),
            label: month,
            isActive: true,
          }))}
        />

        <FilterSelect
          id="clientId"
          label="Cliente"
          emptyLabel="Todos"
          defaultValue={filters.clientId}
          options={options.clients}
        />
        <FilterSelect
          id="commercialId"
          label="Comercial"
          emptyLabel="Todos"
          defaultValue={filters.commercialId}
          options={options.commercials}
        />
        <FilterSelect
          id="projectManagerId"
          label="Project Manager"
          emptyLabel="Todos"
          defaultValue={filters.projectManagerId}
          options={options.projectManagers}
        />
        <FilterSelect
          id="statusId"
          label="Estado"
          emptyLabel="Todos"
          defaultValue={filters.statusId}
          options={options.statuses}
        />
        <FilterSelect
          id="offerTypeId"
          label="Tipo de oferta"
          emptyLabel="Todos"
          defaultValue={filters.offerTypeId}
          options={options.offerTypes}
        />
        <FilterSelect
          id="originId"
          label="Origen"
          emptyLabel="Todos"
          defaultValue={filters.originId}
          options={options.origins}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="submit" className="v-btn v-btn-primary">
          Aplicar filtros
        </button>
        {active ? (
          <Link className="v-btn v-btn-secondary" href="/offers">
            Limpiar filtros
          </Link>
        ) : null}
      </div>
    </form>
  );
}

function FilterSelect({
  id,
  label,
  emptyLabel,
  defaultValue,
  options,
}: {
  id: string;
  label: string;
  emptyLabel: string;
  defaultValue: string;
  options: SelectOption[];
}) {
  return (
    <div>
      <label className="v-label" htmlFor={id}>
        {label}
      </label>
      <select id={id} name={id} className="v-input" defaultValue={defaultValue}>
        <option value="">{emptyLabel}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
