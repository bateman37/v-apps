import type { Metadata } from "next";
import {
  getOfferFilterOptions,
  getOffersPage,
  parseOfferListParams,
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

export default async function OffersPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const user = await requireUser();
  const filters = parseOfferListParams(await searchParams);

  let data;
  try {
    const [filterOptions, result] = await Promise.all([
      getOfferFilterOptions(),
      getOffersPage(filters, user),
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
    />
  );
}
