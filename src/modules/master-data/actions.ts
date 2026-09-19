"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { isUniqueConstraintError, toSafeErrorMessage } from "@/lib/db/errors";
import { CODE_PATTERN, normalizeCode } from "@/lib/text";
import {
  checkField,
  readString,
  requiredText,
  type FieldErrors,
} from "@/lib/validation";
import { diffChanges, recordAudit } from "@/modules/audit/audit";
import {
  adminError,
  adminSuccess,
  type AdminActionState,
} from "@/modules/admin/action-state";
import {
  catalogDelegate,
  CATALOG_LABELS,
  isCatalogKey,
  type CatalogKey,
} from "@/modules/master-data/catalogs";

/**
 * Administración de los ocho catálogos del Gestor de Ofertas.
 *
 * Reglas comunes:
 *
 * - Nunca hay borrado físico: solo activación y desactivación (DEC-017).
 * - El `code` es obligatorio, estable y único: se fija en el alta y no vuelve
 *   a modificarse desde la interfaz, para no romper referencias existentes.
 * - `name`, `sortOrder` e `isActive` sí son editables.
 */

const CATALOG_NAME_MAX_LENGTH = 200;
const CATALOG_CODE_MAX_LENGTH = 40;

const codeSchema = z
  .string()
  .transform(normalizeCode)
  .refine((value) => value.length > 0, { message: "El código es obligatorio." })
  .refine((value) => value.length <= CATALOG_CODE_MAX_LENGTH, {
    message: `El código no puede superar ${CATALOG_CODE_MAX_LENGTH} caracteres.`,
  })
  .refine((value) => CODE_PATTERN.test(value), {
    message:
      "El código solo admite letras sin acentos, dígitos, guion y guion bajo, y debe empezar por letra o dígito.",
  });

const sortOrderSchema = z
  .string()
  .transform((value) => value.trim())
  .refine((value) => /^\d{1,4}$/.test(value), {
    message: "El orden debe ser un número entero entre 0 y 9999.",
  })
  .transform((value) => Number.parseInt(value, 10));

function resolveCatalog(formData: FormData): CatalogKey | null {
  const raw = readString(formData, "catalog");
  return isCatalogKey(raw) ? raw : null;
}

export async function createCatalogRecordAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const catalog = resolveCatalog(formData);
  if (!catalog) {
    return adminError({ _form: "Catálogo no reconocido." });
  }

  const errors: FieldErrors = {};
  const code = checkField(errors, "code", codeSchema, readString(formData, "code"));
  const name = checkField(
    errors,
    "name",
    requiredText("El nombre", CATALOG_NAME_MAX_LENGTH),
    readString(formData, "name"),
  );
  const sortOrder = checkField(
    errors,
    "sortOrder",
    sortOrderSchema,
    readString(formData, "sortOrder") || "0",
  );

  if (code === undefined || name === undefined || sortOrder === undefined) {
    return adminError(errors, catalog);
  }

  try {
    const created = await prisma.$transaction(async (tx) => {
      const record = await catalogDelegate(tx, catalog).create({
        data: { code, name, sortOrder },
        select: { id: true },
      });
      await recordAudit(tx, {
        entityType: "MasterDataRecord",
        entityId: record.id,
        action: "CREATE",
        changes: { catalogo: catalog, code, name, sortOrder, isActive: true },
      });
      return record;
    });

    revalidatePath("/admin/master-data");
    return adminSuccess(
      `Registro «${name}» creado en ${CATALOG_LABELS[catalog].plural}.`,
      created.id,
    );
  } catch (error) {
    if (isUniqueConstraintError(error, "code")) {
      return adminError(
        { code: "Ya existe un registro con ese código en este catálogo." },
        catalog,
      );
    }
    return adminError({ _form: toSafeErrorMessage(error) }, catalog);
  }
}

export async function updateCatalogRecordAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const catalog = resolveCatalog(formData);
  const id = readString(formData, "id");

  if (!catalog || !id) {
    return adminError({ _form: "No se ha podido identificar el registro." });
  }

  const errors: FieldErrors = {};
  const name = checkField(
    errors,
    "name",
    requiredText("El nombre", CATALOG_NAME_MAX_LENGTH),
    readString(formData, "name"),
  );
  const sortOrder = checkField(
    errors,
    "sortOrder",
    sortOrderSchema,
    readString(formData, "sortOrder") || "0",
  );

  if (name === undefined || sortOrder === undefined) {
    return adminError(errors, id);
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const delegate = catalogDelegate(tx, catalog);
      const current = await delegate.findUnique({
        where: { id },
        select: { code: true, name: true, sortOrder: true, isActive: true },
      });
      if (!current) {
        return null;
      }

      // El código técnico nunca se modifica desde la interfaz.
      const changes = diffChanges(
        { name: current.name, sortOrder: current.sortOrder },
        { name, sortOrder },
      );

      if (Object.keys(changes).length === 0) {
        return { changed: false as const };
      }

      await delegate.update({ where: { id }, data: { name, sortOrder } });
      await recordAudit(tx, {
        entityType: "MasterDataRecord",
        entityId: id,
        action: "UPDATE",
        changes: { catalogo: catalog, code: current.code, ...changes },
      });
      return { changed: true as const };
    });

    if (result === null) {
      return adminError({ _form: "El registro ya no existe." }, id);
    }

    revalidatePath("/admin/master-data");
    return adminSuccess(
      result.changed ? "Registro actualizado." : "No había cambios que guardar.",
      id,
    );
  } catch (error) {
    return adminError({ _form: toSafeErrorMessage(error) }, id);
  }
}

export async function setCatalogRecordActiveAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const catalog = resolveCatalog(formData);
  const id = readString(formData, "id");
  const isActive = readString(formData, "isActive") === "true";

  if (!catalog || !id) {
    return adminError({ _form: "No se ha podido identificar el registro." });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const delegate = catalogDelegate(tx, catalog);
      const current = await delegate.findUnique({
        where: { id },
        select: { code: true, name: true, sortOrder: true, isActive: true },
      });
      if (!current) {
        return null;
      }
      if (current.isActive === isActive) {
        return { name: current.name, changed: false as const };
      }

      await delegate.update({ where: { id }, data: { isActive } });
      await recordAudit(tx, {
        entityType: "MasterDataRecord",
        entityId: id,
        action: isActive ? "ACTIVATE" : "DEACTIVATE",
        changes: {
          catalogo: catalog,
          code: current.code,
          isActive: { antes: current.isActive, despues: isActive },
        },
      });
      return { name: current.name, changed: true as const };
    });

    if (result === null) {
      return adminError({ _form: "El registro ya no existe." }, id);
    }

    revalidatePath("/admin/master-data");
    return adminSuccess(
      isActive
        ? `«${result.name}» activado.`
        : `«${result.name}» desactivado. Los datos históricos que lo usan se conservan.`,
      id,
    );
  } catch (error) {
    return adminError({ _form: toSafeErrorMessage(error) }, id);
  }
}
