"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { isUniqueConstraintError, toSafeErrorMessage } from "@/lib/db/errors";
import { readString } from "@/lib/validation";
import { recordAudit } from "@/modules/audit/audit";
import {
  adminError,
  adminSuccess,
  type AdminActionState,
} from "@/modules/admin/action-state";
import { checkUsername, normalizeUsername, type Role } from "@/modules/auth/identity";
import {
  checkPasswordStrength,
  generateTemporaryPassword,
  hashPassword,
} from "@/modules/auth/password";
import { requireAdmin } from "@/modules/auth/session";
import { revokeAllSessionsOf } from "@/modules/auth/session";

/**
 * Administración de usuarios (DEC-055): solo un `ADMIN` puede llegar aquí
 * (impuesto también en `requireAdmin`, no solo ocultando el enlace).
 *
 * Nunca se muestran hashes ni contraseñas existentes. La contraseña
 * temporal solo se conoce en el resultado inmediato de la acción que la
 * establece: no se guarda para poder volver a mostrarla.
 */

const DUPLICATE_USERNAME = "Ya existe un usuario con ese nombre.";

function isValidRole(value: string): value is Role {
  return value === "ADMIN" || value === "USER";
}

export async function createUserAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const admin = await requireAdmin();

  const personId = readString(formData, "personId");
  const usernameRaw = readString(formData, "username");
  const roleRaw = readString(formData, "role");
  const password = readString(formData, "password");

  const username = normalizeUsername(usernameRaw);
  const usernameProblem = checkUsername(username);
  const errors: Record<string, string> = {};

  if (!personId) {
    errors.personId = "Selecciona una persona.";
  }
  if (usernameProblem) {
    errors.username = usernameProblem;
  }
  if (!isValidRole(roleRaw)) {
    errors.role = "Selecciona un rol válido.";
  }
  const passwordProblem = checkPasswordStrength(password);
  if (passwordProblem) {
    errors.password = passwordProblem;
  }

  if (Object.keys(errors).length > 0) {
    return adminError(errors);
  }

  try {
    const passwordHash = await hashPassword(password);
    const created = await prisma.$transaction(async (tx) => {
      const person = await tx.person.findUnique({
        where: { id: personId },
        select: { id: true, name: true, isActive: true },
      });
      if (!person || !person.isActive) {
        throw new Error("PERSON_NOT_AVAILABLE");
      }

      const user = await tx.user.create({
        data: {
          personId,
          username,
          passwordHash,
          role: roleRaw as Role,
          mustChangePassword: true,
        },
        select: { id: true, username: true },
      });

      await recordAudit(tx, {
        entityType: "User",
        entityId: user.id,
        action: "CREATE",
        actorId: admin.id,
        changes: { username: user.username, role: roleRaw, personName: person.name },
      });

      return user;
    });

    revalidatePath("/admin/users");
    return adminSuccess(
      `Usuario «${created.username}» creado. Comparte la contraseña temporal por un canal seguro.`,
    );
  } catch (error) {
    if (isUniqueConstraintError(error, "username")) {
      return adminError({ username: DUPLICATE_USERNAME });
    }
    if (isUniqueConstraintError(error, "person_id")) {
      return adminError({ personId: "Esa persona ya tiene un usuario asociado." });
    }
    if (error instanceof Error && error.message === "PERSON_NOT_AVAILABLE") {
      return adminError({ personId: "La persona seleccionada ya no está disponible." });
    }
    return adminError({ _form: toSafeErrorMessage(error) });
  }
}

export async function setUserActiveAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const admin = await requireAdmin();
  const id = readString(formData, "id");
  const isActive = readString(formData, "isActive") === "true";

  if (!id) {
    return adminError({ _form: "No se ha podido identificar el usuario." });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const current = await tx.user.findUnique({
        where: { id },
        select: { username: true, isActive: true },
      });
      if (!current) {
        return null;
      }
      if (current.isActive === isActive) {
        return { username: current.username, changed: false as const };
      }

      await tx.user.update({ where: { id }, data: { isActive } });
      await recordAudit(tx, {
        entityType: "User",
        entityId: id,
        action: isActive ? "ACTIVATE" : "DEACTIVATE",
        actorId: admin.id,
        changes: { isActive: { antes: current.isActive, despues: isActive } },
      });
      return { username: current.username, changed: true as const };
    });

    if (result === null) {
      return adminError({ _form: "El usuario ya no existe." }, id);
    }

    if (!isActive) {
      // Una cuenta desactivada deja de tener sesiones válidas de inmediato.
      await revokeAllSessionsOf(id);
    }

    revalidatePath("/admin/users");
    return adminSuccess(
      isActive
        ? `Usuario «${result.username}» activado.`
        : `Usuario «${result.username}» desactivado. Sus sesiones abiertas se han cerrado.`,
      id,
    );
  } catch (error) {
    return adminError({ _form: toSafeErrorMessage(error) }, id);
  }
}

export async function setUserRoleAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const admin = await requireAdmin();
  const id = readString(formData, "id");
  const roleRaw = readString(formData, "role");

  if (!id || !isValidRole(roleRaw)) {
    return adminError({ _form: "Datos no válidos." }, id);
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const current = await tx.user.findUnique({
        where: { id },
        select: { username: true, role: true },
      });
      if (!current) {
        return null;
      }
      if (current.role === roleRaw) {
        return { username: current.username, changed: false as const };
      }

      await tx.user.update({ where: { id }, data: { role: roleRaw as Role } });
      await recordAudit(tx, {
        entityType: "User",
        entityId: id,
        action: "UPDATE",
        actorId: admin.id,
        changes: { role: { antes: current.role, despues: roleRaw } },
      });
      return { username: current.username, changed: true as const };
    });

    if (result === null) {
      return adminError({ _form: "El usuario ya no existe." }, id);
    }

    revalidatePath("/admin/users");
    return adminSuccess(
      result.changed
        ? `Rol de «${result.username}» actualizado.`
        : "No había cambios que guardar.",
      id,
    );
  } catch (error) {
    return adminError({ _form: toSafeErrorMessage(error) }, id);
  }
}

export async function resetUserPasswordAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const admin = await requireAdmin();
  const id = readString(formData, "id");

  if (!id) {
    return adminError({ _form: "No se ha podido identificar el usuario." });
  }

  try {
    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await hashPassword(temporaryPassword);

    const result = await prisma.$transaction(async (tx) => {
      const current = await tx.user.findUnique({ where: { id }, select: { username: true } });
      if (!current) {
        return null;
      }
      await tx.user.update({
        where: { id },
        data: { passwordHash, mustChangePassword: true },
      });
      await recordAudit(tx, {
        entityType: "User",
        entityId: id,
        action: "PASSWORD_RESET",
        actorId: admin.id,
        // Nunca se guarda la contraseña, ni siquiera la temporal.
        changes: { contrasena: { antes: "(oculta)", despues: "(oculta, temporal)" } },
      });
      return { username: current.username };
    });

    if (result === null) {
      return adminError({ _form: "El usuario ya no existe." }, id);
    }

    // La contraseña temporal se invalida en el resto de sesiones: solo la
    // acción que la genera puede mostrarla, y solo una vez.
    await revokeAllSessionsOf(id);

    revalidatePath("/admin/users");
    return adminSuccess(
      `Nueva contraseña temporal para «${result.username}»: ${temporaryPassword}\n` +
        "Compártela por un canal seguro. No volverá a mostrarse.",
      id,
    );
  } catch (error) {
    return adminError({ _form: toSafeErrorMessage(error) }, id);
  }
}
