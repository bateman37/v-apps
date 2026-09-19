"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { isUniqueConstraintError, toSafeErrorMessage } from "@/lib/db/errors";
import { normalizeNameKey } from "@/lib/text";
import { checkField, readString, requiredText, type FieldErrors } from "@/lib/validation";
import { recordAudit } from "@/modules/audit/audit";
import {
  adminError,
  adminSuccess,
  type AdminActionState,
} from "@/modules/admin/action-state";

/**
 * Administración del maestro de clientes.
 *
 * Nunca se elimina físicamente un cliente (DEC-017): solo se desactiva. Un
 * cliente inactivo deja de ofrecerse en ofertas nuevas, pero sigue visible en
 * las ofertas históricas que ya lo usan.
 */

const CLIENT_NAME_MAX_LENGTH = 200;
const DUPLICATE_MESSAGE = "Ya existe un cliente con ese nombre.";

export async function createClientAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const errors: FieldErrors = {};
  const name = checkField(
    errors,
    "name",
    requiredText("El nombre del cliente", CLIENT_NAME_MAX_LENGTH),
    readString(formData, "name"),
  );

  if (name === undefined) {
    return adminError(errors);
  }

  try {
    const created = await prisma.$transaction(async (tx) => {
      const client = await tx.client.create({
        data: { name, nameNormalized: normalizeNameKey(name) },
        select: { id: true, name: true },
      });
      await recordAudit(tx, {
        entityType: "Client",
        entityId: client.id,
        action: "CREATE",
        changes: { name: client.name, isActive: true },
      });
      return client;
    });

    revalidatePath("/admin/clients");
    return adminSuccess(`Cliente «${created.name}» creado.`, created.id);
  } catch (error) {
    if (isUniqueConstraintError(error, "name_normalized")) {
      return adminError({ name: DUPLICATE_MESSAGE });
    }
    return adminError({ _form: toSafeErrorMessage(error) });
  }
}

export async function updateClientAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const id = readString(formData, "id");
  if (!id) {
    return adminError({ _form: "No se ha podido identificar el cliente." });
  }

  const errors: FieldErrors = {};
  const name = checkField(
    errors,
    "name",
    requiredText("El nombre del cliente", CLIENT_NAME_MAX_LENGTH),
    readString(formData, "name"),
  );

  if (name === undefined) {
    return adminError(errors, id);
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const current = await tx.client.findUnique({
        where: { id },
        select: { name: true },
      });
      if (!current) {
        return null;
      }
      if (current.name === name) {
        return { name, unchanged: true as const };
      }

      await tx.client.update({
        where: { id },
        data: { name, nameNormalized: normalizeNameKey(name) },
      });
      await recordAudit(tx, {
        entityType: "Client",
        entityId: id,
        action: "UPDATE",
        changes: { name: { antes: current.name, despues: name } },
      });
      return { name, unchanged: false as const };
    });

    if (result === null) {
      return adminError({ _form: "El cliente ya no existe." }, id);
    }

    revalidatePath("/admin/clients");
    return adminSuccess(
      result.unchanged
        ? "No había cambios que guardar."
        : `Cliente actualizado a «${result.name}».`,
      id,
    );
  } catch (error) {
    if (isUniqueConstraintError(error, "name_normalized")) {
      return adminError({ name: DUPLICATE_MESSAGE }, id);
    }
    return adminError({ _form: toSafeErrorMessage(error) }, id);
  }
}

export async function setClientActiveAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const id = readString(formData, "id");
  const isActive = readString(formData, "isActive") === "true";

  if (!id) {
    return adminError({ _form: "No se ha podido identificar el cliente." });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const current = await tx.client.findUnique({
        where: { id },
        select: { name: true, isActive: true },
      });
      if (!current) {
        return null;
      }
      if (current.isActive === isActive) {
        return { name: current.name, changed: false as const };
      }

      await tx.client.update({ where: { id }, data: { isActive } });
      await recordAudit(tx, {
        entityType: "Client",
        entityId: id,
        action: isActive ? "ACTIVATE" : "DEACTIVATE",
        changes: { isActive: { antes: current.isActive, despues: isActive } },
      });
      return { name: current.name, changed: true as const };
    });

    if (result === null) {
      return adminError({ _form: "El cliente ya no existe." }, id);
    }

    revalidatePath("/admin/clients");
    return adminSuccess(
      isActive
        ? `Cliente «${result.name}» activado.`
        : `Cliente «${result.name}» desactivado. Sus ofertas históricas se conservan.`,
      id,
    );
  } catch (error) {
    return adminError({ _form: toSafeErrorMessage(error) }, id);
  }
}
