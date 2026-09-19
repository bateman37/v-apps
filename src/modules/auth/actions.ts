"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { toSafeErrorMessage } from "@/lib/db/errors";
import { readString } from "@/lib/validation";
import { recordAudit } from "@/modules/audit/audit";
import {
  authError,
  INITIAL_AUTH_FORM_STATE,
  type AuthFormState,
} from "@/modules/auth/action-state";
import {
  MAX_USERNAME_LENGTH,
  normalizeUsername,
} from "@/modules/auth/identity";
import {
  checkPasswordStrength,
  hashPassword,
  verifyPassword,
} from "@/modules/auth/password";
import {
  createSession,
  destroyCurrentSession,
  findUserForLogin,
  purgeExpiredSessions,
  requireUser,
  revokeAllSessionsOf,
} from "@/modules/auth/session";

/**
 * Casos de uso de sesión: iniciar sesión, cerrarla y cambiar la contraseña
 * propia.
 *
 * Reglas de seguridad aplicadas aquí:
 *
 * - El mensaje de error del login es **siempre el mismo**, tanto si el usuario
 *   no existe como si la contraseña es incorrecta o la cuenta está
 *   desactivada: no se revela qué cuentas existen.
 * - Cuando el usuario no existe se verifica igualmente una contraseña contra
 *   un hash de descarte, para que el tiempo de respuesta no delate su
 *   existencia.
 * - Ni la contraseña ni el hash se escriben nunca en la auditoría ni en los
 *   logs; solo se registra el hecho del acceso.
 */

/** Mensaje único de credenciales, deliberadamente genérico. */
const GENERIC_LOGIN_ERROR =
  "Usuario o contraseña incorrectos, o la cuenta no está activa.";

/**
 * Hash de descarte usado para igualar el tiempo de respuesta cuando el usuario
 * no existe. No corresponde a ninguna cuenta ni a ninguna contraseña real: es
 * el hash de un valor aleatorio generado en el arranque del proceso.
 */
let decoyHashPromise: Promise<string> | null = null;

function decoyHash(): Promise<string> {
  decoyHashPromise ??= hashPassword(
    `sin-cuenta-${Math.random()}-${Date.now()}`,
  );
  return decoyHashPromise;
}

export async function loginAction(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const username = normalizeUsername(
    readString(formData, "username").slice(0, MAX_USERNAME_LENGTH + 1),
  );
  const password = readString(formData, "password");
  const redirectToRaw = readString(formData, "redirectTo");

  if (username === "" || password === "") {
    return authError({ _form: "Indica el usuario y la contraseña." });
  }

  let destination: string;

  try {
    const user = await findUserForLogin(username);

    if (!user) {
      // Coste equivalente al de una verificación real.
      await verifyPassword(password, await decoyHash());
      return authError({ _form: GENERIC_LOGIN_ERROR });
    }

    const passwordMatches = await verifyPassword(password, user.passwordHash);

    if (!passwordMatches || !user.isActive) {
      return authError({ _form: GENERIC_LOGIN_ERROR });
    }

    await purgeExpiredSessions();
    await createSession(user.id);

    await prisma.$transaction(async (tx) => {
      await recordAudit(tx, {
        entityType: "User",
        entityId: user.id,
        action: "LOGIN",
        actorId: user.id,
      });
    });

    destination = user.mustChangePassword
      ? "/cuenta/contrasena?motivo=inicial"
      : safeRedirectTarget(redirectToRaw);
  } catch (error) {
    return authError({ _form: toSafeErrorMessage(error) });
  }

  redirect(destination);
}

/**
 * Solo se admite como destino una ruta interna absoluta. Se descarta cualquier
 * URL con esquema o con `//`, que podría llevar a un dominio externo.
 */
function safeRedirectTarget(value: string): string {
  if (
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.includes("\\")
  ) {
    return value;
  }
  return "/offers";
}

export async function logoutAction(): Promise<void> {
  await destroyCurrentSession();
  redirect("/login?motivo=salida");
}

export async function changeOwnPasswordAction(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const user = await requireUser();

  const currentPassword = readString(formData, "currentPassword");
  const newPassword = readString(formData, "newPassword");
  const repeatPassword = readString(formData, "repeatPassword");

  if (currentPassword === "") {
    return authError({ currentPassword: "Indica tu contraseña actual." });
  }
  if (newPassword !== repeatPassword) {
    return authError({ repeatPassword: "Las dos contraseñas no coinciden." });
  }

  const strengthError = checkPasswordStrength(newPassword);
  if (strengthError) {
    return authError({ newPassword: strengthError });
  }
  if (newPassword === currentPassword) {
    return authError({
      newPassword: "La contraseña nueva debe ser distinta de la actual.",
    });
  }

  try {
    const record = await prisma.user.findUnique({
      where: { id: user.id },
      select: { passwordHash: true, isActive: true },
    });

    if (!record || !record.isActive) {
      return authError({ _form: "La cuenta ya no está disponible." });
    }
    if (!(await verifyPassword(currentPassword, record.passwordHash))) {
      return authError({ currentPassword: "La contraseña actual no es correcta." });
    }

    const passwordHash = await hashPassword(newPassword);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { passwordHash, mustChangePassword: false },
      });
      await recordAudit(tx, {
        entityType: "User",
        entityId: user.id,
        action: "PASSWORD_CHANGED",
        actorId: user.id,
        // Nunca se registra la contraseña ni su hash: solo el hecho.
        changes: { contrasena: { antes: "(oculta)", despues: "(oculta)" } },
      });
    });

    // Cerrar el resto de sesiones tras cambiar la contraseña, y volver a abrir
    // la actual, evita que una sesión robada siga viva.
    await revokeAllSessionsOf(user.id);
    await createSession(user.id);
  } catch (error) {
    return authError({ _form: toSafeErrorMessage(error) });
  }

  return {
    ...INITIAL_AUTH_FORM_STATE,
    status: "success",
    message:
      "Contraseña actualizada. Se han cerrado las demás sesiones abiertas de tu cuenta.",
  };
}
