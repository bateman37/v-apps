import type { Prisma } from "@prisma/client";

/**
 * Numeración global de ofertas (DEC-010, DEC-011).
 *
 * Formato: `VI` + `AAAA` + `MM` + `-` + contador global.
 * Ejemplo sintético: `VI202609-00001`.
 *
 * Reglas implementadas:
 *
 * - El contador es global: no se reinicia nunca por mes ni por año.
 * - El año y el mes proceden del momento real de creación, no de la fecha de
 *   oferta introducida por el usuario.
 * - Se rellena a un mínimo de cinco dígitos y crece a seis o más sin truncar.
 * - El valor se consume únicamente dentro de la transacción del primer
 *   guardado: abrir o cancelar el formulario no gasta ningún número.
 * - Una modificación nunca vuelve a llamar a este módulo.
 * - Un número asignado no se reutiliza aunque la oferta se anule o se elimine
 *   lógicamente, porque el contador solo avanza.
 */

/** Clave del contador técnico de numeración de ofertas. */
export const OFFER_NUMBER_COUNTER_KEY = "offer_number";

/** Dígitos mínimos del contador dentro del número de oferta. */
export const OFFER_NUMBER_MIN_DIGITS = 5;

/** Compone el número de oferta a partir del instante de creación y el contador. */
export function formatOfferNumber(createdAt: Date, counter: number): string {
  const year = String(createdAt.getFullYear()).padStart(4, "0");
  const month = String(createdAt.getMonth() + 1).padStart(2, "0");
  const sequence = String(counter).padStart(OFFER_NUMBER_MIN_DIGITS, "0");
  return `VI${year}${month}-${sequence}`;
}

/**
 * Incrementa y devuelve el contador global de forma atómica.
 *
 * El `UPDATE ... RETURNING` bloquea la fila en PostgreSQL durante la
 * transacción, de modo que dos altas simultáneas se serializan y obtienen
 * valores distintos. No se lee y después se escribe: sería una condición de
 * carrera. Si la transacción revierte, el contador revierte con ella y no
 * queda ninguna oferta parcial.
 */
export async function nextOfferCounter(
  tx: Prisma.TransactionClient,
  key: string = OFFER_NUMBER_COUNTER_KEY,
): Promise<number> {
  const rows = await tx.$queryRaw<Array<{ value: number }>>`
    UPDATE "system_counters"
       SET "value" = "value" + 1,
           "updated_at" = NOW()
     WHERE "key" = ${key}
 RETURNING "value"
  `;

  const row = rows[0];
  if (!row) {
    throw new Error(
      `El contador "${key}" no existe. Ejecuta la carga inicial (npm run db:seed).`,
    );
  }

  return row.value;
}

/** Consume el contador y devuelve el número de oferta ya formateado. */
export async function assignOfferNumber(
  tx: Prisma.TransactionClient,
  createdAt: Date,
): Promise<string> {
  const counter = await nextOfferCounter(tx);
  return formatOfferNumber(createdAt, counter);
}
