import { PrismaClient } from "@prisma/client";
import { afterAll, describe, expect, it } from "vitest";
import { nextOfferCounter } from "@/modules/offers/numbering";

/**
 * Prueba de integración muy acotada de la atomicidad del contador.
 *
 * Demuestra que varias altas concurrentes obtienen valores distintos, que es
 * la condición que garantiza que dos ofertas nunca reciben el mismo número.
 *
 * Se ejecuta sobre un contador propio y sintético (`test_concurrency_counter`)
 * para no tocar nunca el contador real de ofertas, y se omite por completo si
 * no hay PostgreSQL disponible, de modo que `npm run test` siga siendo útil
 * sin base de datos.
 */

const TEST_COUNTER_KEY = "test_concurrency_counter";
const CONCURRENT_CALLS = 10;

const prisma = new PrismaClient();

const databaseAvailable = await prisma
  .$queryRaw`SELECT 1`
  .then(() => true)
  .catch(() => false);

afterAll(async () => {
  if (databaseAvailable) {
    await prisma.systemCounter.deleteMany({ where: { key: TEST_COUNTER_KEY } });
  }
  await prisma.$disconnect();
});

describe.skipIf(!databaseAvailable)("contador atómico de numeración", () => {
  it("nunca devuelve el mismo valor a dos transacciones concurrentes", async () => {
    await prisma.systemCounter.upsert({
      where: { key: TEST_COUNTER_KEY },
      create: { key: TEST_COUNTER_KEY, value: 0 },
      update: { value: 0 },
    });

    const values = await Promise.all(
      Array.from({ length: CONCURRENT_CALLS }, () =>
        prisma.$transaction((tx) => nextOfferCounter(tx, TEST_COUNTER_KEY)),
      ),
    );

    expect(new Set(values).size).toBe(CONCURRENT_CALLS);
    expect([...values].sort((left, right) => left - right)).toEqual(
      Array.from({ length: CONCURRENT_CALLS }, (_unused, index) => index + 1),
    );
  });

  it("revierte el incremento si la transacción falla", async () => {
    await prisma.systemCounter.upsert({
      where: { key: TEST_COUNTER_KEY },
      create: { key: TEST_COUNTER_KEY, value: 0 },
      update: { value: 0 },
    });

    await expect(
      prisma.$transaction(async (tx) => {
        await nextOfferCounter(tx, TEST_COUNTER_KEY);
        throw new Error("fallo simulado a mitad del alta");
      }),
    ).rejects.toThrow("fallo simulado a mitad del alta");

    const counter = await prisma.systemCounter.findUnique({
      where: { key: TEST_COUNTER_KEY },
      select: { value: true },
    });
    expect(counter?.value).toBe(0);
  });
});
