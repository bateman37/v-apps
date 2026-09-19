import { describe, expect, it } from "vitest";
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
} from "../seed-data";

const ALL_CATALOGS: Record<string, SeedValue[]> = {
  PRIORITIES,
  ORIGINS,
  OFFER_TYPES,
  OFFER_STATUSES,
  SEGMENTATIONS,
  PROFESSIONAL_PROFILES,
  LANGUAGES,
  CANCELLATION_REASONS,
};

describe("valores maestros iniciales", () => {
  it("tiene códigos técnicos únicos dentro de cada catálogo", () => {
    for (const [catalogName, values] of Object.entries(ALL_CATALOGS)) {
      const codes = values.map((value) => value.code);
      const uniqueCodes = new Set(codes);
      expect(uniqueCodes.size, `códigos duplicados en ${catalogName}`).toBe(
        codes.length,
      );
    }
  });

  it("no tiene nombres visibles vacíos", () => {
    for (const values of Object.values(ALL_CATALOGS)) {
      for (const value of values) {
        expect(value.name.trim().length).toBeGreaterThan(0);
        expect(value.code.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("incluye exactamente los perfiles profesionales aprobados, en orden", () => {
    const expectedCodes = [
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
    ];
    expect(PROFESSIONAL_PROFILES.map((profile) => profile.code)).toEqual(
      expectedCodes,
    );
  });

  it("deja idiomas y motivos de cancelación vacíos, sin valores inventados", () => {
    expect(LANGUAGES).toEqual([]);
    expect(CANCELLATION_REASONS).toEqual([]);
  });
});
