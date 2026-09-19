import { describe, expect, it } from "vitest";
import {
  canAccessOffer,
  checkUsername,
  isAdmin,
  isSessionValid,
  normalizeUsername,
  type AuthenticatedUser,
} from "@/modules/auth/identity";

function buildUser(overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser {
  return {
    id: "user-1",
    username: "usuario.sintetico",
    role: "USER",
    personId: "person-1",
    personName: "Persona Sintética",
    canBeCommercial: true,
    canBeProjectManager: false,
    mustChangePassword: false,
    ...overrides,
  };
}

describe("isSessionValid", () => {
  const now = new Date("2026-01-01T12:00:00.000Z");

  it("es inválida cuando no hay sesión", () => {
    expect(isSessionValid(null, now)).toBe(false);
  });

  it("es válida antes de la expiración", () => {
    expect(isSessionValid({ expiresAt: new Date("2026-01-01T13:00:00.000Z") }, now)).toBe(
      true,
    );
  });

  it("es inválida justo en el instante de expiración y después", () => {
    expect(isSessionValid({ expiresAt: now }, now)).toBe(false);
    expect(isSessionValid({ expiresAt: new Date("2026-01-01T11:00:00.000Z") }, now)).toBe(
      false,
    );
  });
});

describe("isAdmin", () => {
  it("distingue ADMIN de USER y de ausencia de usuario", () => {
    expect(isAdmin(buildUser({ role: "ADMIN" }))).toBe(true);
    expect(isAdmin(buildUser({ role: "USER" }))).toBe(false);
    expect(isAdmin(null)).toBe(false);
    expect(isAdmin(undefined)).toBe(false);
  });
});

describe("normalizeUsername / checkUsername", () => {
  it("normaliza espacios exteriores y mayúsculas", () => {
    expect(normalizeUsername("  Dennis.Barragan  ")).toBe("dennis.barragan");
  });

  it("rechaza un usuario vacío", () => {
    expect(checkUsername("")).toMatch(/obligatorio/);
  });

  it("rechaza caracteres no permitidos", () => {
    expect(checkUsername("usuario con espacios")).toMatch(/solo admite/);
  });

  it("acepta un usuario ya normalizado y válido", () => {
    expect(checkUsername("dennis.barragan")).toBeNull();
  });
});

describe("canAccessOffer (DEC-055)", () => {
  const admin = buildUser({ id: "admin-1", role: "ADMIN", personId: "person-admin" });
  const user = buildUser({ id: "user-1", role: "USER", personId: "person-user" });

  it("un ADMIN accede a cualquier oferta", () => {
    const offer = {
      createdById: "otro-usuario",
      commercialId: "otra-persona",
      projectManagerId: "otra-persona-2",
    };
    expect(canAccessOffer(admin, offer)).toBe(true);
  });

  it("un USER accede si es el creador autenticado", () => {
    const offer = {
      createdById: user.id,
      commercialId: "otra-persona",
      projectManagerId: "otra-persona-2",
    };
    expect(canAccessOffer(user, offer)).toBe(true);
  });

  it("un USER accede si es el comercial o el PM asignado, aunque no la creara", () => {
    const asComercial = {
      createdById: "otro-usuario",
      commercialId: user.personId,
      projectManagerId: "otra-persona",
    };
    const asPM = {
      createdById: "otro-usuario",
      commercialId: "otra-persona",
      projectManagerId: user.personId,
    };
    expect(canAccessOffer(user, asComercial)).toBe(true);
    expect(canAccessOffer(user, asPM)).toBe(true);
  });

  it("un USER no accede a una oferta ajena sin creador (histórico anterior al login)", () => {
    const offer = {
      createdById: null,
      commercialId: "otra-persona",
      projectManagerId: "otra-persona-2",
    };
    expect(canAccessOffer(user, offer)).toBe(false);
  });

  it("un USER no accede a una oferta que no le corresponde", () => {
    const offer = {
      createdById: "otro-usuario",
      commercialId: "otra-persona",
      projectManagerId: "otra-persona-2",
    };
    expect(canAccessOffer(user, offer)).toBe(false);
  });
});
