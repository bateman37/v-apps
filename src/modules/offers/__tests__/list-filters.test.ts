import { describe, expect, it } from "vitest";
import type { AuthenticatedUser } from "@/modules/auth/identity";
import {
  buildOfferWhere,
  hasActiveOfferFilters,
  isIncoherentDateRange,
  parseOfferListParams,
  type OfferListFilters,
} from "@/modules/offers/data";

/**
 * Regresión del hotfix DEV-005 (bloque 6): parser/serializador de filtros con
 * `dateFrom`, `dateTo` y varios identificadores de estado, construcción de la
 * condición Prisma (rango inclusivo y `statusId in [...]`), y estado inicial
 * sin filtros equivalente a todas las fechas y todos los estados.
 */

const ADMIN: AuthenticatedUser = {
  id: "user-admin",
  username: "admin",
  role: "ADMIN",
  personId: "person-admin",
  personName: "Admin Sintético",
  canBeCommercial: false,
  canBeProjectManager: false,
  mustChangePassword: false,
};

describe("parseOfferListParams — bloque 6", () => {
  it("interpreta dateFrom y dateTo válidos", () => {
    const filters = parseOfferListParams({
      dateFrom: "2026-01-01",
      dateTo: "2026-01-31",
    });
    expect(filters.dateFrom).toBe("2026-01-01");
    expect(filters.dateTo).toBe("2026-01-31");
  });

  it("descarta en silencio una fecha con formato inválido", () => {
    const filters = parseOfferListParams({ dateFrom: "31/01/2026", dateTo: "no-es-una-fecha" });
    expect(filters.dateFrom).toBeNull();
    expect(filters.dateTo).toBeNull();
  });

  it("descarta una fecha con formato correcto pero inexistente", () => {
    const filters = parseOfferListParams({ dateFrom: "2026-02-30" });
    expect(filters.dateFrom).toBeNull();
  });

  it("interpreta varios statusId repetidos y los deduplica", () => {
    const filters = parseOfferListParams({
      statusId: ["status-a", "status-b", "status-a"],
    });
    expect(filters.statusIds).toEqual(["status-a", "status-b"]);
  });

  it("un único statusId también se interpreta como array de un elemento", () => {
    const filters = parseOfferListParams({ statusId: "status-a" });
    expect(filters.statusIds).toEqual(["status-a"]);
  });

  it("sin ningún parámetro, el resultado equivale a todas las fechas y todos los estados (bloque 6.3)", () => {
    const filters = parseOfferListParams({});
    expect(filters.dateFrom).toBeNull();
    expect(filters.dateTo).toBeNull();
    expect(filters.statusIds).toEqual([]);
    expect(hasActiveOfferFilters(filters)).toBe(false);
  });
});

describe("isIncoherentDateRange", () => {
  function filtersWith(dateFrom: string | null, dateTo: string | null): OfferListFilters {
    return {
      q: "",
      dateFrom,
      dateTo,
      clientId: "",
      commercialId: "",
      projectManagerId: "",
      statusIds: [],
      offerTypeId: "",
      originId: "",
      sort: "number",
      dir: "desc",
      page: 1,
    };
  }

  it("detecta Desde posterior a Hasta", () => {
    expect(isIncoherentDateRange(filtersWith("2026-03-01", "2026-02-01"))).toBe(true);
  });

  it("un rango coherente no es incoherente", () => {
    expect(isIncoherentDateRange(filtersWith("2026-02-01", "2026-03-01"))).toBe(false);
  });

  it("con un único límite, o ninguno, nunca es incoherente", () => {
    expect(isIncoherentDateRange(filtersWith("2026-02-01", null))).toBe(false);
    expect(isIncoherentDateRange(filtersWith(null, "2026-03-01"))).toBe(false);
    expect(isIncoherentDateRange(filtersWith(null, null))).toBe(false);
  });
});

describe("buildOfferWhere — bloque 6", () => {
  const BASE = parseOfferListParams({});

  it("sin filtros, no añade condición de fecha ni de estado", () => {
    const where = buildOfferWhere(BASE, ADMIN);
    expect(where.offerDate).toBeUndefined();
    expect(where.statusId).toBeUndefined();
  });

  it("con Desde y Hasta, el rango de offerDate es inclusivo", () => {
    const filters = { ...BASE, dateFrom: "2026-03-01", dateTo: "2026-03-31" };
    const where = buildOfferWhere(filters, ADMIN);
    const condition = where.AND;
    expect(Array.isArray(condition)).toBe(true);
    const dateCondition = (condition as Array<Record<string, unknown>>).find(
      (entry) => "offerDate" in entry,
    ) as { offerDate: { gte: Date; lt: Date } };
    expect(dateCondition.offerDate.gte.toISOString().slice(0, 10)).toBe("2026-03-01");
    // `Hasta` es inclusivo: el límite superior es el día siguiente, exclusivo.
    expect(dateCondition.offerDate.lt.toISOString().slice(0, 10)).toBe("2026-04-01");
  });

  it("solo Desde: la oferta debe tener fecha mayor o igual, sin límite superior", () => {
    const filters = { ...BASE, dateFrom: "2026-03-01" };
    const where = buildOfferWhere(filters, ADMIN);
    const dateCondition = (where.AND as Array<Record<string, unknown>>).find(
      (entry) => "offerDate" in entry,
    ) as { offerDate: { gte: Date; lt?: Date } };
    expect(dateCondition.offerDate.gte.toISOString().slice(0, 10)).toBe("2026-03-01");
    expect(dateCondition.offerDate.lt).toBeUndefined();
  });

  it("varios estados seleccionados se traducen en statusId in [...]", () => {
    const filters = { ...BASE, statusIds: ["status-a", "status-b"] };
    const where = buildOfferWhere(filters, ADMIN);
    expect(where.statusId).toEqual({ in: ["status-a", "status-b"] });
  });

  it("nunca filtra por el antiguo deletedAt (sin archivo funcional, bloque 5)", () => {
    const where = buildOfferWhere(BASE, ADMIN);
    expect(where.deletedAt).toBeUndefined();
  });
});
