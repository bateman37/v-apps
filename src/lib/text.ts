/** Normalización de texto compartida por los formularios de administración. */

/** Quita espacios exteriores y colapsa los interiores. */
export function normalizeSpaces(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

/**
 * Clave de unicidad de nombre: sin espacios exteriores, espacios interiores
 * colapsados y en minúsculas. Se almacena en `Client.nameNormalized` para
 * que PostgreSQL impida duplicados exactos mediante una restricción única.
 */
export function normalizeNameKey(value: string): string {
  return normalizeSpaces(value).toLocaleLowerCase("es-ES");
}

/**
 * Normalización predecible de un código técnico de catálogo: mayúsculas, sin
 * espacios exteriores y con los espacios interiores convertidos en `_`.
 * Solo se aplica a códigos nuevos: los códigos ya aprobados no se renombran
 * nunca desde la interfaz.
 */
export function normalizeCode(value: string): string {
  return normalizeSpaces(value).toUpperCase().replace(/\s/g, "_");
}

/** Códigos técnicos admitidos: letras A–Z, dígitos, `_` y `-`. */
export const CODE_PATTERN = /^[A-Z0-9][A-Z0-9_-]*$/;

/** Recorta un texto para mostrarlo en una celda de tabla. */
export function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, maxLength - 1).trimEnd()}…`;
}
