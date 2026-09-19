import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { toDateInputValue } from "@/lib/format";
import {
  canAccessOffer,
  isAdmin,
  PENDING_PM_REVIEW_STATUS_CODE,
  PENDING_SALES_REVIEW_STATUS_CODE,
  type AuthenticatedUser,
} from "@/modules/auth/identity";
import {
  ACCEPTED_STATUS_CODE,
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
  /** Estados con código `ACCEPTED`: obligan a informar el pedido Navision. */
  acceptedStatusIds: string[];
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
    // Un cliente activo **sin código** no puede elegirse para una oferta
    // nueva (DEV-004). El que ya usa la oferta que se edita sí se conserva:
    // una modificación no relacionada no debe bloquearse ni inventar un
    // código para un cliente heredado de DEV-003.
    prisma.client.findMany({
      where: {
        OR: [
          { isActive: true, code: { not: null } },
          ...(referenced.clientId ? [{ id: referenced.clientId }] : []),
        ],
      },
      select: { ...CATALOG_SELECT, code: true },
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
    clients: clients.map((client) => ({
      id: client.id,
      label: [
        client.code ? `${client.code} · ` : "",
        client.name,
        client.isActive ? "" : " (inactivo)",
        client.code ? "" : " (código pendiente)",
      ].join(""),
      isActive: client.isActive,
    })),
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
    acceptedStatusIds: statuses
      .filter((status) => status.code === ACCEPTED_STATUS_CODE)
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
  /** Nombre de la persona que lo cambió, o `null` si es anterior al login. */
  actorName: string | null;
};

export type OfferCommentEntry = {
  id: string;
  body: string;
  authorName: string | null;
  createdAt: string;
};

export type OfferAttachmentEntry = {
  id: string;
  originalName: string;
  contentType: string;
  sizeBytes: number;
  uploadedByName: string | null;
  createdAt: string;
  removedAt: string | null;
  removedByName: string | null;
  /** El usuario en curso puede retirarlo (es su autor o es administrador). */
  canRemove: boolean;
};

export type OfferDetail = {
  id: string;
  number: string;
  clientId: string;
  clientCode: string | null;
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
  /** Archivo lógico (DEC-016). `null` significa oferta activa. */
  archivedAt: string | null;
  archivedByName: string | null;
  restoredAt: string | null;
  restoredByName: string | null;
  createdById: string | null;
  createdByName: string | null;
  profileDays: OfferProfileDaysDetail[];
  totalProfileDays: string;
  statusHistory: OfferStatusHistoryEntry[];
  comments: OfferCommentEntry[];
  attachments: OfferAttachmentEntry[];
  /** El usuario en curso puede modificar y archivar/recuperar esta oferta. */
  canModify: boolean;
};

/**
 * Detalle completo de una oferta, o `null` si no existe **o si el usuario no
 * puede verla**. Ambas situaciones devuelven lo mismo a propósito: la
 * respuesta no revela la existencia de una oferta ajena.
 *
 * A diferencia de DEV-003, las ofertas archivadas **sí** se devuelven: se
 * consultan en modo seguro y la pantalla ofrece recuperarlas.
 */
export async function getOfferDetail(
  id: string,
  user: AuthenticatedUser,
): Promise<OfferDetail | null> {
  const offer = await prisma.offer.findFirst({
    where: { id },
    select: {
      id: true,
      number: true,
      deletedAt: true,
      restoredAt: true,
      createdById: true,
      archivedBy: { select: { person: { select: { name: true } } } },
      restoredBy: { select: { person: { select: { name: true } } } },
      createdBy: { select: { person: { select: { name: true } } } },
      comments: {
        select: {
          id: true,
          body: true,
          createdAt: true,
          author: { select: { person: { select: { name: true } } } },
        },
        orderBy: { createdAt: "desc" },
      },
      attachments: {
        select: {
          id: true,
          originalName: true,
          contentType: true,
          sizeBytes: true,
          createdAt: true,
          removedAt: true,
          uploadedById: true,
          uploadedBy: { select: { person: { select: { name: true } } } },
          removedBy: { select: { person: { select: { name: true } } } },
        },
        orderBy: { createdAt: "desc" },
      },
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
      client: { select: { name: true, code: true } },
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
          actor: { select: { person: { select: { name: true } } } },
        },
        orderBy: { changedAt: "desc" },
      },
    },
  });

  if (!offer) {
    return null;
  }

  // Autorización de lectura: la misma regla que aplican las mutaciones, el
  // listado, la exportación y las descargas.
  if (
    !canAccessOffer(user, {
      createdById: offer.createdById,
      commercialId: offer.commercialId,
      projectManagerId: offer.projectManagerId,
    })
  ) {
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
    clientCode: offer.client.code,
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
    archivedAt: offer.deletedAt?.toISOString() ?? null,
    archivedByName: offer.archivedBy?.person.name ?? null,
    restoredAt: offer.restoredAt?.toISOString() ?? null,
    restoredByName: offer.restoredBy?.person.name ?? null,
    createdById: offer.createdById,
    createdByName: offer.createdBy?.person.name ?? null,
    statusHistory: offer.statusHistory.map((entry) => ({
      id: entry.id,
      previousStatusName: entry.previousStatus?.name ?? null,
      newStatusName: entry.newStatus.name,
      changedAt: entry.changedAt.toISOString(),
      actorName: entry.actor?.person.name ?? null,
    })),
    comments: offer.comments.map((comment) => ({
      id: comment.id,
      body: comment.body,
      authorName: comment.author?.person.name ?? null,
      createdAt: comment.createdAt.toISOString(),
    })),
    attachments: offer.attachments.map((attachment) => ({
      id: attachment.id,
      originalName: attachment.originalName,
      contentType: attachment.contentType,
      sizeBytes: attachment.sizeBytes,
      uploadedByName: attachment.uploadedBy?.person.name ?? null,
      createdAt: attachment.createdAt.toISOString(),
      removedAt: attachment.removedAt?.toISOString() ?? null,
      removedByName: attachment.removedBy?.person.name ?? null,
      canRemove:
        attachment.removedAt === null &&
        (isAdmin(user) || attachment.uploadedById === user.id),
    })),
    // Una oferta archivada se consulta en modo seguro: para cambiar sus datos
    // funcionales hay que recuperarla primero.
    canModify: offer.deletedAt === null,
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
  /**
   * Ámbito del listado. `activas` es el listado ordinario; `archivadas`
   * muestra únicamente las ofertas archivadas (eliminación lógica, DEC-016),
   * con la misma búsqueda, los mismos filtros y la misma exportación.
   */
  scope: OfferScope;
};

export type OfferScope = "activas" | "archivadas";

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
  const scopeRaw = readParam(params, "scope");
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
    scope: scopeRaw === "archivadas" ? "archivadas" : "activas",
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
/**
 * Restricción de visibilidad aplicada a **toda** consulta de ofertas.
 *
 * Un `ADMIN` no añade ninguna condición. Un `USER` solo ve las ofertas de las
 * que es creador, comercial asignado o Project Manager asignado; las ofertas
 * anteriores al login, sin creador, solo le aparecen si le corresponden por
 * comercial o por PM. Es la misma regla que `canAccessOffer`, expresada como
 * condición SQL para que el filtrado ocurra en PostgreSQL y no en memoria.
 */
export function offerScopeWhere(user: AuthenticatedUser): Prisma.OfferWhereInput {
  if (isAdmin(user)) {
    return {};
  }
  return {
    OR: [
      { createdById: user.id },
      { commercialId: user.personId },
      { projectManagerId: user.personId },
    ],
  };
}

function buildOfferWhere(
  filters: OfferListFilters,
  availableYears: readonly number[],
  user: AuthenticatedUser,
): Prisma.OfferWhereInput {
  const conditions: Prisma.OfferWhereInput[] = [offerScopeWhere(user)];

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
    // Archivo lógico (DEC-016): el listado ordinario excluye las archivadas y
    // la vista «Ofertas archivadas» muestra exactamente esas.
    deletedAt: filters.scope === "archivadas" ? { not: null } : null,
  };

  where.AND = conditions;

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
  user: AuthenticatedUser,
): Promise<OfferListResult> {
  // Solo hace falta conocer los años con datos cuando se filtra por mes sin
  // año; en el resto de casos no se lanza esta consulta.
  const availableYears =
    filters.month !== null && filters.year === null ? await getOfferYears() : [];
  const where = buildOfferWhere(filters, availableYears, user);

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

// ---------------------------------------------------------------------------
// Condición reutilizable para la exportación
// ---------------------------------------------------------------------------

/**
 * Misma condición que usa el listado, expuesta para que la exportación aplique
 * **exactamente** los mismos filtros, el mismo ámbito normal/archivado y los
 * mismos permisos. Se comparte en lugar de duplicarse para que no puedan
 * divergir.
 */
export async function buildExportWhere(
  filters: OfferListFilters,
  user: AuthenticatedUser,
): Promise<Prisma.OfferWhereInput> {
  const availableYears =
    filters.month !== null && filters.year === null ? await getOfferYears() : [];
  return buildOfferWhere(filters, availableYears, user);
}

/** Orden determinista de la exportación, coherente con el del listado. */
export function buildExportOrderBy(
  filters: OfferListFilters,
): Prisma.OfferOrderByWithRelationInput[] {
  return buildOfferOrderBy(filters);
}

// ---------------------------------------------------------------------------
// Bandeja «Pendiente de revisión»
// ---------------------------------------------------------------------------

export type PendingReviewKind = "PM" | "COMMERCIAL";

export type PendingReviewRow = {
  id: string;
  number: string;
  clientName: string;
  description: string;
  statusId: string;
  statusName: string;
  kind: PendingReviewKind;
  commercialName: string;
  projectManagerName: string;
  /** Última modificación relevante: el cambio de estado que la dejó pendiente. */
  pendingSince: string;
  /** Días completos transcurridos desde `pendingSince`. */
  pendingDays: number;
};

export type PendingReviewFilters = {
  kind: PendingReviewKind | "all";
  commercialId: string;
  projectManagerId: string;
  clientId: string;
  /** Antigüedad mínima en días; `null` para no filtrar. */
  minDays: number | null;
};

export function parsePendingReviewFilters(
  params: RawSearchParams,
): PendingReviewFilters {
  const kind = readParam(params, "kind");
  return {
    kind: kind === "PM" || kind === "COMMERCIAL" ? kind : "all",
    commercialId: readParam(params, "commercialId"),
    projectManagerId: readParam(params, "projectManagerId"),
    clientId: readParam(params, "clientId"),
    minDays: readIntParam(params, "minDays", 0, 3650),
  };
}

/**
 * Ofertas pendientes de revisión.
 *
 * La bandeja **se deriva** del estado actual y de las asignaciones: no existe
 * un circuito paralelo de solicitudes de aprobación.
 *
 * - `A valorar PM` (`TO_BE_ASSESSED_PM`) pende de su Project Manager.
 * - `Entregado a comercial` (`DELIVERED_TO_SALES`) pende de su comercial.
 * - Una persona habilitada como PM y como comercial ve la unión **sin
 *   duplicados**: cada oferta aparece una sola vez, con el tipo que
 *   corresponde a su estado.
 * - Un administrador ve todas y puede filtrarlas.
 * - Las ofertas archivadas no aparecen en la bandeja activa.
 */
export async function getPendingReviewOffers(
  user: AuthenticatedUser,
  filters: PendingReviewFilters,
): Promise<PendingReviewRow[]> {
  const statuses = await prisma.offerStatus.findMany({
    where: {
      code: { in: [PENDING_PM_REVIEW_STATUS_CODE, PENDING_SALES_REVIEW_STATUS_CODE] },
    },
    select: { id: true, code: true, name: true },
  });

  const pmStatus = statuses.find(
    (status) => status.code === PENDING_PM_REVIEW_STATUS_CODE,
  );
  const salesStatus = statuses.find(
    (status) => status.code === PENDING_SALES_REVIEW_STATUS_CODE,
  );

  const branches: Prisma.OfferWhereInput[] = [];

  if (pmStatus && (filters.kind === "all" || filters.kind === "PM")) {
    branches.push({
      statusId: pmStatus.id,
      // Un usuario normal solo ve las suyas; el administrador, todas.
      ...(isAdmin(user) ? {} : { projectManagerId: user.personId }),
    });
  }
  if (salesStatus && (filters.kind === "all" || filters.kind === "COMMERCIAL")) {
    branches.push({
      statusId: salesStatus.id,
      ...(isAdmin(user) ? {} : { commercialId: user.personId }),
    });
  }

  if (branches.length === 0) {
    return [];
  }

  const where: Prisma.OfferWhereInput = {
    deletedAt: null,
    OR: branches,
  };

  if (filters.commercialId) {
    where.commercialId = filters.commercialId;
  }
  if (filters.projectManagerId) {
    where.projectManagerId = filters.projectManagerId;
  }
  if (filters.clientId) {
    where.clientId = filters.clientId;
  }

  const offers = await prisma.offer.findMany({
    where,
    select: {
      id: true,
      number: true,
      description: true,
      statusId: true,
      updatedAt: true,
      client: { select: { name: true } },
      commercial: { select: { name: true } },
      projectManager: { select: { name: true } },
      status: { select: { name: true } },
      statusHistory: {
        select: { changedAt: true },
        orderBy: { changedAt: "desc" },
        take: 1,
      },
    },
    orderBy: { updatedAt: "asc" },
  });

  const now = Date.now();

  return offers
    .map((offer) => {
      const pendingSince = offer.statusHistory[0]?.changedAt ?? offer.updatedAt;
      const pendingDays = Math.max(
        0,
        Math.floor((now - pendingSince.getTime()) / (24 * 60 * 60 * 1000)),
      );
      const kind: PendingReviewKind =
        offer.statusId === pmStatus?.id ? "PM" : "COMMERCIAL";
      return {
        id: offer.id,
        number: offer.number,
        clientName: offer.client.name,
        description: offer.description,
        statusId: offer.statusId,
        statusName: offer.status.name,
        kind,
        commercialName: offer.commercial.name,
        projectManagerName: offer.projectManager.name,
        pendingSince: pendingSince.toISOString(),
        pendingDays,
      };
    })
    .filter((row) => filters.minDays === null || row.pendingDays >= filters.minDays);
}

// ---------------------------------------------------------------------------
// Auditoría, versiones y línea temporal de una oferta
// ---------------------------------------------------------------------------

export type OfferVersionSummary = {
  version: number;
  createdAt: string;
  authorName: string | null;
};

export type TraceEventKind =
  | "VERSION"
  | "STATUS"
  | "COMMENT"
  | "ATTACHMENT"
  | "ARCHIVE"
  | "AUDIT";

export type OfferTraceEvent = {
  id: string;
  kind: TraceEventKind;
  at: string;
  authorName: string | null;
  action: string;
  detail: string | null;
  version: number | null;
  previousStatusName: string | null;
  newStatusName: string | null;
  changedFields: string[];
};

export type OfferTrace = {
  versions: OfferVersionSummary[];
  events: OfferTraceEvent[];
};

const AUDIT_ACTION_LABELS: Record<string, string> = {
  CREATE: "Alta de la oferta",
  UPDATE: "Modificación",
  STATUS_CHANGE: "Cambio de estado",
  REVIEW: "Revisión completada",
  ARCHIVE: "Archivada",
  RESTORE: "Recuperada",
  COMMENT: "Comentario añadido",
  ATTACHMENT_ADDED: "Adjunto añadido",
  ATTACHMENT_REMOVED: "Adjunto retirado",
};

/** Nombres legibles de los campos que la auditoría guarda por identificador. */
const AUDIT_FIELD_LABELS: Record<string, string> = {
  clientId: "Cliente",
  priorityId: "Prioridad",
  commercialId: "Comercial",
  projectManagerId: "Project Manager",
  originId: "Origen",
  offerTypeId: "Tipo de oferta",
  statusId: "Estado",
  segmentationId: "Segmentación",
  languageId: "Idioma",
  cancellationReasonId: "Motivo de cancelación",
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
  profileDays: "Jornadas por perfil",
  estado: "Estado",
  archivada: "Archivada",
};

/** Lista de campos modificados, legible y sin volcar JSON técnico en bruto. */
export function changedFieldsOf(changes: unknown): string[] {
  if (typeof changes !== "object" || changes === null || Array.isArray(changes)) {
    return [];
  }
  return Object.keys(changes)
    .filter((key) => key !== "number" && key !== "numero")
    .map((key) => AUDIT_FIELD_LABELS[key] ?? key);
}

/**
 * Línea temporal completa de una oferta: versiones, cambios de estado,
 * comentarios y eventos auditables de adjuntos, archivo y recuperación.
 *
 * Para no mostrar dos veces el mismo hecho, los eventos de auditoría cuyo
 * contenido ya se presenta con más detalle desde su tabla propia —el alta, el
 * cambio de estado, el comentario y los adjuntos— se omiten de la parte
 * genérica.
 */
export async function getOfferTrace(offerId: string): Promise<OfferTrace> {
  const [versions, statusHistory, comments, attachments, audits] = await Promise.all([
    prisma.offerVersion.findMany({
      where: { offerId },
      select: {
        version: true,
        createdAt: true,
        author: { select: { person: { select: { name: true } } } },
      },
      orderBy: { version: "desc" },
    }),
    prisma.offerStatusHistory.findMany({
      where: { offerId },
      select: {
        id: true,
        changedAt: true,
        previousStatus: { select: { name: true } },
        newStatus: { select: { name: true } },
        actor: { select: { person: { select: { name: true } } } },
      },
      orderBy: { changedAt: "desc" },
    }),
    prisma.offerComment.findMany({
      where: { offerId },
      select: {
        id: true,
        body: true,
        createdAt: true,
        author: { select: { person: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.offerAttachment.findMany({
      where: { offerId },
      select: {
        id: true,
        originalName: true,
        createdAt: true,
        removedAt: true,
        uploadedBy: { select: { person: { select: { name: true } } } },
        removedBy: { select: { person: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.auditLog.findMany({
      where: {
        entityType: "Offer",
        entityId: offerId,
        action: { in: ["UPDATE", "REVIEW", "ARCHIVE", "RESTORE"] },
      },
      select: {
        id: true,
        action: true,
        changes: true,
        createdAt: true,
        actor: { select: { person: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const events: OfferTraceEvent[] = [];

  for (const version of versions) {
    events.push({
      id: `version-${version.version}`,
      kind: "VERSION",
      at: version.createdAt.toISOString(),
      authorName: version.author?.person.name ?? null,
      action: `Versión ${version.version}`,
      detail: null,
      version: version.version,
      previousStatusName: null,
      newStatusName: null,
      changedFields: [],
    });
  }

  for (const entry of statusHistory) {
    events.push({
      id: `status-${entry.id}`,
      kind: "STATUS",
      at: entry.changedAt.toISOString(),
      authorName: entry.actor?.person.name ?? null,
      action: entry.previousStatus ? "Cambio de estado" : "Alta de la oferta",
      detail: null,
      version: null,
      previousStatusName: entry.previousStatus?.name ?? null,
      newStatusName: entry.newStatus.name,
      changedFields: [],
    });
  }

  for (const comment of comments) {
    events.push({
      id: `comment-${comment.id}`,
      kind: "COMMENT",
      at: comment.createdAt.toISOString(),
      authorName: comment.author?.person.name ?? null,
      action: "Comentario añadido",
      detail: comment.body,
      version: null,
      previousStatusName: null,
      newStatusName: null,
      changedFields: [],
    });
  }

  for (const attachment of attachments) {
    events.push({
      id: `attachment-add-${attachment.id}`,
      kind: "ATTACHMENT",
      at: attachment.createdAt.toISOString(),
      authorName: attachment.uploadedBy?.person.name ?? null,
      action: "Adjunto añadido",
      detail: attachment.originalName,
      version: null,
      previousStatusName: null,
      newStatusName: null,
      changedFields: [],
    });
    if (attachment.removedAt) {
      events.push({
        id: `attachment-remove-${attachment.id}`,
        kind: "ATTACHMENT",
        at: attachment.removedAt.toISOString(),
        authorName: attachment.removedBy?.person.name ?? null,
        action: "Adjunto retirado",
        detail: attachment.originalName,
        version: null,
        previousStatusName: null,
        newStatusName: null,
        changedFields: [],
      });
    }
  }

  for (const audit of audits) {
    events.push({
      id: `audit-${audit.id}`,
      kind:
        audit.action === "ARCHIVE" || audit.action === "RESTORE" ? "ARCHIVE" : "AUDIT",
      at: audit.createdAt.toISOString(),
      authorName: audit.actor?.person.name ?? null,
      action: AUDIT_ACTION_LABELS[audit.action] ?? audit.action,
      detail: null,
      version: null,
      previousStatusName: null,
      newStatusName: null,
      changedFields: changedFieldsOf(audit.changes),
    });
  }

  events.sort((left, right) => right.at.localeCompare(left.at));

  return {
    versions: versions.map((version) => ({
      version: version.version,
      createdAt: version.createdAt.toISOString(),
      authorName: version.author?.person.name ?? null,
    })),
    events,
  };
}

/** Instantáneas de dos versiones concretas, para compararlas. */
export async function getOfferVersionSnapshots(
  offerId: string,
  versions: number[],
) {
  return prisma.offerVersion.findMany({
    where: { offerId, version: { in: versions } },
    select: {
      version: true,
      createdAt: true,
      snapshot: true,
      author: { select: { person: { select: { name: true } } } },
    },
    orderBy: { version: "asc" },
  });
}
