import type { Metadata } from "next";
import {
  getOfferFilterOptions,
  getOffersPage,
  isIncoherentDateRange,
  parseOfferListParams,
  type OfferListResult,
  type RawSearchParams,
} from "@/modules/offers/data";
import { OffersListScreen } from "@/modules/offers/offers-list-screen";
import { DatabaseConnectionError } from "@/components/ui/database-connection-error";
import { requireUser } from "@/modules/auth/session";

export const metadata: Metadata = {
  title: "Gestor de Ofertas · Vincle Apps",
};

// El contenido depende siempre de PostgreSQL y de los parámetros de la URL.
export const dynamic = "force-dynamic";

const EMPTY_RESULT: OfferListResult = {
  rows: [],
  total: 0,
  page: 1,
  pageCount: 1,
  filteredTotalAmount: "0",
  filteredTotalProfileDays: "0",
};

export default async function OffersPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const user = await requireUser();
  const filters = parseOfferListParams(await searchParams);

  // Un rango de fechas incoherente («Desde» posterior a «Hasta») no ejecuta
  // ninguna consulta: se avisa y se deja corregir el filtro (bloque 6.1).
  const dateRangeError = isIncoherentDateRange(filters);

  let data;
  try {
    const [filterOptions, result] = await Promise.all([
      getOfferFilterOptions(),
      dateRangeError ? Promise.resolve(EMPTY_RESULT) : getOffersPage(filters, user),
    ]);
    data = { filterOptions, result };
  } catch (error) {
    return <DatabaseConnectionError title="Gestor de Ofertas" error={error} />;
  }

  return (
    <OffersListScreen
      filters={filters}
      filterOptions={data.filterOptions}
      result={data.result}
      dateRangeError={dateRangeError}
    />
  );
}
