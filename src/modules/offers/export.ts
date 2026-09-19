import "server-only";

import ExcelJS from "exceljs";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { changedFieldsOf } from "@/modules/offers/data";
import type { AuthenticatedUser } from "@/modules/auth/identity";
import {
  buildOfferOrderBy,
  buildOfferWhere,
  type OfferListFilters,
} from "@/modules/offers/data";

/**
 * Exportación a Excel del listado de ofertas (bloque 10).
 *
 * Reutiliza exactamente el mismo `where` (filtros + alcance por permisos) y
 * el mismo `orderBy` que la pantalla de listado, para que la exportación
 * nunca pueda mostrar más —ni de otra forma— de lo que el usuario ya podía
 * consultar. Todo se resuelve con un número acotado de consultas, sin N+1:
 * una para las ofertas y sus relaciones, y una por cada tabla de eventos del
 * historial, filtradas por el conjunto de identificadores ya obtenido.
 */

// Orden fijo de los perfiles conocidos (ver docs/offers/BUSINESS_RULES.md).
// Ejecutar el seed no cambia este orden: es el mismo catálogo aprobado.
const PROFILE_COLUMN_CODES = [
  "PM",
  "AN",
  "DIL",
  "DE",
  "IN",
  "DI",
  "PR-BE",
  "PR-FE",
  "PR-REM",
  "KN",
  "IT",
  "UX",
  "TL",
  "PLATF",
] as const;

const AUDIT_ACTION_LABELS: Record<string, string> = {
  UPDATE: "Modificación",
  REVIEW: "Revisión completada",
  ARCHIVE: "Archivada",
  RESTORE: "Recuperada",
};

const DATE_FORMAT = "dd/mm/yyyy";
const DATETIME_FORMAT = "dd/mm/yyyy hh:mm";
const CURRENCY_FORMAT = '#,##0.00 "€"';
const DAYS_FORMAT = "#,##0.00";

function toDecimalNumber(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  const parsed = Number(value.toString());
  return Number.isFinite(parsed) ? parsed : null;
}

const OFFER_EXPORT_SELECT = {
  id: true,
  number: true,
  offerDate: true,
  estimatedCommercialDeliveryDate: true,
  estimatedClientDeliveryDate: true,
  estimatedPortfolioDate: true,
  description: true,
  navisionOrder: true,
  totalAmount: true,
  commercialDays: true,
  requesterName: true,
  notes: true,
  implantationText: true,
  createdAt: true,
  updatedAt: true,
  client: { select: { code: true, name: true } },
  offerType: { select: { name: true } },
  status: { select: { name: true } },
  origin: { select: { name: true } },
  priority: { select: { name: true } },
  segmentation: { select: { name: true } },
  cancellationReason: { select: { name: true } },
  commercial: { select: { name: true } },
  projectManager: { select: { name: true } },
  profileDays: {
    select: {
      days: true,
      professionalProfile: { select: { code: true, name: true } },
    },
  },
} satisfies Prisma.OfferSelect;

type OfferExportRow = Prisma.OfferGetPayload<{ select: typeof OFFER_EXPORT_SELECT }>;

export async function buildOffersExportWorkbook(
  filters: OfferListFilters,
  user: AuthenticatedUser,
): Promise<ExcelJS.Buffer> {
  const where = buildOfferWhere(filters, user);
  const orderBy = buildOfferOrderBy(filters);

  const offers = await prisma.offer.findMany({
    where,
    orderBy,
    select: OFFER_EXPORT_SELECT,
  });

  const offerIds = offers.map((offer) => offer.id);

  const [versions, statusHistory, comments, attachments, audits] = await Promise.all([
    prisma.offerVersion.findMany({
      where: { offerId: { in: offerIds } },
      select: {
        offerId: true,
        version: true,
        createdAt: true,
        author: { select: { person: { select: { name: true } } } },
      },
    }),
    prisma.offerStatusHistory.findMany({
      where: { offerId: { in: offerIds } },
      select: {
        offerId: true,
        changedAt: true,
        previousStatus: { select: { name: true } },
        newStatus: { select: { name: true } },
        actor: { select: { person: { select: { name: true } } } },
      },
    }),
    prisma.offerComment.findMany({
      where: { offerId: { in: offerIds } },
      select: {
        offerId: true,
        body: true,
        createdAt: true,
        author: { select: { person: { select: { name: true } } } },
      },
    }),
    prisma.offerAttachment.findMany({
      where: { offerId: { in: offerIds } },
      select: {
        offerId: true,
        originalName: true,
        createdAt: true,
        removedAt: true,
        uploadedBy: { select: { person: { select: { name: true } } } },
        removedBy: { select: { person: { select: { name: true } } } },
      },
    }),
    prisma.auditLog.findMany({
      where: {
        entityType: "Offer",
        entityId: { in: offerIds },
        action: { in: ["UPDATE", "REVIEW", "ARCHIVE", "RESTORE"] },
      },
      select: {
        entityId: true,
        action: true,
        changes: true,
        createdAt: true,
        actor: { select: { person: { select: { name: true } } } },
      },
    }),
  ]);

  const numberById = new Map(offers.map((offer) => [offer.id, offer.number]));

  type HistoryRow = {
    offerNumber: string;
    at: Date;
    kind: string;
    version: number | null;
    author: string | null;
    action: string;
    changedFields: string[];
    previousStatus: string | null;
    newStatus: string | null;
    detail: string | null;
  };

  const historyRows: HistoryRow[] = [];

  for (const version of versions) {
    historyRows.push({
      offerNumber: numberById.get(version.offerId) ?? "",
      at: version.createdAt,
      kind: "Versión",
      version: version.version,
      author: version.author?.person.name ?? null,
      action: `Versión ${version.version}`,
      changedFields: [],
      previousStatus: null,
      newStatus: null,
      detail: null,
    });
  }
  for (const entry of statusHistory) {
    historyRows.push({
      offerNumber: numberById.get(entry.offerId) ?? "",
      at: entry.changedAt,
      kind: "Estado",
      version: null,
      author: entry.actor?.person.name ?? null,
      action: entry.previousStatus ? "Cambio de estado" : "Alta de la oferta",
      changedFields: [],
      previousStatus: entry.previousStatus?.name ?? null,
      newStatus: entry.newStatus.name,
      detail: null,
    });
  }
  for (const comment of comments) {
    historyRows.push({
      offerNumber: numberById.get(comment.offerId) ?? "",
      at: comment.createdAt,
      kind: "Comentario",
      version: null,
      author: comment.author?.person.name ?? null,
      action: "Comentario añadido",
      changedFields: [],
      previousStatus: null,
      newStatus: null,
      detail: comment.body,
    });
  }
  for (const attachment of attachments) {
    historyRows.push({
      offerNumber: numberById.get(attachment.offerId) ?? "",
      at: attachment.createdAt,
      kind: "Adjunto",
      version: null,
      author: attachment.uploadedBy?.person.name ?? null,
      action: "Adjunto añadido",
      changedFields: [],
      previousStatus: null,
      newStatus: null,
      detail: attachment.originalName,
    });
    if (attachment.removedAt) {
      historyRows.push({
        offerNumber: numberById.get(attachment.offerId) ?? "",
        at: attachment.removedAt,
        kind: "Adjunto",
        version: null,
        author: attachment.removedBy?.person.name ?? null,
        action: "Adjunto retirado",
        changedFields: [],
        previousStatus: null,
        newStatus: null,
        detail: attachment.originalName,
      });
    }
  }
  for (const audit of audits) {
    historyRows.push({
      offerNumber: numberById.get(audit.entityId) ?? "",
      at: audit.createdAt,
      kind: "Auditoría",
      version: null,
      author: audit.actor?.person.name ?? null,
      action: AUDIT_ACTION_LABELS[audit.action] ?? audit.action,
      changedFields: changedFieldsOf(audit.changes),
      previousStatus: null,
      newStatus: null,
      detail: null,
    });
  }

  historyRows.sort((left, right) => {
    const byNumber = left.offerNumber.localeCompare(right.offerNumber);
    return byNumber !== 0 ? byNumber : left.at.getTime() - right.at.getTime();
  });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Vincle Apps";
  workbook.created = new Date();

  buildOffersSheet(workbook, offers);
  buildDaysSheet(workbook, offers);
  buildHistorySheet(workbook, historyRows);

  return workbook.xlsx.writeBuffer();
}

function buildOffersSheet(workbook: ExcelJS.Workbook, offers: OfferExportRow[]) {
  const sheet = workbook.addWorksheet("Ofertas", { views: [{ state: "frozen", ySplit: 1 }] });

  const profileColumns = PROFILE_COLUMN_CODES.map((code) => ({
    header: `J.${code}`,
    key: `profile_${code}`,
    width: 10,
  }));

  sheet.columns = [
    { header: "Año", key: "year", width: 8 },
    { header: "Mes", key: "month", width: 6 },
    { header: "Fecha", key: "offerDate", width: 12 },
    { header: "Cod. Cliente", key: "clientCode", width: 12 },
    { header: "Cliente", key: "clientName", width: 28 },
    { header: "Tipo Oferta", key: "offerType", width: 16 },
    { header: "Cod. Oferta", key: "number", width: 18 },
    { header: "Fecha entrega comercial", key: "commercialDelivery", width: 16 },
    { header: "Fecha entrega cliente", key: "clientDelivery", width: 16 },
    { header: "Descripción", key: "description", width: 40 },
    { header: "Pedido Navision", key: "navisionOrder", width: 16 },
    { header: "Project Manager", key: "projectManager", width: 20 },
    { header: "Comercial", key: "commercial", width: 20 },
    { header: "Total jornadas", key: "totalDays", width: 12 },
    { header: "Jornadas Comercial", key: "commercialDays", width: 14 },
    { header: "Importe", key: "totalAmount", width: 14 },
    { header: "Estado", key: "status", width: 18 },
    { header: "Origen", key: "origin", width: 14 },
    ...profileColumns,
    { header: "Solicitante", key: "requesterName", width: 18 },
    { header: "Motivo Cancelado", key: "cancellationReason", width: 22 },
    { header: "Fecha Estimada Cartera", key: "portfolioDate", width: 16 },
    { header: "Implantación", key: "implantation", width: 20 },
    { header: "Prioridad", key: "priority", width: 12 },
    { header: "Segmentación", key: "segmentation", width: 20 },
    { header: "Observaciones", key: "notes", width: 30 },
    { header: "Creada el", key: "createdAt", width: 16 },
    { header: "Actualizada el", key: "updatedAt", width: 16 },
  ];

  for (const offer of offers) {
    const daysByCode = new Map(
      offer.profileDays.map((entry) => [
        entry.professionalProfile.code,
        toDecimalNumber(entry.days) ?? 0,
      ]),
    );
    const totalDays = offer.profileDays.reduce(
      (sum, entry) => sum + (toDecimalNumber(entry.days) ?? 0),
      0,
    );

    const row: Record<string, unknown> = {
      year: offer.offerDate.getFullYear(),
      month: offer.offerDate.getMonth() + 1,
      offerDate: offer.offerDate,
      clientCode: offer.client.code ?? "",
      clientName: offer.client.name,
      offerType: offer.offerType.name,
      number: offer.number,
      commercialDelivery: offer.estimatedCommercialDeliveryDate,
      clientDelivery: offer.estimatedClientDeliveryDate,
      description: offer.description,
      navisionOrder: offer.navisionOrder ?? "",
      projectManager: offer.projectManager.name,
      commercial: offer.commercial.name,
      totalDays,
      commercialDays: toDecimalNumber(offer.commercialDays) ?? 0,
      totalAmount: toDecimalNumber(offer.totalAmount) ?? 0,
      status: offer.status.name,
      origin: offer.origin.name,
      requesterName: offer.requesterName,
      cancellationReason: offer.cancellationReason?.name ?? "",
      portfolioDate: offer.estimatedPortfolioDate,
      implantation: offer.implantationText ?? "",
      priority: offer.priority.name,
      segmentation: offer.segmentation?.name ?? "",
      notes: offer.notes ?? "",
      createdAt: offer.createdAt,
      updatedAt: offer.updatedAt,
    };
    for (const code of PROFILE_COLUMN_CODES) {
      row[`profile_${code}`] = daysByCode.get(code) ?? 0;
    }
    sheet.addRow(row);
  }

  applyDateFormat(sheet, ["offerDate", "commercialDelivery", "clientDelivery", "portfolioDate"], DATE_FORMAT);
  applyDateFormat(sheet, ["createdAt", "updatedAt"], DATETIME_FORMAT);
  applyNumberFormat(sheet, ["totalAmount"], CURRENCY_FORMAT);
  applyNumberFormat(
    sheet,
    ["totalDays", "commercialDays", ...PROFILE_COLUMN_CODES.map((code) => `profile_${code}`)],
    DAYS_FORMAT,
  );
  finalizeSheet(sheet);
}

function buildDaysSheet(workbook: ExcelJS.Workbook, offers: OfferExportRow[]) {
  const sheet = workbook.addWorksheet("Jornadas", { views: [{ state: "frozen", ySplit: 1 }] });
  sheet.columns = [
    { header: "Cod. Oferta", key: "number", width: 18 },
    { header: "Cod. Cliente", key: "clientCode", width: 12 },
    { header: "Cliente", key: "clientName", width: 28 },
    { header: "Código perfil", key: "profileCode", width: 14 },
    { header: "Perfil profesional", key: "profileName", width: 24 },
    { header: "Jornadas", key: "days", width: 12 },
  ];

  for (const offer of offers) {
    for (const entry of offer.profileDays) {
      const days = toDecimalNumber(entry.days) ?? 0;
      if (days === 0) {
        // No se generan filas de cero para perfiles ausentes.
        continue;
      }
      sheet.addRow({
        number: offer.number,
        clientCode: offer.client.code ?? "",
        clientName: offer.client.name,
        profileCode: entry.professionalProfile.code,
        profileName: entry.professionalProfile.name,
        days,
      });
    }
  }

  applyNumberFormat(sheet, ["days"], DAYS_FORMAT);
  finalizeSheet(sheet);
}

function buildHistorySheet(
  workbook: ExcelJS.Workbook,
  rows: Array<{
    offerNumber: string;
    at: Date;
    kind: string;
    version: number | null;
    author: string | null;
    action: string;
    changedFields: string[];
    previousStatus: string | null;
    newStatus: string | null;
    detail: string | null;
  }>,
) {
  const sheet = workbook.addWorksheet("Historial", { views: [{ state: "frozen", ySplit: 1 }] });
  sheet.columns = [
    { header: "Cod. Oferta", key: "number", width: 18 },
    { header: "Tipo de evento", key: "kind", width: 14 },
    { header: "Versión", key: "version", width: 10 },
    { header: "Fecha y hora", key: "at", width: 18 },
    { header: "Autor", key: "author", width: 20 },
    { header: "Acción", key: "action", width: 22 },
    { header: "Campos modificados", key: "changedFields", width: 30 },
    { header: "Estado anterior", key: "previousStatus", width: 18 },
    { header: "Estado nuevo", key: "newStatus", width: 18 },
    { header: "Comentario o detalle", key: "detail", width: 40 },
  ];

  for (const row of rows) {
    sheet.addRow({
      number: row.offerNumber,
      kind: row.kind,
      version: row.version ?? "",
      at: row.at,
      author: row.author ?? "Usuario no disponible (registro anterior al login)",
      action: row.action,
      changedFields: row.changedFields.join(", "),
      previousStatus: row.previousStatus ?? "",
      newStatus: row.newStatus ?? "",
      detail: row.detail ?? "",
    });
  }

  applyDateFormat(sheet, ["at"], DATETIME_FORMAT);
  finalizeSheet(sheet);
}

function applyDateFormat(sheet: ExcelJS.Worksheet, keys: string[], format: string) {
  for (const key of keys) {
    const column = sheet.getColumn(key);
    column.numFmt = format;
  }
}

function applyNumberFormat(sheet: ExcelJS.Worksheet, keys: string[], format: string) {
  for (const key of keys) {
    const column = sheet.getColumn(key);
    column.numFmt = format;
  }
}

/** Cabecera sobria, inmovilizada, y autofiltro sobre toda la tabla. */
function finalizeSheet(sheet: ExcelJS.Worksheet) {
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.alignment = { vertical: "middle" };
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFEFEFEF" },
    };
  });

  if (sheet.rowCount > 0 && sheet.columnCount > 0) {
    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: sheet.columnCount },
    };
  }
}
