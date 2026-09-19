import { Prisma } from "@prisma/client";

/**
 * Traduce un error de PostgreSQL/Prisma a un mensaje en español apto para la
 * interfaz.
 *
 * Nunca se devuelve el mensaje original: podría contener la cadena de
 * conexión, el SQL ejecutado, nombres de columnas internas o una traza.
 * El detalle técnico se registra únicamente en la consola del servidor de
 * desarrollo. Ver docs/architecture/SECURITY.md.
 */
export function toSafeErrorMessage(error: unknown): string {
  logForDeveloper(error);

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002":
        return "Ya existe un registro con ese valor único. Revisa los datos introducidos.";
      case "P2003":
        return "La operación referencia un registro que ya no existe. Recarga la página e inténtalo de nuevo.";
      case "P2025":
        return "El registro que intentas modificar ya no existe. Recarga la página.";
      default:
        return "No se ha podido completar la operación en la base de datos.";
    }
  }

  if (
    error instanceof Prisma.PrismaClientInitializationError ||
    error instanceof Prisma.PrismaClientRustPanicError
  ) {
    return "No se ha podido conectar con la base de datos. Revisa que PostgreSQL esté en marcha.";
  }

  return "Se ha producido un error inesperado. Inténtalo de nuevo.";
}

/** Indica si el error corresponde a una violación de restricción única. */
export function isUniqueConstraintError(error: unknown, target?: string): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return false;
  }
  if (error.code !== "P2002") {
    return false;
  }
  if (!target) {
    return true;
  }
  const meta = error.meta as { target?: string[] | string } | undefined;
  const rawTarget = meta?.target;
  const targets = Array.isArray(rawTarget)
    ? rawTarget
    : typeof rawTarget === "string"
      ? [rawTarget]
      : [];
  return targets.some((value) => value.includes(target));
}

function logForDeveloper(error: unknown): void {
  if (process.env.NODE_ENV !== "production") {
    console.error("[v-apps] Error de base de datos:", error);
  }
}
