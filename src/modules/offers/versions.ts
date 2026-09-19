import type { Prisma } from "@prisma/client";

/**
 * Versiones funcionales inmutables de una oferta (bloque 4.2 de DEV-004).
 *
 * La auditoría técnica dice *qué campo cambió*; una versión conserva la
 * *fotografía completa* de la oferta en un instante. La instantánea guarda,
 * para cada maestro, el identificador **y** su código y nombre visibles: así
 * una versión antigua sigue leyéndose igual aunque después se renombre un
 * catálogo.
 *
 * Reglas implementadas:
 *
 * - `v1` se crea en el alta de la oferta.
 * - Cada guardado posterior que cambie un campo funcional o una jornada crea
 *   exactamente una versión consecutiva; un guardado sin cambios no crea
 *   ninguna.
 * - La versión se escribe en la **misma transacción** que el dato.
 * - El número se calcula dentro de la transacción y la restricción única
 *   `(offer_id, version)` impide que dos guardados simultáneos produzcan el
 *   mismo número: uno de los dos falla y se reintenta.
 * - Una versión nunca se edita ni se elimina.
 */

/** Referencia a un registro de maestro dentro de una instantánea. */
export type SnapshotRef = {
  id: string;
  code: string | null;
  name: string;
} | null;

/** Jornada por perfil dentro de una instantánea. */
export type SnapshotProfileDays = {
  professionalProfileId: string;
  code: string;
  name: string;
  days: string;
};

/** Instantánea completa e inmutable de los campos funcionales de una oferta. */
export type OfferSnapshot = {
  /** Versión del formato de instantánea, para poder evolucionarlo sin romper. */
  schema: 1;
  number: string;
  client: SnapshotRef;
  priority: SnapshotRef;
  origin: SnapshotRef;
  commercial: SnapshotRef;
  projectManager: SnapshotRef;
  offerType: SnapshotRef;
  status: SnapshotRef;
  segmentation: SnapshotRef;
  cancellationReason: SnapshotRef;
  offerDate: string;
  description: string;
  requesterName: string;
  totalAmount: string;
  implantationText: string | null;
  estimatedCommercialDeliveryDate: string | null;
  estimatedClientDeliveryDate: string | null;
  estimatedPortfolioDate: string | null;
  commercialDays: string | null;
  notes: string | null;
  navisionOrder: string | null;
  profileDays: SnapshotProfileDays[];
};

/** Consulta mínima necesaria para construir una instantánea. */
export const OFFER_SNAPSHOT_SELECT = {
  number: true,
  offerDate: true,
  description: true,
  requesterName: true,
  totalAmount: true,
  implantationText: true,
  estimatedCommercialDeliveryDate: true,
  estimatedClientDeliveryDate: true,
  estimatedPortfolioDate: true,
  commercialDays: true,
  notes: true,
  navisionOrder: true,
  client: { select: { id: true, code: true, name: true } },
  priority: { select: { id: true, code: true, name: true } },
  origin: { select: { id: true, code: true, name: true } },
  commercial: { select: { id: true, name: true } },
  projectManager: { select: { id: true, name: true } },
  offerType: { select: { id: true, code: true, name: true } },
  status: { select: { id: true, code: true, name: true } },
  segmentation: { select: { id: true, code: true, name: true } },
  cancellationReason: { select: { id: true, code: true, name: true } },
  profileDays: {
    select: {
      professionalProfileId: true,
      days: true,
      professionalProfile: { select: { code: true, name: true, sortOrder: true } },
    },
  },
} as const;

type SnapshotSource = Prisma.OfferGetPayload<{
  select: typeof OFFER_SNAPSHOT_SELECT;
}>;

function toIsoDate(value: Date | null): string | null {
  return value === null ? null : value.toISOString().slice(0, 10);
}

function ref(
  record: { id: string; code?: string | null; name: string } | null,
): SnapshotRef {
  if (!record) {
    return null;
  }
  return { id: record.id, code: record.code ?? null, name: record.name };
}

/** Construye la instantánea a partir de la oferta ya persistida. */
export function buildOfferSnapshot(offer: SnapshotSource): OfferSnapshot {
  return {
    schema: 1,
    number: offer.number,
    client: ref(offer.client),
    priority: ref(offer.priority),
    origin: ref(offer.origin),
    commercial: ref(offer.commercial),
    projectManager: ref(offer.projectManager),
    offerType: ref(offer.offerType),
    status: ref(offer.status),
    segmentation: ref(offer.segmentation),
    cancellationReason: ref(offer.cancellationReason),
    offerDate: offer.offerDate.toISOString().slice(0, 10),
    description: offer.description,
    requesterName: offer.requesterName,
    totalAmount: offer.totalAmount.toFixed(2),
    implantationText: offer.implantationText,
    estimatedCommercialDeliveryDate: toIsoDate(
      offer.estimatedCommercialDeliveryDate,
    ),
    estimatedClientDeliveryDate: toIsoDate(offer.estimatedClientDeliveryDate),
    estimatedPortfolioDate: toIsoDate(offer.estimatedPortfolioDate),
    commercialDays: offer.commercialDays?.toFixed(2) ?? null,
    notes: offer.notes,
    navisionOrder: offer.navisionOrder,
    profileDays: offer.profileDays
      .slice()
      .sort(
        (left, right) =>
          left.professionalProfile.sortOrder - right.professionalProfile.sortOrder,
      )
      .map((entry) => ({
        professionalProfileId: entry.professionalProfileId,
        code: entry.professionalProfile.code,
        name: entry.professionalProfile.name,
        days: entry.days.toFixed(2),
      })),
  };
}

/**
 * Valida una instantánea leída de la base de datos.
 *
 * El JSON de PostgreSQL llega tipado como `unknown`; en lugar de un `as any`
 * se comprueban las claves imprescindibles y, si el registro es de un formato
 * que este código no entiende, se devuelve `null` y la interfaz lo dice en
 * lugar de romperse.
 */
export function parseOfferSnapshot(value: unknown): OfferSnapshot | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  const candidate = value as Partial<OfferSnapshot>;
  if (candidate.schema !== 1) {
    return null;
  }
  if (typeof candidate.number !== "string") {
    return null;
  }
  if (!Array.isArray(candidate.profileDays)) {
    return null;
  }
  return candidate as OfferSnapshot;
}

/** Etiquetas en español de cada campo funcional de la instantánea. */
export const SNAPSHOT_FIELD_LABELS: Record<string, string> = {
  client: "Cliente",
  priority: "Prioridad",
  origin: "Origen",
  commercial: "Comercial",
  projectManager: "Project Manager",
  offerType: "Tipo de oferta",
  status: "Estado",
  segmentation: "Segmentación",
  cancellationReason: "Motivo de cancelación",
  offerDate: "Fecha de la oferta",
  description: "Descripción",
  requesterName: "Solicitante",
  totalAmount: "Importe total",
  implantationText: "Implantación",
  estimatedCommercialDeliveryDate: "Fecha estimada de entrega comercial",
  estimatedClientDeliveryDate: "Fecha estimada de entrega al cliente",
  estimatedPortfolioDate: "Fecha estimada de cartera",
  commercialDays: "Jornadas comerciales",
  notes: "Observaciones",
  navisionOrder: "Pedido de Navision",
};

/** Orden de presentación de los campos en la comparación de versiones. */
const COMPARABLE_FIELDS = Object.keys(SNAPSHOT_FIELD_LABELS) as Array<
  keyof OfferSnapshot
>;

function presentValue(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }
  if (typeof value === "object" && "name" in (value as SnapshotRef as object)) {
    return String((value as NonNullable<SnapshotRef>).name);
  }
  return String(value);
}

export type SnapshotDifference = {
  field: string;
  label: string;
  before: string;
  after: string;
};

/**
 * Compara dos instantáneas y devuelve **solo** los campos y las jornadas que
 * cambiaron. Es la base de la comparación de versiones de la interfaz.
 */
export function diffSnapshots(
  before: OfferSnapshot,
  after: OfferSnapshot,
): SnapshotDifference[] {
  const differences: SnapshotDifference[] = [];

  for (const field of COMPARABLE_FIELDS) {
    const previous = before[field];
    const next = after[field];
    const previousText = presentValue(previous);
    const nextText = presentValue(next);
    if (previousText !== nextText) {
      differences.push({
        field: String(field),
        label: SNAPSHOT_FIELD_LABELS[String(field)] ?? String(field),
        before: previousText,
        after: nextText,
      });
    }
  }

  const profileIds = new Set([
    ...before.profileDays.map((entry) => entry.professionalProfileId),
    ...after.profileDays.map((entry) => entry.professionalProfileId),
  ]);

  for (const profileId of profileIds) {
    const previousEntry = before.profileDays.find(
      (entry) => entry.professionalProfileId === profileId,
    );
    const nextEntry = after.profileDays.find(
      (entry) => entry.professionalProfileId === profileId,
    );
    const previousDays = previousEntry?.days ?? null;
    const nextDays = nextEntry?.days ?? null;
    if (previousDays !== nextDays) {
      const name = nextEntry?.name ?? previousEntry?.name ?? profileId;
      differences.push({
        field: `profileDays.${profileId}`,
        label: `Jornadas · ${name}`,
        before: previousDays ?? "—",
        after: nextDays ?? "—",
      });
    }
  }

  return differences;
}

/** Indica si dos instantáneas representan exactamente los mismos datos. */
export function snapshotsAreEqual(
  before: OfferSnapshot,
  after: OfferSnapshot,
): boolean {
  return diffSnapshots(before, after).length === 0;
}

/**
 * Crea la siguiente versión de una oferta dentro de la transacción en curso.
 *
 * Si `previousSnapshot` se indica y la nueva instantánea es idéntica, no se
 * crea nada: un guardado sin cambios no genera una versión vacía. Devuelve el
 * número de versión creado, o `null` si no había nada que versionar.
 */
export async function createOfferVersion(
  tx: Prisma.TransactionClient,
  options: {
    offerId: string;
    authorId: string | null;
    snapshot: OfferSnapshot;
    previousSnapshot?: OfferSnapshot | null;
  },
): Promise<number | null> {
  if (
    options.previousSnapshot &&
    snapshotsAreEqual(options.previousSnapshot, options.snapshot)
  ) {
    return null;
  }

  const last = await tx.offerVersion.findFirst({
    where: { offerId: options.offerId },
    orderBy: { version: "desc" },
    select: { version: true },
  });

  const version = (last?.version ?? 0) + 1;

  await tx.offerVersion.create({
    data: {
      offerId: options.offerId,
      version,
      authorId: options.authorId,
      snapshot: options.snapshot as unknown as Prisma.InputJsonValue,
    },
  });

  return version;
}

/** Lee la instantánea de la última versión de una oferta, si existe. */
export async function readLatestSnapshot(
  tx: Prisma.TransactionClient,
  offerId: string,
): Promise<OfferSnapshot | null> {
  const latest = await tx.offerVersion.findFirst({
    where: { offerId },
    orderBy: { version: "desc" },
    select: { snapshot: true },
  });
  return latest ? parseOfferSnapshot(latest.snapshot) : null;
}
