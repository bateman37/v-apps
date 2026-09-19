import type { Metadata } from "next";
import { DatabaseConnectionError } from "@/components/ui/database-connection-error";
import { PageHeader } from "@/components/ui/page-header";
import {
  getOfferFilterOptions,
  getPendingReviewOffers,
  parsePendingReviewFilters,
  type RawSearchParams,
} from "@/modules/offers/data";
import { PendingReviewScreen } from "@/modules/offers/pending-review-screen";
import { requireUser } from "@/modules/auth/session";
import { isAdmin } from "@/modules/auth/identity";

export const metadata: Metadata = {
  title: "Pendiente de revisión · Vincle Apps",
};

export const dynamic = "force-dynamic";

export default async function PendingReviewPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const user = await requireUser();
  const filters = parsePendingReviewFilters(await searchParams);

  let rows;
  let filterOptions;
  try {
    [rows, filterOptions] = await Promise.all([
      getPendingReviewOffers(user, filters),
      getOfferFilterOptions(),
    ]);
  } catch (error) {
    return <DatabaseConnectionError title="Pendiente de revisión" error={error} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Pendiente de revisión"
        subtitle="Ofertas que esperan tu valoración como PM o comercial asignado. Se deriva del estado actual: no es un circuito de aprobación aparte."
      />
      <PendingReviewScreen
        rows={rows}
        filters={filters}
        isAdmin={isAdmin(user)}
        commercials={filterOptions.commercials}
        projectManagers={filterOptions.projectManagers}
        clients={filterOptions.clients}
      />
    </div>
  );
}
