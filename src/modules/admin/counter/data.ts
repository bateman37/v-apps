import { prisma } from "@/lib/db/prisma";
import { OFFER_NUMBER_COUNTER_KEY } from "@/modules/offers/numbering";

export type CounterStatus = {
  exists: boolean;
  value: number | null;
  /** Número de la última oferta creada, como referencia visual. */
  lastOfferNumber: string | null;
};

/**
 * Estado del contador técnico (bloque 11). El contador solo avanza con cada
 * alta, así que la última oferta creada por fecha es también la que agotó el
 * valor más alto: no hace falta ninguna expresión regular sobre `number`.
 */
export async function getCounterStatus(): Promise<CounterStatus> {
  const [counter, lastOffer] = await Promise.all([
    prisma.systemCounter.findUnique({ where: { key: OFFER_NUMBER_COUNTER_KEY } }),
    prisma.offer.findFirst({
      orderBy: { createdAt: "desc" },
      select: { number: true },
    }),
  ]);

  return {
    exists: counter !== null,
    value: counter?.value ?? null,
    lastOfferNumber: lastOffer?.number ?? null,
  };
}
