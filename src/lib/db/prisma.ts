import { PrismaClient } from "@prisma/client";

/**
 * Cliente Prisma reutilizable.
 *
 * En desarrollo, Next.js recarga los módulos en cada cambio (hot reload),
 * lo que crearía una nueva instancia de PrismaClient —y una nueva conexión—
 * en cada recarga si no se reutiliza la existente. Guardamos la instancia
 * en `globalThis` para evitarlo. En producción no aplica: se crea una única
 * instancia por proceso.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
