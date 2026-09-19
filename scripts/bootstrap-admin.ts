/**
 * Creación del administrador inicial (`npm run auth:bootstrap-admin`).
 *
 * Diseño deliberado:
 *
 * - La contraseña **no** vive en el repositorio. Se lee de la variable de
 *   entorno `ADMIN_BOOTSTRAP_PASSWORD`, que el Product Owner escribe en su
 *   `.env` local (ignorado por Git) y puede borrar después de ejecutarlo.
 * - No existe ninguna contraseña por defecto funcional: sin la variable, el
 *   comando falla con una explicación.
 * - Es **idempotente**: si la cuenta ya existe, no se toca. En particular,
 *   **nunca** restablece silenciosamente la contraseña de una cuenta creada.
 * - No imprime la contraseña, ni entera ni parcial.
 * - Se separa del seed de maestros a propósito: cargar catálogos y crear una
 *   credencial son operaciones con riesgos distintos.
 */
import { PrismaClient } from "@prisma/client";
import { BOOTSTRAP_ADMIN_PERSON_NAME } from "../prisma/seed-data";
import { normalizeNameKey } from "../src/lib/text";
import { checkUsername, normalizeUsername } from "../src/modules/auth/identity";
import { checkPasswordStrength, hashPassword } from "../src/modules/auth/password";

const prisma = new PrismaClient();

function fail(message: string): never {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}

async function main() {
  const usernameRaw = process.env.ADMIN_BOOTSTRAP_USERNAME ?? "";
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD ?? "";

  if (usernameRaw.trim() === "") {
    fail(
      "Falta la variable ADMIN_BOOTSTRAP_USERNAME. Cópiala desde .env.example a tu .env y elige un nombre de usuario.",
    );
  }
  if (password === "") {
    fail(
      "Falta la variable ADMIN_BOOTSTRAP_PASSWORD. Escríbela en tu .env local (nunca en el repositorio) y vuelve a ejecutar el comando.",
    );
  }

  const username = normalizeUsername(usernameRaw);
  const usernameError = checkUsername(username);
  if (usernameError) {
    fail(`ADMIN_BOOTSTRAP_USERNAME no es válido: ${usernameError}`);
  }

  const passwordError = checkPasswordStrength(password);
  if (passwordError) {
    fail(`ADMIN_BOOTSTRAP_PASSWORD no cumple la política: ${passwordError}`);
  }

  // La persona debe existir: la crea el seed de maestros.
  const people = await prisma.person.findMany({ select: { id: true, name: true } });
  const person = people.find(
    (candidate) =>
      normalizeNameKey(candidate.name) ===
      normalizeNameKey(BOOTSTRAP_ADMIN_PERSON_NAME),
  );

  if (!person) {
    fail(
      `No existe la persona «${BOOTSTRAP_ADMIN_PERSON_NAME}» en el maestro. Ejecuta antes \`npm run db:seed\`.`,
    );
  }

  const [existingByPerson, existingByUsername] = await Promise.all([
    prisma.user.findUnique({
      where: { personId: person.id },
      select: { username: true, role: true, isActive: true },
    }),
    prisma.user.findUnique({ where: { username }, select: { id: true } }),
  ]);

  if (existingByPerson) {
    console.log(
      `\n✔ La cuenta de administrador ya existe (usuario «${existingByPerson.username}», rol ${existingByPerson.role}, ${existingByPerson.isActive ? "activa" : "desactivada"}).`,
    );
    console.log(
      "  No se ha modificado nada: este comando nunca restablece una contraseña ya establecida.",
    );
    console.log(
      "  Si has olvidado la contraseña, genera una temporal desde /admin/users con otra cuenta de administrador.\n",
    );
    return;
  }

  if (existingByUsername) {
    fail(
      `El nombre de usuario «${username}» ya está en uso por otra cuenta. Elige otro valor en ADMIN_BOOTSTRAP_USERNAME.`,
    );
  }

  const passwordHash = await hashPassword(password);

  await prisma.user.create({
    data: {
      username,
      passwordHash,
      role: "ADMIN",
      isActive: true,
      // La primera contraseña es provisional: hay que cambiarla al entrar.
      mustChangePassword: true,
      personId: person.id,
    },
  });

  console.log(
    `\n✔ Administrador creado y vinculado a «${person.name}» con el usuario «${username}».`,
  );
  console.log(
    "  Solo se ha almacenado el hash de la contraseña. Al iniciar sesión por primera vez se te pedirá cambiarla.",
  );
  console.log(
    "  Puedes borrar ADMIN_BOOTSTRAP_PASSWORD de tu .env en cuanto hayas entrado.\n",
  );
}

main()
  .catch((error) => {
    // No se vuelca el error completo: podría contener la cadena de conexión.
    console.error(
      "\n✖ No se ha podido crear el administrador inicial. Revisa que PostgreSQL esté en marcha y que las migraciones y el seed se hayan ejecutado.\n",
    );
    if (process.env.NODE_ENV !== "production") {
      console.error(error);
    }
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
