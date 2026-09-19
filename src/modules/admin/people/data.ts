import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

/**
 * Maestro común de personas (DEC-013). Comercial y Project Manager no son
 * tablas separadas: son dos indicadores sobre el mismo registro.
 */

export type PersonRow = {
  id: string;
  name: string;
  canBeCommercial: boolean;
  canBeProjectManager: boolean;
  isActive: boolean;
  offerCount: number;
  /** Acceso vinculado a esta persona (bloque 7): `null` si no tiene cuenta. */
  access: PersonAccess | null;
};

export type PersonAccess = {
  userId: string;
  username: string;
  role: "ADMIN" | "USER";
  isActive: boolean;
  mustChangePassword: boolean;
};

export type PersonFilters = {
  q: string;
  commercial: "all" | "yes" | "no";
  projectManager: "all" | "yes" | "no";
  state: "all" | "active" | "inactive";
};

export type RawSearchParams = Record<string, string | string[] | undefined>;

function readParam(params: RawSearchParams, key: string): string {
  const value = params[key];
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return typeof value === "string" ? value.trim() : "";
}

function readTriState(params: RawSearchParams, key: string): "all" | "yes" | "no" {
  const value = readParam(params, key);
  return value === "yes" || value === "no" ? value : "all";
}

export function parsePersonFilters(params: RawSearchParams): PersonFilters {
  const state = readParam(params, "state");
  return {
    q: readParam(params, "q").slice(0, 200),
    commercial: readTriState(params, "commercial"),
    projectManager: readTriState(params, "projectManager"),
    state: state === "active" || state === "inactive" ? state : "all",
  };
}

export async function getPeople(filters: PersonFilters): Promise<PersonRow[]> {
  const where: Prisma.PersonWhereInput = {};

  if (filters.q) {
    where.name = { contains: filters.q, mode: "insensitive" };
  }
  if (filters.commercial !== "all") {
    where.canBeCommercial = filters.commercial === "yes";
  }
  if (filters.projectManager !== "all") {
    where.canBeProjectManager = filters.projectManager === "yes";
  }
  if (filters.state !== "all") {
    where.isActive = filters.state === "active";
  }

  const people = await prisma.person.findMany({
    where,
    select: {
      id: true,
      name: true,
      canBeCommercial: true,
      canBeProjectManager: true,
      isActive: true,
      _count: { select: { commercialOffers: true, projectManagerOffers: true } },
      user: {
        select: {
          id: true,
          username: true,
          role: true,
          isActive: true,
          mustChangePassword: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return people.map((person) => ({
    id: person.id,
    name: person.name,
    canBeCommercial: person.canBeCommercial,
    canBeProjectManager: person.canBeProjectManager,
    isActive: person.isActive,
    offerCount: person._count.commercialOffers + person._count.projectManagerOffers,
    access: person.user
      ? {
          userId: person.user.id,
          username: person.user.username,
          role: person.user.role,
          isActive: person.user.isActive,
          mustChangePassword: person.user.mustChangePassword,
        }
      : null,
  }));
}
