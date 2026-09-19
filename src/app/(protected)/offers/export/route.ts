import { getOfferYears } from "@/modules/offers/data";
import { parseOfferListParams } from "@/modules/offers/data";
import { buildOffersExportWorkbook } from "@/modules/offers/export";
import { requireUser } from "@/modules/auth/session";

/**
 * Exportación a Excel del listado (bloque 10). Ruta propia porque devuelve
 * un binario; reutiliza los mismos parámetros de la URL que `/offers`, así
 * que exportar "lo que se está viendo" es simplemente añadir `/export` a la
 * URL actual.
 */
export async function GET(request: Request) {
  const user = await requireUser();
  const url = new URL(request.url);
  const params = Object.fromEntries(url.searchParams.entries());
  const filters = parseOfferListParams(params);

  const availableYears =
    filters.month !== null && filters.year === null ? await getOfferYears() : [];

  const buffer = await buildOffersExportWorkbook(filters, availableYears, user);

  const today = new Date().toISOString().slice(0, 10);
  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="ofertas-${today}.xlsx"`,
      "Cache-Control": "private, no-store",
    },
  });
}
