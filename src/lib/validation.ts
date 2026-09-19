import { z } from "zod";
import { parseDecimal, type ParseDecimalOptions } from "@/lib/decimal";
import { normalizeSpaces } from "@/lib/text";

/**
 * Primitivas de validación compartidas por todos los formularios.
 *
 * Se usa `zod` (dependencia pequeña y mantenida) como motor de validación de
 * cada campo, y un recolector explícito de errores por campo, para que la
 * interfaz pueda mostrar el mensaje junto al campo correspondiente. Las
 * validaciones de servidor son siempre la autoridad: la validación del
 * navegador es solo una ayuda.
 */

export type FieldErrors = Record<string, string>;

/**
 * Valida un campo contra un esquema y, si falla, anota el primer mensaje en
 * `errors` bajo la clave indicada. Devuelve `undefined` cuando hay error, de
 * modo que quien llama puede seguir validando el resto de campos y presentar
 * todos los problemas de una vez.
 */
export function checkField<T>(
  errors: FieldErrors,
  key: string,
  schema: z.ZodType<T>,
  raw: unknown,
): T | undefined {
  const result = schema.safeParse(raw);
  if (!result.success) {
    errors[key] = result.error.issues[0]?.message ?? "Valor no válido.";
    return undefined;
  }
  return result.data;
}

/** Texto obligatorio, con espacios normalizados. */
export function requiredText(label: string, maxLength: number) {
  return z
    .string()
    .transform(normalizeSpaces)
    .refine((value) => value.length > 0, {
      message: `${label} es obligatorio.`,
    })
    .refine((value) => value.length <= maxLength, {
      message: `${label} no puede superar ${maxLength} caracteres.`,
    });
}

/** Texto opcional: cadena vacía equivale a “sin valor” (`null`). */
export function optionalText(label: string, maxLength: number) {
  return z
    .string()
    .transform((value) => value.trim())
    .refine((value) => value.length <= maxLength, {
      message: `${label} no puede superar ${maxLength} caracteres.`,
    })
    .transform((value) => (value.length === 0 ? null : value));
}

/** Identificador de maestro obligatorio (valor de un `<select>`). */
export function requiredSelection(label: string) {
  return z
    .string()
    .transform((value) => value.trim())
    .refine((value) => value.length > 0, {
      message: `${label} es obligatorio.`,
    });
}

/** Identificador de maestro opcional. */
export function optionalSelection() {
  return z
    .string()
    .transform((value) => value.trim())
    .transform((value) => (value.length === 0 ? null : value));
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function isRealDate(value: string): boolean {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    return false;
  }
  // Rechaza fechas normalizadas por el motor (por ejemplo, 2026-02-31).
  return date.toISOString().slice(0, 10) === value;
}

/** Fecha obligatoria en formato `YYYY-MM-DD`. */
export function requiredDate(label: string) {
  return z
    .string()
    .transform((value) => value.trim())
    .refine((value) => value.length > 0, {
      message: `${label} es obligatoria.`,
    })
    .refine((value) => ISO_DATE.test(value) && isRealDate(value), {
      message: `${label} no es una fecha válida.`,
    });
}

/** Fecha opcional en formato `YYYY-MM-DD`. */
export function optionalDate(label: string) {
  return z
    .string()
    .transform((value) => value.trim())
    .refine((value) => value === "" || (ISO_DATE.test(value) && isRealDate(value)), {
      message: `${label} no es una fecha válida.`,
    })
    .transform((value) => (value === "" ? null : value));
}

function decimalMessage(label: string, error: string): string {
  switch (error) {
    case "not-a-number":
      return `${label} debe ser un número. Usa coma o punto como separador decimal.`;
    case "too-many-decimals":
      return `${label} admite como máximo dos decimales.`;
    case "negative":
      return `${label} no puede ser negativo.`;
    case "too-large":
      return `${label} supera el valor máximo admitido.`;
    default:
      return `${label} no es válido.`;
  }
}

/**
 * Decimal obligatorio y no negativo. El cero es un valor válido siempre que
 * el campo se haya informado explícitamente (DEC-020: importe cero válido).
 */
export function requiredDecimal(label: string, options?: ParseDecimalOptions) {
  return z
    .string()
    .transform((value) => value.trim())
    .superRefine((value, ctx) => {
      const parsed = parseDecimal(value, options);
      if (!parsed.ok) {
        ctx.addIssue({
          code: "custom",
          message:
            parsed.error === "empty"
              ? `${label} es obligatorio. Indica un valor, incluso si es 0.`
              : decimalMessage(label, parsed.error),
        });
      }
    })
    .transform((value) => {
      const parsed = parseDecimal(value, options);
      return parsed.ok ? parsed.value : value;
    });
}

/** Decimal opcional y no negativo; vacío equivale a “sin valor” (`null`). */
export function optionalDecimal(label: string, options?: ParseDecimalOptions) {
  return z
    .string()
    .transform((value) => value.trim())
    .superRefine((value, ctx) => {
      if (value === "") {
        return;
      }
      const parsed = parseDecimal(value, options);
      if (!parsed.ok) {
        ctx.addIssue({ code: "custom", message: decimalMessage(label, parsed.error) });
      }
    })
    .transform((value) => {
      if (value === "") {
        return null;
      }
      const parsed = parseDecimal(value, options);
      return parsed.ok ? parsed.value : null;
    });
}

/** Lee un campo de un `FormData` como cadena, nunca como `File`. */
export function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
