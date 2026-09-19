"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { toSafeErrorMessage } from "@/lib/db/errors";
import { checkField, readString, requiredText, type FieldErrors } from "@/lib/validation";
import { diffChanges, recordAudit } from "@/modules/audit/audit";
import {
  adminError,
  adminSuccess,
  type AdminActionState,
} from "@/modules/admin/action-state";

/**
 * Administración del maestro común de personas.
 *
 * Una persona puede estar habilitada como comercial, como Project Manager,
 * como ambas o como ninguna. No se modelan más roles de negocio y no se
 * guardan email, teléfono, departamento ni credenciales.
 *
 * Nunca se elimina físicamente una persona: solo se desactiva. Las personas
 * inactivas dejan de ofrecerse en ofertas nuevas y se conservan en las
 * existentes.
 */

const PERSON_NAME_MAX_LENGTH = 200;

function readCheckbox(formData: FormData, key: string): boolean {
  return readString(formData, key) === "on" || readString(formData, key) === "true";
}

export async function createPersonAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const errors: FieldErrors = {};
  const name = checkField(
    errors,
    "name",
    requiredText("El nombre de la persona", PERSON_NAME_MAX_LENGTH),
    readString(formData, "name"),
  );

  if (name === undefined) {
    return adminError(errors);
  }

  const canBeCommercial = readCheckbox(formData, "canBeCommercial");
  const canBeProjectManager = readCheckbox(formData, "canBeProjectManager");

  try {
    const created = await prisma.$transaction(async (tx) => {
      const person = await tx.person.create({
        data: { name, canBeCommercial, canBeProjectManager },
        select: { id: true, name: true },
      });
      await recordAudit(tx, {
        entityType: "Person",
        entityId: person.id,
        action: "CREATE",
        changes: { name, canBeCommercial, canBeProjectManager, isActive: true },
      });
      return person;
    });

    revalidatePath("/admin/people");
    return adminSuccess(`Persona «${created.name}» creada.`, created.id);
  } catch (error) {
    return adminError({ _form: toSafeErrorMessage(error) });
  }
}

export async function updatePersonAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const id = readString(formData, "id");
  if (!id) {
    return adminError({ _form: "No se ha podido identificar la persona." });
  }

  const errors: FieldErrors = {};
  const name = checkField(
    errors,
    "name",
    requiredText("El nombre de la persona", PERSON_NAME_MAX_LENGTH),
    readString(formData, "name"),
  );

  if (name === undefined) {
    return adminError(errors, id);
  }

  const canBeCommercial = readCheckbox(formData, "canBeCommercial");
  const canBeProjectManager = readCheckbox(formData, "canBeProjectManager");

  try {
    const result = await prisma.$transaction(async (tx) => {
      const current = await tx.person.findUnique({
        where: { id },
        select: { name: true, canBeCommercial: true, canBeProjectManager: true },
      });
      if (!current) {
        return null;
      }

      const changes = diffChanges(
        { ...current },
        { name, canBeCommercial, canBeProjectManager },
      );

      if (Object.keys(changes).length === 0) {
        return { changed: false as const };
      }

      await tx.person.update({
        where: { id },
        data: { name, canBeCommercial, canBeProjectManager },
      });
      await recordAudit(tx, {
        entityType: "Person",
        entityId: id,
        action: "UPDATE",
        changes,
      });
      return { changed: true as const };
    });

    if (result === null) {
      return adminError({ _form: "La persona ya no existe." }, id);
    }

    revalidatePath("/admin/people");
    return adminSuccess(
      result.changed ? "Persona actualizada." : "No había cambios que guardar.",
      id,
    );
  } catch (error) {
    return adminError({ _form: toSafeErrorMessage(error) }, id);
  }
}

export async function setPersonActiveAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const id = readString(formData, "id");
  const isActive = readString(formData, "isActive") === "true";

  if (!id) {
    return adminError({ _form: "No se ha podido identificar la persona." });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const current = await tx.person.findUnique({
        where: { id },
        select: { name: true, isActive: true },
      });
      if (!current) {
        return null;
      }
      if (current.isActive === isActive) {
        return { name: current.name, changed: false as const };
      }

      await tx.person.update({ where: { id }, data: { isActive } });
      await recordAudit(tx, {
        entityType: "Person",
        entityId: id,
        action: isActive ? "ACTIVATE" : "DEACTIVATE",
        changes: { isActive: { antes: current.isActive, despues: isActive } },
      });
      return { name: current.name, changed: true as const };
    });

    if (result === null) {
      return adminError({ _form: "La persona ya no existe." }, id);
    }

    revalidatePath("/admin/people");
    return adminSuccess(
      isActive
        ? `Persona «${result.name}» activada.`
        : `Persona «${result.name}» desactivada. Sus ofertas históricas se conservan.`,
      id,
    );
  } catch (error) {
    return adminError({ _form: toSafeErrorMessage(error) }, id);
  }
}
