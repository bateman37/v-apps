/**
 * Formateo y serialización explícita de fechas y decimales.
 *
 * Reglas deliberadas:
 *
 * - Las fechas de negocio (`@db.Date`) viajan siempre como cadena
 *   `YYYY-MM-DD` entre servidor y cliente. Nunca se serializa un `Date` a
 *   través de la frontera de componentes: evita desplazamientos de día por
 *   zona horaria.
 * - Los decimales viajan como cadena con punto decimal (`"1234.50"`). Nunca
 *   se convierten a `number` para almacenarlos o sumarlos.
 */

/** Convierte una fecha de PostgreSQL (`@db.Date`) a `YYYY-MM-DD`. */
export function toDateInputValue(value: Date | null | undefined): string {
  if (!value) {
    return "";
  }
  const year = String(value.getUTCFullYear()).padStart(4, "0");
  const month = String(value.getUTCMonth() + 1).padStart(2, "0");
  const day = String(value.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Convierte `YYYY-MM-DD` en el `Date` UTC que espera una columna `date`. */
export function fromDateInputValue(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

/** Muestra `YYYY-MM-DD` como `DD/MM/AAAA`, sin depender de la zona horaria. */
export function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) {
    return "—";
  }
  return `${day}/${month}/${year}`;
}

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("es-ES", {
  dateStyle: "short",
  timeStyle: "short",
});

/** Muestra un instante completo (histórico de estados, auditoría). */
export function formatDateTime(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return DATE_TIME_FORMATTER.format(date);
}

const CURRENCY_FORMATTER = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Formato monetario español en euros a partir de un decimal en cadena. */
export function formatCurrencyEur(value: string): string {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return "—";
  }
  return CURRENCY_FORMATTER.format(parsed);
}

const DAYS_FORMATTER = new Intl.NumberFormat("es-ES", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** Formato español de jornadas (sin unidad monetaria). */
export function formatDays(value: string | null | undefined): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return "—";
  }
  return DAYS_FORMATTER.format(parsed);
}
