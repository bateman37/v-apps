/**
 * Piezas puras de identidad y autorización.
 *
 * Este módulo **no** importa Prisma, cookies ni nada de Next.js: recibe los
 * datos que necesita y decide. Así las reglas de acceso —que son la parte
 * delicada— se pueden probar sin base de datos y se reutilizan tanto en las
 * consultas como en las mutaciones.
 */

/** Roles de acceso aprobados en esta fase (DEC-055). */
export type Role = "ADMIN" | "USER";

/** Usuario autenticado tal y como lo ve el resto de la aplicación. */
export type AuthenticatedUser = {
  id: string;
  username: string;
  role: Role;
  personId: string;
  personName: string;
  canBeCommercial: boolean;
  canBeProjectManager: boolean;
  mustChangePassword: boolean;
};

/** Duración de una sesión. Razonable para una jornada de trabajo. */
export const SESSION_DURATION_MS = 12 * 60 * 60 * 1000;

/** Longitud máxima admitida en el campo de usuario del formulario. */
export const MAX_USERNAME_LENGTH = 60;

/**
 * Normalización documentada del nombre de usuario: se recortan los espacios
 * exteriores y se pasa a minúsculas. Es la forma que se guarda y sobre la que
 * actúa la restricción única, de modo que `Dennis`, `dennis` y ` dennis `
 * son la misma cuenta y no pueden coexistir.
 */
export function normalizeUsername(value: string): string {
  return value.trim().toLocaleLowerCase("en-US");
}

/** Caracteres admitidos en un nombre de usuario ya normalizado. */
export const USERNAME_PATTERN = /^[a-z0-9][a-z0-9._-]*$/;

/** Valida un nombre de usuario ya normalizado; `null` si es correcto. */
export function checkUsername(normalized: string): string | null {
  if (normalized.length === 0) {
    return "El nombre de usuario es obligatorio.";
  }
  if (normalized.length > MAX_USERNAME_LENGTH) {
    return `El nombre de usuario no puede superar ${MAX_USERNAME_LENGTH} caracteres.`;
  }
  if (!USERNAME_PATTERN.test(normalized)) {
    return "El nombre de usuario solo admite letras, números, punto, guion y guion bajo, y debe empezar por letra o número.";
  }
  return null;
}

/** Indica si una sesión sigue siendo válida en el instante indicado. */
export function isSessionValid(
  session: { expiresAt: Date } | null,
  now: Date = new Date(),
): boolean {
  if (!session) {
    return false;
  }
  return session.expiresAt.getTime() > now.getTime();
}

export function isAdmin(user: { role: Role } | null | undefined): boolean {
  return user?.role === "ADMIN";
}

/** Datos de asignación de una oferta necesarios para decidir el acceso. */
export type OfferAccessSubject = {
  createdById: string | null;
  commercialId: string;
  projectManagerId: string;
};

/**
 * Regla de visibilidad y edición de una oferta (DEC-055).
 *
 * - Un `ADMIN` ve y modifica todas las ofertas.
 * - Un `USER` accede a una oferta si es su creador, su comercial asignado o
 *   su Project Manager asignado.
 * - Las ofertas anteriores al login no tienen creador: un `USER` solo las ve
 *   si le corresponden por comercial o por PM.
 *
 * La misma función se aplica en el listado, la ficha, las mutaciones, la
 * exportación y las descargas: ocultar un botón nunca es autorización.
 */
export function canAccessOffer(
  user: AuthenticatedUser,
  offer: OfferAccessSubject,
): boolean {
  if (isAdmin(user)) {
    return true;
  }
  if (offer.createdById !== null && offer.createdById === user.id) {
    return true;
  }
  return (
    offer.commercialId === user.personId ||
    offer.projectManagerId === user.personId
  );
}

/**
 * Códigos técnicos de los estados que generan una revisión pendiente y a quién
 * se la generan (bloque 8). No se inventa un circuito paralelo de
 * aprobaciones: la bandeja se deriva del estado actual y de la asignación.
 */
export const PENDING_PM_REVIEW_STATUS_CODE = "TO_BE_ASSESSED_PM";
export const PENDING_SALES_REVIEW_STATUS_CODE = "DELIVERED_TO_SALES";

/** Código técnico del estado que obliga a informar el pedido de Navision. */
export const ACCEPTED_STATUS_CODE = "ACCEPTED";
