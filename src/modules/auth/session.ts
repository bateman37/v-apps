import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import {
  isSessionValid,
  SESSION_DURATION_MS,
  type AuthenticatedUser,
  type Role,
} from "@/modules/auth/identity";

/**
 * Sesión de servidor de la autenticación local provisional.
 *
 * Diseño:
 *
 * - El token es de 256 bits aleatorios y viaja **solo** en una cookie
 *   `HttpOnly`, `SameSite=Lax` y `Secure` en producción.
 * - La base de datos guarda únicamente su **hash SHA-256**. Un volcado de la
 *   tabla `sessions` no permite suplantar a nadie. (SHA-256 sin sal es
 *   adecuado aquí, y solo aquí, porque el token ya es aleatorio de alta
 *   entropía: no hay nada que un diccionario pueda adivinar. Las contraseñas,
 *   que sí son adivinables, usan scrypt; ver `password.ts`.)
 * - Cerrar sesión borra la fila: el token deja de valer aunque la cookie
 *   sobreviva en el navegador.
 * - Un usuario desactivado deja de tener sesión válida de inmediato, porque
 *   la comprobación de `isActive` se hace en cada lectura.
 */

const DEFAULT_COOKIE_NAME = "vapps_session";

function sessionCookieName(): string {
  const configured = process.env.SESSION_COOKIE_NAME?.trim();
  return configured && configured.length > 0 ? configured : DEFAULT_COOKIE_NAME;
}

/** Hash de almacenamiento del token de sesión. */
export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Token aleatorio de 256 bits en base64url. */
function generateSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

const USER_SELECT = {
  id: true,
  username: true,
  role: true,
  isActive: true,
  mustChangePassword: true,
  personId: true,
  person: {
    select: { name: true, canBeCommercial: true, canBeProjectManager: true },
  },
} as const;

type UserRecord = {
  id: string;
  username: string;
  role: Role;
  isActive: boolean;
  mustChangePassword: boolean;
  personId: string;
  person: {
    name: string;
    canBeCommercial: boolean;
    canBeProjectManager: boolean;
  };
};

function toAuthenticatedUser(user: UserRecord): AuthenticatedUser {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    personId: user.personId,
    personName: user.person.name,
    canBeCommercial: user.person.canBeCommercial,
    canBeProjectManager: user.person.canBeProjectManager,
    mustChangePassword: user.mustChangePassword,
  };
}

/**
 * Crea la sesión y deja la cookie. Devuelve nada útil a propósito: el token en
 * claro no debe salir de aquí.
 */
export async function createSession(userId: string): Promise<void> {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await prisma.session.create({
    data: { tokenHash: hashSessionToken(token), userId, expiresAt },
  });

  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName(), token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

/** Cierra la sesión actual: borra la fila y la cookie. */
export async function destroyCurrentSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName())?.value;

  if (token) {
    // `deleteMany` no falla si la fila ya no existe (sesión caducada o
    // revocada desde otro navegador).
    await prisma.session.deleteMany({
      where: { tokenHash: hashSessionToken(token) },
    });
  }

  cookieStore.delete(sessionCookieName());
}

/** Revoca todas las sesiones de un usuario (desactivación, cambio de clave). */
export async function revokeAllSessionsOf(userId: string): Promise<void> {
  await prisma.session.deleteMany({ where: { userId } });
}

/**
 * Usuario autenticado de la petición en curso, o `null`.
 *
 * Nunca devuelve el hash de contraseña: el tipo `AuthenticatedUser` no lo
 * contiene, de modo que no puede filtrarse por accidente a un componente de
 * cliente.
 */
export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName())?.value;
  if (!token) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashSessionToken(token) },
    select: { expiresAt: true, user: { select: USER_SELECT } },
  });

  if (!isSessionValid(session)) {
    return null;
  }
  if (!session || !session.user.isActive) {
    return null;
  }

  return toAuthenticatedUser(session.user);
}

/**
 * Exige sesión. Sin ella redirige a `/login`. El destino tras iniciar sesión
 * se decide en el formulario (campo oculto `redirectTo`); esta función no
 * conoce la ruta que se quería visitar, así que sin ese campo el login lleva
 * al listado de ofertas.
 */
export async function requireUser(): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?motivo=sesion");
  }
  return user;
}

/** Exige sesión con rol `ADMIN`. */
export async function requireAdmin(): Promise<AuthenticatedUser> {
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    // Respuesta segura: no se distingue «no existe» de «no autorizado».
    redirect("/offers?acceso=denegado");
  }
  return user;
}

/**
 * Comprobación de origen para las mutaciones.
 *
 * Next.js ya rechaza las Server Actions con `Origin` ajeno, pero las rutas de
 * subida y descarga son endpoints propios y deben comprobarlo por su cuenta.
 * Se acepta la petición sin `Origin` (navegación directa, `GET` de descarga) y
 * se rechaza la que declara un origen distinto al de la propia aplicación.
 */
export async function isSameOriginRequest(): Promise<boolean> {
  const headerList = await headers();
  const origin = headerList.get("origin");
  if (!origin) {
    return true;
  }
  const host = headerList.get("host");
  if (!host) {
    return false;
  }
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/** Elimina sesiones caducadas. Se invoca de forma oportunista en el login. */
export async function purgeExpiredSessions(): Promise<void> {
  await prisma.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });
}

/** Busca por nombre de usuario ya normalizado, para el login. */
export async function findUserForLogin(username: string) {
  return prisma.user.findUnique({
    where: { username },
    select: { ...USER_SELECT, passwordHash: true },
  });
}

export { toAuthenticatedUser };
