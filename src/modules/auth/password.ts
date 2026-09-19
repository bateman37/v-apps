import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
  type ScryptOptions,
} from "node:crypto";

/**
 * Hash y verificación de contraseñas.
 *
 * Se usa **scrypt**, una de las funciones de derivación admitidas
 * explícitamente para contraseñas (junto a Argon2id y bcrypt), disponible en
 * el propio Node.js: no se diseña criptografía propia ni se añade una
 * dependencia nativa que complicaría el arranque local en Windows.
 *
 * Reglas:
 *
 * - Cada contraseña lleva su **sal aleatoria** de 16 bytes.
 * - Los parámetros de coste se guardan dentro del propio hash, de modo que
 *   subirlos en el futuro no invalida las contraseñas ya almacenadas.
 * - La comparación es en **tiempo constante** (`timingSafeEqual`).
 * - Ni la contraseña ni el hash se registran nunca en logs, auditoría o
 *   respuestas al cliente.
 */

/**
 * `promisify` no conserva la sobrecarga de `scrypt` que acepta opciones de
 * coste, así que se envuelve explícitamente.
 */
function scrypt(
  password: string,
  salt: Buffer,
  keyLength: number,
  options: ScryptOptions,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, keyLength, options, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(derivedKey);
    });
  });
}

/**
 * Parámetros de coste. `N = 2^15` con `r = 8` exige ~32 MB de memoria por
 * verificación: coste razonable para una aplicación interna sin penalizar el
 * arranque en un portátil corporativo.
 */
const COST = 2 ** 15;
const BLOCK_SIZE = 8;
const PARALLELIZATION = 1;
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

/** Memoria máxima que Node debe permitir para los parámetros anteriores. */
const MAX_MEMORY = 256 * 1024 * 1024;

const PREFIX = "scrypt";

/** Longitud mínima exigida a una contraseña, inicial o elegida por el usuario. */
export const MIN_PASSWORD_LENGTH = 12;

/** Longitud máxima admitida, para no aceptar entradas desproporcionadas. */
export const MAX_PASSWORD_LENGTH = 200;

/**
 * Comprueba los requisitos mínimos de una contraseña nueva.
 *
 * Deliberadamente simple y explicable: longitud mínima y presencia de al
 * menos una letra y un dígito. No se impone rotación, ni un diccionario, ni
 * reglas que empujen a la gente a escribir la contraseña en un papel.
 */
export function checkPasswordStrength(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return `La contraseña no puede superar ${MAX_PASSWORD_LENGTH} caracteres.`;
  }
  if (!/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(password)) {
    return "La contraseña debe contener al menos una letra.";
  }
  if (!/\d/.test(password)) {
    return "La contraseña debe contener al menos un número.";
  }
  return null;
}

/** Deriva el hash de una contraseña y devuelve la cadena completa a guardar. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const derived = await scrypt(password.normalize("NFKC"), salt, KEY_LENGTH, {
    N: COST,
    r: BLOCK_SIZE,
    p: PARALLELIZATION,
    maxmem: MAX_MEMORY,
  });

  return [
    PREFIX,
    COST,
    BLOCK_SIZE,
    PARALLELIZATION,
    salt.toString("base64"),
    derived.toString("base64"),
  ].join("$");
}

/**
 * Verifica una contraseña contra el hash almacenado.
 *
 * Devuelve `false` —nunca lanza— ante un hash corrupto o de un formato
 * desconocido: un registro dañado no debe convertirse en un error 500 que
 * revele información sobre la cuenta.
 */
export async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  const parts = storedHash.split("$");
  if (parts.length !== 6 || parts[0] !== PREFIX) {
    return false;
  }

  const [, costRaw, blockSizeRaw, parallelizationRaw, saltRaw, hashRaw] = parts;
  const cost = Number.parseInt(costRaw, 10);
  const blockSize = Number.parseInt(blockSizeRaw, 10);
  const parallelization = Number.parseInt(parallelizationRaw, 10);

  if (
    !Number.isInteger(cost) ||
    !Number.isInteger(blockSize) ||
    !Number.isInteger(parallelization) ||
    cost < 2 ||
    blockSize < 1 ||
    parallelization < 1
  ) {
    return false;
  }

  let expected: Buffer;
  let salt: Buffer;
  try {
    expected = Buffer.from(hashRaw, "base64");
    salt = Buffer.from(saltRaw, "base64");
  } catch {
    return false;
  }

  if (expected.length === 0 || salt.length === 0) {
    return false;
  }

  let actual: Buffer;
  try {
    actual = await scrypt(password.normalize("NFKC"), salt, expected.length, {
      N: cost,
      r: blockSize,
      p: parallelization,
      maxmem: MAX_MEMORY,
    });
  } catch {
    return false;
  }

  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/**
 * Genera una contraseña temporal legible pero aleatoria.
 *
 * Solo se muestra una vez, en la respuesta de la acción explícita que la
 * establece: no se guarda en claro en ningún sitio, de modo que no puede
 * volver a consultarse.
 */
export function generateTemporaryPassword(): string {
  // Alfabeto sin caracteres ambiguos (`0`, `O`, `l`, `1`, `I`).
  const alphabet = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(16);
  let password = "";
  for (const byte of bytes) {
    password += alphabet[byte % alphabet.length];
  }
  // Se garantiza al menos una letra y un dígito, coherente con la política.
  return `Vi${password}7`;
}
