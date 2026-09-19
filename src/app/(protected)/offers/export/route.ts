import {
  isIncoherentDateRange,
  parseOfferListParams,
  type RawSearchParams,
} from "@/modules/offers/data";
import { buildOffersExportWorkbook } from "@/modules/offers/export";
import { requireUser } from "@/modules/auth/session";

/**
 * Exportación a Excel del listado (bloque 10). Ruta propia porque devuelve
 * un binario; reutiliza los mismos parámetros de la URL que `/offers`, así
 * que exportar "lo que se está viendo" es simplemente añadir `/export` a la
 * URL actual.
 */

/**
 * `Object.fromEntries(url.searchParams.entries())` perdería todos los valores
 * repetidos de una misma clave salvo el último; los estados multiseleccionados
 * (bloque 6.2) llegan como varios `statusId` repetidos, así que se agrupan
 * explícitamente en un array por clave.
 */
function toRawSearchParams(searchParams: URLSearchParams): RawSearchParams {
  const result: Record<string, string[]> = {};
  for (const [key, value] of searchParams.entries()) {
    (result[key] ??= []).push(value);
  }
  return result;
}

export async function GET(request: Request) {
  const user = await requireUser();
  const url = new URL(request.url);
  const filters = parseOfferListParams(toRawSearchParams(url.searchParams));

  if (isIncoherentDateRange(filters)) {
    return new Response("El rango de fechas no es válido: «Desde» es posterior a «Hasta».", {
      status: 400,
    });
  }

  const buffer = await buildOffersExportWorkbook(filters, user);

  const today = new Date().toISOString().slice(0, 10);
  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="ofertas-${today}.xlsx"`,
      "Cache-Control": "private, no-store",
    },
  });
}
