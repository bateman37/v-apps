import type { OfferListFilters, OfferSortField, SortDirection } from "@/modules/offers/data";

/**
 * Construcción de las URL del listado.
 *
 * Todo el estado (búsqueda, filtros, orden y página) vive en la URL, de modo
 * que una pantalla filtrada es reproducible y se puede compartir o recargar.
 * Ordenar o paginar conserva siempre los filtros activos.
 */

export type OfferListOverrides = Partial<{
  sort: OfferSortField;
  dir: SortDirection;
  page: number;
}>;

function buildOffersParams(
  filters: OfferListFilters,
  overrides: OfferListOverrides = {},
): URLSearchParams {
  const params = new URLSearchParams();
  const sort = overrides.sort ?? filters.sort;
  const dir = overrides.dir ?? filters.dir;
  const page = overrides.page ?? filters.page;

  if (filters.q) {
    params.set("q", filters.q);
  }
  if (filters.year !== null) {
    params.set("year", String(filters.year));
  }
  if (filters.month !== null) {
    params.set("month", String(filters.month));
  }
  if (filters.clientId) {
    params.set("clientId", filters.clientId);
  }
  if (filters.commercialId) {
    params.set("commercialId", filters.commercialId);
  }
  if (filters.projectManagerId) {
    params.set("projectManagerId", filters.projectManagerId);
  }
  if (filters.statusId) {
    params.set("statusId", filters.statusId);
  }
  if (filters.offerTypeId) {
    params.set("offerTypeId", filters.offerTypeId);
  }
  if (filters.originId) {
    params.set("originId", filters.originId);
  }
  // Preservar el ámbito (activas/archivadas, bloque 7) en cualquier enlace
  // derivado del listado: ordenar, paginar o exportar desde «Ofertas
  // archivadas» debe seguir viendo archivadas, nunca volver a activas.
  if (filters.scope === "archivadas") {
    params.set("scope", filters.scope);
  }

  params.set("sort", sort);
  params.set("dir", dir);
  if (page > 1) {
    params.set("page", String(page));
  }

  return params;
}

export function buildOffersUrl(
  filters: OfferListFilters,
  overrides: OfferListOverrides = {},
): string {
  return `/offers?${buildOffersParams(filters, overrides).toString()}`;
}

/** URL de exportación a Excel con exactamente los mismos filtros y ámbito. */
export function buildOffersExportUrl(filters: OfferListFilters): string {
  return `/offers/export?${buildOffersParams(filters).toString()}`;
}

/** Dirección que debe aplicar un encabezado de columna al pulsarlo. */
export function nextSortDirection(
  filters: OfferListFilters,
  column: OfferSortField,
): SortDirection {
  if (filters.sort !== column) {
    return column === "client" ? "asc" : "desc";
  }
  return filters.dir === "asc" ? "desc" : "asc";
}
