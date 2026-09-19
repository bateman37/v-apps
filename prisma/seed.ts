/**
 * Carga inicial idempotente de los maestros aprobados para el Gestor de
 * Ofertas. Los valores concretos viven en `prisma/seed-data.ts`; este
 * archivo solo aplica el `upsert` correspondiente a cada catálogo.
 *
 * Ejecutarlo varias veces no duplica registros: cada valor se identifica por
 * un `code` técnico estable y único, y se actualiza (`upsert`) en lugar de
 * insertarse de nuevo.
 */
import { PrismaClient } from "@prisma/client";
import { OFFER_NUMBER_COUNTER_KEY } from "../src/modules/offers/numbering";
import {
  CANCELLATION_REASONS,
  LANGUAGES,
  OFFER_STATUSES,
  OFFER_TYPES,
  ORIGINS,
  PRIORITIES,
  PROFESSIONAL_PROFILES,
  SEGMENTATIONS,
  type SeedValue,
} from "./seed-data";

const prisma = new PrismaClient();

async function upsertOrderedValues(
  label: string,
  values: SeedValue[],
  upsertFn: (args: {
    where: { code: string };
    create: { code: string; name: string; sortOrder: number };
    update: { name: string; sortOrder: number };
  }) => Promise<unknown>,
) {
  for (const [index, value] of values.entries()) {
    const sortOrder = index + 1;
    await upsertFn({
      where: { code: value.code },
      create: { code: value.code, name: value.name, sortOrder },
      update: { name: value.name, sortOrder },
    });
  }
  console.log(`  - ${label}: ${values.length} registro(s) verificados.`);
}

/**
 * Crea el contador técnico de numeración de ofertas con valor inicial 0
 * únicamente si todavía no existe.
 *
 * `update: {}` es deliberado: volver a ejecutar el seed nunca puede rebajar,
 * reiniciar ni sobrescribir un contador ya en uso. La inicialización con el
 * último contador del Excel legado, en el corte definitivo, sigue pendiente y
 * no se hace desde aquí (ver docs/offers/BUSINESS_RULES.md).
 */
async function ensureOfferNumberCounter() {
  const counter = await prisma.systemCounter.upsert({
    where: { key: OFFER_NUMBER_COUNTER_KEY },
    create: { key: OFFER_NUMBER_COUNTER_KEY, value: 0 },
    update: {},
    select: { value: true },
  });
  console.log(
    `  - Contador de numeración de ofertas: valor actual ${counter.value} (no se reinicia).`,
  );
}

async function main() {
  console.log("Cargando maestros de referencia (idempotente)...");

  await upsertOrderedValues("Prioridades", PRIORITIES, (args) =>
    prisma.priority.upsert(args),
  );
  await upsertOrderedValues("Orígenes", ORIGINS, (args) =>
    prisma.origin.upsert(args),
  );
  await upsertOrderedValues("Tipos de oferta", OFFER_TYPES, (args) =>
    prisma.offerType.upsert(args),
  );
  await upsertOrderedValues("Estados de oferta", OFFER_STATUSES, (args) =>
    prisma.offerStatus.upsert(args),
  );
  await upsertOrderedValues("Segmentaciones", SEGMENTATIONS, (args) =>
    prisma.segmentation.upsert(args),
  );
  await upsertOrderedValues(
    "Perfiles profesionales",
    PROFESSIONAL_PROFILES,
    (args) => prisma.professionalProfile.upsert(args),
  );
  await upsertOrderedValues("Idiomas", LANGUAGES, (args) =>
    prisma.language.upsert(args),
  );
  await upsertOrderedValues(
    "Motivos de cancelación",
    CANCELLATION_REASONS,
    (args) => prisma.cancellationReason.upsert(args),
  );

  await ensureOfferNumberCounter();

  console.log("Carga de maestros completada.");
}

main()
  .catch((error) => {
    console.error("Error al cargar los maestros:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
