/**
 * Utilidades de decimal exacto.
 *
 * Importes y jornadas nunca se representan con `number` en punto flotante:
 * se leen como texto, se normalizan a una cadena canónica con punto decimal
 * y se suman con aritmética entera escalada (`BigInt`). Prisma recibe esa
 * cadena y PostgreSQL la almacena como `numeric`.
 */

export type DecimalParseError =
  | "empty"
  | "not-a-number"
  | "too-many-decimals"
  | "negative"
  | "too-large";

export type DecimalParseResult =
  | { ok: true; value: string }
  | { ok: false; error: DecimalParseError };

export type ParseDecimalOptions = {
  /** Número máximo de decimales admitidos (por defecto, 2). */
  scale?: number;
  /** Número máximo de dígitos enteros admitidos. */
  maxIntegerDigits?: number;
};

/**
 * Normaliza la entrada del usuario a una cadena decimal canónica.
 *
 * Separador decimal admitido, de forma predecible y documentada en la propia
 * interfaz: coma o punto. Si aparecen ambos, el último que aparece es el
 * separador decimal y el otro se interpreta como separador de millares.
 * Los espacios (incluido el espacio fino no separable) se descartan.
 *
 * Devuelve `{ ok: false, error: "empty" }` para una entrada vacía: es
 * responsabilidad de quien llama decidir si vacío es válido u obligatorio.
 */
export function parseDecimal(
  raw: string,
  options: ParseDecimalOptions = {},
): DecimalParseResult {
  const scale = options.scale ?? 2;
  const maxIntegerDigits = options.maxIntegerDigits ?? 12;

  const cleaned = raw.replace(/[\s  ]/g, "");
  if (cleaned === "") {
    return { ok: false, error: "empty" };
  }

  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");
  let normalized = cleaned;

  if (lastComma >= 0 && lastDot >= 0) {
    const thousandsSeparator = lastComma > lastDot ? "." : ",";
    const decimalSeparator = lastComma > lastDot ? "," : ".";
    normalized = cleaned.split(thousandsSeparator).join("");
    normalized = normalized.replace(decimalSeparator, ".");
  } else if (lastComma >= 0) {
    normalized = cleaned.replace(",", ".");
  }

  if (!/^[+-]?\d+(\.\d+)?$/.test(normalized)) {
    return { ok: false, error: "not-a-number" };
  }

  const isNegative = normalized.startsWith("-");
  const unsigned = normalized.replace(/^[+-]/, "");
  const [integerPart, fractionPart = ""] = unsigned.split(".");

  if (fractionPart.length > scale) {
    return { ok: false, error: "too-many-decimals" };
  }

  const trimmedInteger = integerPart.replace(/^0+(?=\d)/, "");
  if (trimmedInteger.length > maxIntegerDigits) {
    return { ok: false, error: "too-large" };
  }

  const paddedFraction = fractionPart.padEnd(scale, "0");
  const canonical =
    scale === 0 ? trimmedInteger : `${trimmedInteger}.${paddedFraction}`;

  // "-0,00" se considera cero, no un negativo.
  const isZero = /^0(\.0*)?$/.test(canonical);
  if (isNegative && !isZero) {
    return { ok: false, error: "negative" };
  }

  return { ok: true, value: canonical };
}

/** Suma exacta de decimales en cadena, con aritmética entera escalada. */
export function sumDecimalStrings(values: string[], scale = 2): string {
  const factor = 10n ** BigInt(scale);
  let total = 0n;

  for (const value of values) {
    const [integerPart, fractionPart = ""] = value.split(".");
    const sign = integerPart.startsWith("-") ? -1n : 1n;
    const unsignedInteger = integerPart.replace(/^[+-]/, "") || "0";
    const scaledFraction = BigInt(fractionPart.padEnd(scale, "0").slice(0, scale) || "0");
    total += sign * (BigInt(unsignedInteger) * factor + scaledFraction);
  }

  const negative = total < 0n;
  const absolute = negative ? -total : total;
  const integer = absolute / factor;
  const fraction = absolute % factor;

  if (scale === 0) {
    return `${negative ? "-" : ""}${integer}`;
  }

  return `${negative ? "-" : ""}${integer}.${String(fraction).padStart(scale, "0")}`;
}
