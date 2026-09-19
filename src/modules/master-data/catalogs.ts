import type { Prisma, PrismaClient } from "@prisma/client";

/**
 * Definición compartida de los ocho catálogos del Gestor de Ofertas.
 *
 * Los ocho tienen exactamente la misma forma (`code`, `name`, `sortOrder`,
 * `isActive`), así que comparten validación, acciones y componentes en lugar
 * de duplicar ocho implementaciones. No se construye un framework genérico:
 * es una tabla de correspondencias explícita y cerrada.
 */

export const CATALOG_KEYS = [
  "priorities",
  "origins",
  "offerTypes",
  "offerStatuses",
  "segmentations",
  "professionalProfiles",
  "languages",
  "cancellationReasons",
] as const;

export type CatalogKey = (typeof CATALOG_KEYS)[number];

export const CATALOG_LABELS: Record<CatalogKey, { plural: string; singular: string }> = {
  priorities: { plural: "Prioridades", singular: "la prioridad" },
  origins: { plural: "Orígenes", singular: "el origen" },
  offerTypes: { plural: "Tipos de oferta", singular: "el tipo de oferta" },
  offerStatuses: { plural: "Estados de oferta", singular: "el estado de oferta" },
  segmentations: { plural: "Segmentaciones", singular: "la segmentación" },
  professionalProfiles: {
    plural: "Perfiles profesionales",
    singular: "el perfil profesional",
  },
  languages: { plural: "Idiomas", singular: "el idioma" },
  cancellationReasons: {
    plural: "Motivos de cancelación",
    singular: "el motivo de cancelación",
  },
};

/** Nota específica que la pantalla muestra bajo algunos catálogos. */
export const CATALOG_NOTES: Partial<Record<CatalogKey, string>> = {
  offerStatuses:
    "El flujo y las transiciones entre estados siguen pendientes de decisión (DEC-051): cualquier estado puede seleccionarse en una oferta.",
  cancellationReasons:
    "Sin valores aprobados todavía: una instalación nueva empieza vacía. El motivo es obligatorio cuando una oferta pasa al estado «Anulado».",
  languages:
    "Sin valores aprobados todavía: una instalación nueva empieza vacía.",
  professionalProfiles:
    "Los códigos son los funcionales ya conocidos y no deben renombrarse.",
};

export function isCatalogKey(value: string): value is CatalogKey {
  return (CATALOG_KEYS as readonly string[]).includes(value);
}

const MODEL_BY_KEY = {
  priorities: "priority",
  origins: "origin",
  offerTypes: "offerType",
  offerStatuses: "offerStatus",
  segmentations: "segmentation",
  professionalProfiles: "professionalProfile",
  languages: "language",
  cancellationReasons: "cancellationReason",
} as const satisfies Record<CatalogKey, keyof PrismaClient>;

export type CatalogRecordData = {
  code: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
};

/**
 * Vista mínima y común de un delegado de Prisma para los ocho catálogos.
 * Solo se declaran las operaciones que la administración necesita; el borrado
 * físico no forma parte de esta interfaz a propósito (DEC-017).
 */
export type CatalogDelegate = {
  findUnique(args: {
    where: { id: string };
    select: { code: true; name: true; sortOrder: true; isActive: true };
  }): Promise<CatalogRecordData | null>;
  create(args: {
    data: { code: string; name: string; sortOrder: number };
    select: { id: true };
  }): Promise<{ id: string }>;
  update(args: {
    where: { id: string };
    data: { name?: string; sortOrder?: number; isActive?: boolean };
  }): Promise<unknown>;
};

/**
 * Devuelve el delegado del catálogo indicado.
 *
 * La conversión de tipo es deliberada y está acotada: los ocho modelos tienen
 * exactamente los mismos campos, pero TypeScript no puede unificar ocho
 * delegados distintos de Prisma en una sola llamada. `CatalogDelegate`
 * describe el contrato real y exacto que se usa, de modo que la conversión no
 * oculta ninguna diferencia de esquema.
 */
export function catalogDelegate(
  client: PrismaClient | Prisma.TransactionClient,
  key: CatalogKey,
): CatalogDelegate {
  return client[MODEL_BY_KEY[key]] as unknown as CatalogDelegate;
}
