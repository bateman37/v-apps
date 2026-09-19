import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

/** Maestro de clientes: lectura para la pantalla de Administración. */

export type ClientRow = {
  id: string;
  code: string | null;
  name: string;
  isActive: boolean;
  offerCount: number;
};

export type ClientFilters = {
  q: string;
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

export function parseClientFilters(params: RawSearchParams): ClientFilters {
  const state = readParam(params, "state");
  return {
    q: readParam(params, "q").slice(0, 200),
    state: state === "active" || state === "inactive" ? state : "all",
  };
}

export async function getClients(filters: ClientFilters): Promise<ClientRow[]> {
  const where: Prisma.ClientWhereInput = {};

  if (filters.q) {
    where.OR = [
      { name: { contains: filters.q, mode: "insensitive" } },
      { code: { contains: filters.q, mode: "insensitive" } },
    ];
  }
  if (filters.state !== "all") {
    where.isActive = filters.state === "active";
  }

  const clients = await prisma.client.findMany({
    where,
    select: {
      id: true,
      code: true,
      name: true,
      isActive: true,
      // Recuento agregado por Prisma en la misma consulta: no hay N+1.
      _count: { select: { offers: true } },
    },
    orderBy: { name: "asc" },
  });

  return clients.map((client) => ({
    id: client.id,
    code: client.code,
    name: client.name,
    isActive: client.isActive,
    offerCount: client._count.offers,
  }));
}
