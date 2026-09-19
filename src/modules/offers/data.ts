import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { toDateInputValue } from "@/lib/format";
import {
  CANCELLED_STATUS_CODE,
  totalProfileDays,
} from "@/modules/offers/validation";

/**
 * Lecturas del Gestor de Ofertas.
 *
 * Todo lo que cruza la frontera servidor → cliente se serializa de forma
 * explícita: las fechas como `YYYY-MM-DD` y los decimales como cadena. Las
 * consultas seleccionan únicamente los campos que la pantalla necesita.
 */

export type SelectOption = {
  id: string;
  label: string;
  isActive: boolean;
};

export type ProfileOption = {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
};

export type OfferFormOptions = {
  clients: SelectOption[];
  priorities: SelectOption[];
  origins: SelectOption[];
  offerTypes: SelectOption[];
  statuses: SelectOption[];
  segmentations: SelectOption[];
  languages: SelectOption[];
  cancellationReasons: SelectOption[];
  commercials: SelectOption[];
  projectManagers: SelectOption[];
  professionalProfiles: ProfileOption[];
  /** Estados con código `CANCELLED`: obligan a informar el motivo. */
  cancelledStatusIds: string[];
  /** Si no hay ninguno activo, la interfaz avisa en lugar de inventar uno. */
  hasActiveCancellationReasons: boolean;
};

/**
 * Identificadores que deben seguir siendo seleccionables aunque su maestro
 * esté desactivado, porque la oferta que se está editando ya los usa.
 */
export type ReferencedIds = {
  clientId?: string | null;
  priorityId?: string | null;
  originId?: string | null;
  offerTypeId?: string | null;
  statusId?: string | null;
  segmentationId?: string | null;
  languageId?: string | null;
  cancellationReasonId?: string | null;
  commercialId?: string | null;
  projectManagerId?: string | null;
  professionalProfileIds?: string[];
};

const CATALOG_SELECT = {
  id: true,
  name: true,
  isActive: true,
} as const;

const CATALOG_ORDER = [
  { sortOrder: "asc" as const },
  { name: "asc" as const },
];

/** Filtro “activo o ya referenciado por esta oferta”. */
function activeOrReferenced(referenced: Array<string | null | undefined>) {
  const ids = referenced.filter((value): value is string => Boolean(value));
  if (ids.length === 0) {
    return { isActive: true };
  }
  return { OR: [{ isActive: true }, { id: { in: ids } }] };
}

function toOptions(
  records: Array<{ id: string; name: string; isActive: boolean }>,
): SelectOption[] {
  return records.map((record) => ({
    id: record.id,
    label: record.isActive ? record.name : `${record.name} (inactivo)`,
    isActive: record.isActive,
  }));
}

/**
 * Opciones del formulario de oferta.
 *
 * Los maestros inactivos no se ofrecen para una oferta nueva, pero sí se
 * conservan cuando la oferta que se edita ya los referencia: desactivar un
 * maestro nunca puede impedir guardar una oferta histórica.
 */
export async function getOfferFormOptions(
  referenced: ReferencedIds = {},
): Promise<OfferFormOptions> {
  const [
    clients,
    priorities,
    origins,
    offerTypes,
    statuses,
    segmentations,
    languages,
    cancellationReasons,
    commercials,
    projectManagers,
    professionalProfiles,
    activeCancellationReasonCount,
  ] = await Promise.all([
    prisma.client.findMany({
      where: activeOrReferenced([referenced.clientId]),
      select: CATALOG_SELECT,
      orderBy: { name: "asc" },
    }),
    prisma.priority.findMany({
      where: activeOrReferenced([referenced.priorityId]),
      select: CATALOG_SELECT,
      orderBy: CATALOG_ORDER,
    }),
    prisma.origin.findMany({
      where: activeOrReferenced([referenced.originId]),
      select: CATALOG_SELECT,
      orderBy: CATALOG_ORDER,
    }),
    prisma.offerType.findMany({
      where: activeOrReferenced([referenced.offerTypeId]),
      select: CATALOG_SELECT,
      orderBy: CATALOG_ORDER,
    }),
    prisma.offerStatus.findMany({
      where: activeOrReferenced([referenced.statusId]),
      select: { ...CATALOG_SELECT, code: true },
      orderBy: CATALOG_ORDER,
    }),
    prisma.segmentation.findMany({
      where: activeOrReferenced([referenced.segmentationId]),
      select: CATALOG_SELECT,
      orderBy: CATALOG_ORDER,
    }),
    prisma.language.findMany({
      where: activeOrReferenced([referenced.languageId]),
      select: CATALOG_SELECT,
      orderBy: CATALOG_ORDER,
    }),
    prisma.cancellationReason.findMany({
      where: activeOrReferenced([referenced.cancellationReasonId]),
      select: CATALOG_SELECT,
      orderBy: CATALOG_ORDER,
    }),
    prisma.person.findMany({
      where: {
        canBeCommercial: true,
        ...activeOrReferenced([referenced.commercialId]),
      },
      select: CATALOG_SELECT,
      orderBy: { name: "asc" },
    }),
    prisma.person.findMany({
      where: {
        canBeProjectManager: true,
        ...activeOrReferenced([referenced.projectManagerId]),
      },
      select: CATALOG_SELECT,
      orderBy: { name: "asc" },
    }),
    prisma.professionalProfile.findMany({
      where: activeOrReferenced(referenced.professionalProfileIds ?? []),
      select: { id: true, code: true, name: true, isActive: true },
      orderBy: CATALOG_ORDER,
    }),
    prisma.cancellationReason.count({ where: { isActive: true } }),
  ]);

  return {
    clients: toOptions(clients),
    priorities: toOptions(priorities),
    origins: toOptions(origins),
    offerTypes: toOptions(offerTypes),
    statuses: toOptions(statuses),
    segmentations: toOptions(segmentations),
    languages: toOptions(languages),
    cancellationReasons: toOptions(cancellationReasons),
    commercials: toOptions(commercials),
    projectManagers: toOptions(projectManagers),
    professionalProfiles,
    cancelledStatusIds: statuses
      .filter((status) => status.code === CANCELLED_STATUS_CODE)
      .map((status) => status.id),
    hasActiveCancellationReasons: activeCancellationReasonCount > 0,
  };
}

export type OfferProfileDaysDetail = {
  professionalProfileId: string;
  profileCode: string;
  profileName: string;
  days: string;
};

export type OfferStatusHistoryEntry = {
  id: string;
  previousStatusName: string | null;
  newStatusName: string;
  changedAt: string;
};

export type OfferDetail = {
  id: string;
  number: string;
  clientId: string;
  clientName: string;
  priorityId: string;
  priorityName: string;
  commercialId: string;
  commercialName: string;
  projectManagerId: string;
  projectManagerName: string;
  originId: string;
  originName: string;
  offerTypeId: string;
  offerTypeName: string;
  statusId: string;
  statusName: string;
  statusCode: string;
  segmentationId: string | null;
  segmentationName: string | null;
  languageId: string | null;
  languageName: string | null;
  cancellationReasonId: string | null;
  cancellationReasonName: string | null;
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
  createdAt: string;
  updatedAt: string;
  profileDays: OfferProfileDaysDetail[];
  totalProfileDays: string;
  statusHistory: OfferStatusHistoryEntry[];
};

/** Detalle completo de una oferta, o `null` si no existe o está eliminada. */
export async function getOfferDetail(id: string): Promise<OfferDetail | null> {
  const offer = await prisma.offer.findFirst({
    where: { id, deletedAt: null },
    select: {
      id: true,
      number: true,
      clientId: true,
      priorityId: true,
      commercialId: true,
      projectManagerId: true,
      originId: true,
      offerTypeId: true,
      statusId: true,
      segmentationId: true,
      languageId: true,
      cancellationReasonId: true,
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
      createdAt: true,
      updatedAt: true,
      client: { select: { name: true } },
      priority: { select: { name: true } },
      commercial: { select: { name: true } },
      projectManager: { select: { name: true } },
      origin: { select: { name: true } },
      offerType: { select: { name: true } },
      status: { select: { name: true, code: true } },
      segmentation: { select: { name: true } },
      language: { select: { name: true } },
      cancellationReason: { select: { name: true } },
      profileDays: {
        select: {
          professionalProfileId: true,
          days: true,
          professionalProfile: { select: { code: true, name: true, sortOrder: true } },
        },
      },
      statusHistory: {
        select: {
          id: true,
          changedAt: true,
          previousStatus: { select: { name: true } },
          newStatus: { select: { name: true } },
        },
        orderBy: { changedAt: "desc" },
      },
    },
  });

  if (!offer) {
    return null;
  }

  const profileDays: OfferProfileDaysDetail[] = offer.profileDays
    .map((entry) => ({
      professionalProfileId: entry.professionalProfileId,
      profileCode: entry.professionalProfile.code,
      profileName: entry.professionalProfile.name,
      sortOrder: entry.professionalProfile.sortOrder,
      days: entry.days.toFixed(2),
    }))
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map(({ professionalProfileId, profileCode, profileName, days }) => ({
      professionalProfileId,
      profileCode,
      profileName,
      days,
    }));

  return {
    id: offer.id,
    number: offer.number,
    clientId: offer.clientId,
    clientName: offer.client.name,
    priorityId: offer.priorityId,
    priorityName: offer.priority.name,
    commercialId: offer.commercialId,
    commercialName: offer.commercial.name,
    projectManagerId: offer.projectManagerId,
    projectManagerName: offer.projectManager.name,
    originId: offer.originId,
    originName: offer.origin.name,
    offerTypeId: offer.offerTypeId,
    offerTypeName: offer.offerType.name,
    statusId: offer.statusId,
    statusName: offer.status.name,
    statusCode: offer.status.code,
    segmentationId: offer.segmentationId,
    segmentationName: offer.segmentation?.name ?? null,
    languageId: offer.languageId,
    languageName: offer.language?.name ?? null,
    cancellationReasonId: offer.cancellationReasonId,
    cancellationReasonName: offer.cancellationReason?.name ?? null,
    offerDate: toDateInputValue(offer.offerDate),
    description: offer.description,
    requesterName: offer.requesterName,
    totalAmount: offer.totalAmount.toFixed(2),
    implantationText: offer.implantationText,
    estimatedCommercialDeliveryDate:
      toDateInputValue(offer.estimatedCommercialDeliveryDate) || null,
    estimatedClientDeliveryDate:
      toDateInputValue(offer.estimatedClientDeliveryDate) || null,
    estimatedPortfolioDate: toDateInputValue(offer.estimatedPortfolioDate) || null,
    commercialDays: offer.commercialDays ? offer.commercialDays.toFixed(2) : null,
    notes: offer.notes,
    navisionOrder: offer.navisionOrder,
    createdAt: offer.createdAt.toISOString(),
    updatedAt: offer.updatedAt.toISOString(),
    profileDays,
    totalProfileDays: totalProfileDays(profileDays),
    statusHistory: offer.statusHistory.map((entry) => ({
      id: entry.id,
      previousStatusName: entry.previousStatus?.name ?? null,
      newStatusName: entry.newStatus.name,
      changedAt: entry.changedAt.toISOString(),
    })),
  };
}

// ---------------------------------------------------------------------------
// Listado: búsqueda, filtros, ordenación y paginación
// ---------------------------------------------------------------------------

/** Tamaño de página del listado de ofertas. */
export const OFFERS_PAGE_SIZE = 25;

export const OFFER_SORT_FIELDS = [
  "number",
  "date",
  "client",
  "status",
  "amount",
] as const;

export type OfferSortField = (typeof OFFER_SORT_FIELDS)[number];
export type SortDirection = "asc" | "desc";

export type OfferListFilters = {
  q: string;
  year: number | null;
  month: number | null;
  clientId: string;
  commercialId: string;
  projectManagerId: string;
  statusId: string;
  offerTypeId: string;
  originId: string;
  sort: OfferSortField;
  dir: SortDirection;
  page: number;
};

export type RawSearchParams = Record<string, string | string[] | undefined>;

function readParam(params: RawSearchParams, key: string): string {
  const value = params[key];
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return typeof value === "string" ? value.trim() : "";
}

function readIntParam(
  params: RawSearchParams,
  key: string,
  min: number,
  max: number,
): number | null {
  const raw = readParam(params, key);
  if (raw === "") {
    return null;
  }
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    return null;
  }
  return parsed;
}

/**
 * Interpreta los parámetros de URL del listado. Cualquier valor inválido se
 * descarta en silencio y se sustituye por el valor por defecto: la pantalla
 * nunca se rompe por un parámetro manipulado a mano.
 */
export function parseOfferListParams(params: RawSearchParams): OfferListFilters {
  const sortRaw = readParam(params, "sort");
  const dirRaw = readParam(params, "dir");
  const page = readIntParam(params, "page", 1, 100_000) ?? 1;

  return {
    q: readParam(params, "q").slice(0, 200),
    year: readIntParam(params, "year", 1900, 2999),
    month: readIntParam(params, "month", 1, 12),
    clientId: readParam(params, "clientId"),
    commercialId: readParam(params, "commercialId"),
    projectManagerId: readParam(params, "projectManagerId"),
    statusId: readParam(params, "statusId"),
    offerTypeId: readParam(params, "offerTypeId"),
    originId: readParam(params, "originId"),
    sort: (OFFER_SORT_FIELDS as readonly string[]).includes(sortRaw)
      ? (sortRaw as OfferSortField)
      : "number",
    dir: dirRaw === "asc" ? "asc" : "desc",
    page,
  };
}

/** Indica si hay algún filtro o búsqueda activo (para el botón de limpiar). */
export function hasActiveOfferFilters(filters: OfferListFilters): boolean {
  return Boolean(
    filters.q ||
      filters.year !== null ||
      filters.month !== null ||
      filters.clientId ||
      filters.commercialId ||
      filters.projectManagerId ||
      filters.statusId ||
      filters.offerTypeId ||
      filters.originId,
  );
}

/** Rango `[desde, hasta)` en UTC para un filtro de año y/o mes. */
function dateRangeFilter(
  year: number | null,
  month: number | null,
): Prisma.DateTimeFilter | undefined {
  if (year === null && month === null) {
    return undefined;
  }

  if (year !== null && month !== null) {
    const from = new Date(Date.UTC(year, month - 1, 1));
    const to = new Date(Date.UTC(month === 12 ? year + 1 : year, month % 12, 1));
    return { gte: from, lt: to };
  }

  if (year !== null) {
    return {
      gte: new Date(Date.UTC(year, 0, 1)),
      lt: new Date(Date.UTC(year + 1, 0, 1)),
    };
  }

  return undefined;
}

/**
 * Construye la condición de la consulta.
 *
 * `availableYears` solo se usa cuando se filtra por mes sin indicar año: en
 * ese caso la condición se expresa como la unión de los rangos de ese mes en
 * cada año con ofertas. Se resuelve así, y no con una función SQL sobre la
 * columna, para que PostgreSQL pueda seguir usando el índice de `offer_date`.
 */
function buildOfferWhere(
  filters: OfferListFilters,
  availableYears: readonly number[],
): Prisma.OfferWhereInput {
  const conditions: Prisma.OfferWhereInput[] = [];

  if (filters.q) {
    conditions.push({
      OR: [
        { number: { contains: filters.q, mode: "insensitive" } },
        { description: { contains: filters.q, mode: "insensitive" } },
        { requesterName: { contains: filters.q, mode: "insensitive" } },
        { client: { name: { contains: filters.q, mode: "insensitive" } } },
      ],
    });
  }

  if (filters.year !== null) {
    const offerDate = dateRangeFilter(filters.year, filters.month);
    if (offerDate) {
      conditions.push({ offerDate });
    }
  } else if (filters.month !== null) {
    const monthRanges = availableYears
      .map((year) => dateRangeFilter(year, filters.month))
      .filter((range): range is Prisma.DateTimeFilter => range !== undefined)
      .map((offerDate) => ({ offerDate }));
    // Sin años con datos, ninguna oferta puede cumplir el filtro.
    conditions.push(
      monthRanges.length > 0 ? { OR: monthRanges } : { id: { in: [] } },
    );
  }

  const where: Prisma.OfferWhereInput = {
    // Exclusión por defecto de la eliminación lógica (DEC-016).
    deletedAt: null,
  };

  if (conditions.length > 0) {
    where.AND = conditions;
  }

  if (filters.clientId) {
    where.clientId = filters.clientId;
  }
  if (filters.commercialId) {
    where.commercialId = filters.commercialId;
  }
  if (filters.projectManagerId) {
    where.projectManagerId = filters.projectManagerId;
  }
  if (filters.statusId) {
    where.statusId = filters.statusId;
  }
  if (filters.offerTypeId) {
    where.offerTypeId = filters.offerTypeId;
  }
  if (filters.originId) {
    where.originId = filters.originId;
  }

  return where;
}

function buildOfferOrderBy(
  filters: OfferListFilters,
): Prisma.OfferOrderByWithRelationInput[] {
  const dir = filters.dir;
  switch (filters.sort) {
    case "date":
      return [{ offerDate: dir }, { number: "desc" }];
    case "client":
      return [{ client: { name: dir } }, { number: "desc" }];
    case "status":
      return [{ status: { sortOrder: dir } }, { number: "desc" }];
    case "amount":
      return [{ totalAmount: dir }, { number: "desc" }];
    case "number":
    default:
      return [{ number: dir }];
  }
}

export type OfferListRow = {
  id: string;
  number: string;
  offerDate: string;
  clientName: string;
  description: string;
  commercialName: string;
  projectManagerName: string;
  statusName: string;
  totalAmount: string;
  totalProfileDays: string;
};

export type OfferListResult = {
  rows: OfferListRow[];
  total: number;
  page: number;
  pageCount: number;
  /** Sumas sobre el conjunto filtrado completo, no solo sobre la página. */
  filteredTotalAmount: string;
  filteredTotalProfileDays: string;
};

export async function getOffersPage(
  filters: OfferListFilters,
): Promise<OfferListResult> {
  // Solo hace falta conocer los años con datos cuando se filtra por mes sin
  // año; en el resto de casos no se lanza esta consulta.
  const availableYears =
    filters.month !== null && filters.year === null ? await getOfferYears() : [];
  const where = buildOfferWhere(filters, availableYears);

  const [total, amountAggregate, daysAggregate] = await Promise.all([
    prisma.offer.count({ where }),
    prisma.offer.aggregate({ where, _sum: { totalAmount: true } }),
    prisma.offerProfileDays.aggregate({
      where: { offer: where },
      _sum: { days: true },
    }),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / OFFERS_PAGE_SIZE));
  const page = Math.min(Math.max(filters.page, 1), pageCount);

  const offers = await prisma.offer.findMany({
    where,
    orderBy: buildOfferOrderBy(filters),
    skip: (page - 1) * OFFERS_PAGE_SIZE,
    take: OFFERS_PAGE_SIZE,
    select: {
      id: true,
      number: true,
      offerDate: true,
      description: true,
      totalAmount: true,
      client: { select: { name: true } },
      commercial: { select: { name: true } },
      projectManager: { select: { name: true } },
      status: { select: { name: true } },
      profileDays: { select: { days: true } },
    },
  });

  return {
    rows: offers.map((offer) => ({
      id: offer.id,
      number: offer.number,
      offerDate: toDateInputValue(offer.offerDate),
      clientName: offer.client.name,
      description: offer.description,
      commercialName: offer.commercial.name,
      projectManagerName: offer.projectManager.name,
      statusName: offer.status.name,
      totalAmount: offer.totalAmount.toFixed(2),
      totalProfileDays: totalProfileDays(
        offer.profileDays.map((entry) => ({ days: entry.days.toFixed(2) })),
      ),
    })),
    total,
    page,
    pageCount,
    filteredTotalAmount: (amountAggregate._sum.totalAmount ?? 0).toString(),
    filteredTotalProfileDays: (daysAggregate._sum.days ?? 0).toString(),
  };
}

/** Años distintos con ofertas no eliminadas, de más reciente a más antiguo. */
async function getOfferYears(): Promise<number[]> {
  const rows = await prisma.$queryRaw<Array<{ year: number }>>`
    SELECT DISTINCT EXTRACT(YEAR FROM "offer_date")::int AS year
      FROM "offers"
     WHERE "deleted_at" IS NULL
     ORDER BY year DESC
  `;
  return rows.map((row) => row.year);
}

export type OfferFilterOptions = {
  clients: SelectOption[];
  commercials: SelectOption[];
  projectManagers: SelectOption[];
  statuses: SelectOption[];
  offerTypes: SelectOption[];
  origins: SelectOption[];
  years: number[];
};

/**
 * Opciones de los desplegables de filtro. A diferencia del formulario, aquí
 * sí se incluyen los registros inactivos: son necesarios para poder filtrar
 * ofertas históricas que los referencian.
 */
export async function getOfferFilterOptions(): Promise<OfferFilterOptions> {
  const [clients, commercials, projectManagers, statuses, offerTypes, origins, years] =
    await Promise.all([
      prisma.client.findMany({ select: CATALOG_SELECT, orderBy: { name: "asc" } }),
      prisma.person.findMany({
        where: { canBeCommercial: true },
        select: CATALOG_SELECT,
        orderBy: { name: "asc" },
      }),
      prisma.person.findMany({
        where: { canBeProjectManager: true },
        select: CATALOG_SELECT,
        orderBy: { name: "asc" },
      }),
      prisma.offerStatus.findMany({ select: CATALOG_SELECT, orderBy: CATALOG_ORDER }),
      prisma.offerType.findMany({ select: CATALOG_SELECT, orderBy: CATALOG_ORDER }),
      prisma.origin.findMany({ select: CATALOG_SELECT, orderBy: CATALOG_ORDER }),
      getOfferYears(),
    ]);

  return {
    clients: toOptions(clients),
    commercials: toOptions(commercials),
    projectManagers: toOptions(projectManagers),
    statuses: toOptions(statuses),
    offerTypes: toOptions(offerTypes),
    origins: toOptions(origins),
    years,
  };
}
