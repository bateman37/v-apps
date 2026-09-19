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
  SEED_NOTIFICATION_RULES,
  SEED_PEOPLE,
  SEGMENTATIONS,
  type SeedValue,
} from "./seed-data";
import { normalizeNameKey } from "../src/lib/text";

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

/**
 * Precarga idempotente de las personas operativas autorizadas (DEV-004).
 *
 * `Person` no tiene clave natural única en base de datos, así que la
 * identificación se hace por nombre normalizado (espacios colapsados,
 * minúsculas): es exactamente el criterio con el que Administración evita
 * duplicados visibles, y basta para que repetir el seed no cree una segunda
 * ficha de la misma persona.
 *
 * El seed **acumula** habilitaciones y nunca las retira: si alguien ha marcado
 * a mano a un comercial también como PM, esa marca sobrevive. Tampoco
 * desactiva ni modifica personas creadas por el usuario, ni asigna emails o
 * cuentas.
 */
async function upsertSeedPeople() {
  const existing = await prisma.person.findMany({
    select: {
      id: true,
      name: true,
      canBeCommercial: true,
      canBeProjectManager: true,
    },
  });

  const byNormalizedName = new Map(
    existing.map((person) => [normalizeNameKey(person.name), person] as const),
  );

  let created = 0;
  let updated = 0;

  for (const seedPerson of SEED_PEOPLE) {
    const key = normalizeNameKey(seedPerson.name);
    const current = byNormalizedName.get(key);

    if (!current) {
      await prisma.person.create({
        data: {
          name: seedPerson.name,
          canBeCommercial: seedPerson.canBeCommercial,
          canBeProjectManager: seedPerson.canBeProjectManager,
        },
      });
      created += 1;
      continue;
    }

    // Unión de habilitaciones: nunca se quita una que ya estuviera puesta.
    const canBeCommercial = current.canBeCommercial || seedPerson.canBeCommercial;
    const canBeProjectManager =
      current.canBeProjectManager || seedPerson.canBeProjectManager;

    if (
      canBeCommercial !== current.canBeCommercial ||
      canBeProjectManager !== current.canBeProjectManager
    ) {
      await prisma.person.update({
        where: { id: current.id },
        data: { canBeCommercial, canBeProjectManager },
      });
      updated += 1;
    }
  }

  console.log(
    `  - Personas autorizadas: ${SEED_PEOPLE.length} verificadas (${created} creadas, ${updated} actualizadas; ninguna duplicada ni desactivada).`,
  );
}

/**
 * Reglas de notificación iniciales.
 *
 * Solo se crean las que faltan, identificadas por su `key` estable. Una regla
 * que Administración haya renombrado, desactivado o ajustado **no** se
 * sobrescribe: el seed no revierte decisiones del usuario.
 */
async function ensureInitialNotificationRules() {
  let created = 0;

  for (const rule of SEED_NOTIFICATION_RULES) {
    const existing = await prisma.notificationRule.findUnique({
      where: { key: rule.key },
      select: { id: true },
    });

    if (existing) {
      continue;
    }

    await prisma.notificationRule.create({
      data: {
        key: rule.key,
        name: rule.name,
        description: rule.description,
        trigger: rule.trigger,
        channel: "INTERNAL",
        sortOrder: rule.sortOrder,
        isActive: true,
        actions: {
          create: rule.recipients.map((kind) => ({ kind })),
        },
      },
    });
    created += 1;
  }

  console.log(
    `  - Reglas de notificación iniciales: ${SEED_NOTIFICATION_RULES.length} verificadas (${created} creadas).`,
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

  await upsertSeedPeople();
  await ensureInitialNotificationRules();
  await ensureOfferNumberCounter();

  console.log("Carga de maestros completada.");
  console.log(
    "Siguiente paso: crea el administrador inicial con `npm run auth:bootstrap-admin`.",
  );
}

main()
  .catch((error) => {
    console.error("Error al cargar los maestros:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
