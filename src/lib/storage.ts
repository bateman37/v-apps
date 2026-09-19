import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, open, rm, stat } from "node:fs/promises";
import path from "node:path";

/**
 * Almacenamiento local de adjuntos (bloque 6).
 *
 * - La ruta raíz se configura por variable de entorno; nunca vive bajo
 *   `public/` y nunca se expone al cliente.
 * - El nombre físico es un identificador aleatorio, nunca el nombre
 *   original: evita colisiones, nombres reservados y cualquier intento de
 *   "path traversal" a partir de un nombre de archivo hostil.
 * - Solo se guarda en base de datos una clave relativa seguro, nunca una
 *   ruta absoluta.
 */

const DEFAULT_STORAGE_DIR = "./storage/offer-attachments";

export const MAX_ATTACHMENT_SIZE_BYTES = 25 * 1024 * 1024;

/** Extensión → tipos MIME aceptados. Una política explícita y conservadora. */
const ALLOWED_EXTENSIONS: Record<string, string[]> = {
  ".pdf": ["application/pdf"],
  ".doc": ["application/msword"],
  ".docx": ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  ".xls": ["application/vnd.ms-excel"],
  ".xlsx": ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  ".xlsm": [
    "application/vnd.ms-excel.sheet.macroenabled.12",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ],
  ".ppt": ["application/vnd.ms-powerpoint"],
  ".pptx": [
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ],
  ".png": ["image/png"],
  ".jpg": ["image/jpeg"],
  ".jpeg": ["image/jpeg"],
  // El MIME de .msg varía mucho entre navegadores y sistemas operativos;
  // `application/octet-stream` es habitual y no se rechaza para este único
  // formato, precisamente para no bloquear de forma arbitraria un tipo
  // aprobado. La extensión sigue siendo obligatoria y verificada.
  ".msg": ["application/vnd.ms-outlook", "application/octet-stream"],
};

export type AttachmentValidationError =
  | "empty"
  | "too-large"
  | "extension-not-allowed"
  | "mime-not-allowed";

export function validateAttachment(file: {
  name: string;
  size: number;
  type: string;
}): AttachmentValidationError | null {
  if (file.size <= 0) {
    return "empty";
  }
  if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
    return "too-large";
  }
  const extension = path.extname(file.name).toLowerCase();
  const allowedMimes = ALLOWED_EXTENSIONS[extension];
  if (!allowedMimes) {
    return "extension-not-allowed";
  }
  // Un `type` vacío (frecuente en algunos navegadores/SO) no se rechaza: se
  // confía en la extensión, que sí se ha comprobado contra la lista cerrada.
  if (file.type && !allowedMimes.includes(file.type)) {
    return "mime-not-allowed";
  }
  return null;
}

export const ATTACHMENT_VALIDATION_MESSAGES: Record<AttachmentValidationError, string> =
  {
    empty: "El archivo está vacío.",
    "too-large": "El archivo supera el tamaño máximo permitido (25 MB).",
    "extension-not-allowed":
      "Ese tipo de archivo no está permitido. Formatos admitidos: PDF, Word, Excel, PowerPoint, imágenes y .msg.",
    "mime-not-allowed":
      "El contenido del archivo no coincide con su extensión.",
  };

function storageRoot(): string {
  const configured = process.env.ATTACHMENTS_STORAGE_PATH?.trim();
  return path.resolve(configured && configured.length > 0 ? configured : DEFAULT_STORAGE_DIR);
}

/**
 * Construye una clave de almacenamiento nueva, aleatoria y con la extensión
 * original (necesaria para que algunos visores la reconozcan al descargar).
 * La clave nunca depende del nombre que envía el usuario.
 */
function generateStorageKey(originalName: string): string {
  const extension = path.extname(originalName).toLowerCase();
  return `${randomUUID()}${extension}`;
}

/** Ruta absoluta segura para una clave de almacenamiento ya validada. */
function resolvePath(storageKey: string): string {
  const root = storageRoot();
  const resolved = path.resolve(root, storageKey);
  // Cinturón y tirantes: aunque la clave la generamos nosotros, nunca se
  // resuelve una ruta fuera de la raíz configurada.
  if (resolved !== root && !resolved.startsWith(root + path.sep)) {
    throw new Error("Ruta de almacenamiento no válida.");
  }
  return resolved;
}

/**
 * Guarda el contenido en disco y devuelve la clave de almacenamiento.
 * Si algo falla después de escribir el fichero, se intenta limpiar antes de
 * propagar el error, para no dejar binarios huérfanos.
 */
export async function saveAttachmentFile(
  originalName: string,
  data: Buffer,
): Promise<string> {
  const root = storageRoot();
  await mkdir(root, { recursive: true });

  const storageKey = generateStorageKey(originalName);
  const destination = resolvePath(storageKey);
  const handle = await open(destination, "wx");
  try {
    await handle.writeFile(data);
  } finally {
    await handle.close();
  }
  return storageKey;
}

/** Elimina un fichero físico. No falla si ya no existe. */
export async function deleteAttachmentFile(storageKey: string): Promise<void> {
  try {
    await rm(resolvePath(storageKey), { force: true });
  } catch {
    // Best-effort: un fallo al borrar el binario huérfano no debe romper el
    // flujo de la aplicación. La eliminación lógica en base de datos es la
    // fuente de verdad.
  }
}

export async function readAttachmentFile(storageKey: string): Promise<{
  path: string;
  size: number;
} | null> {
  const absolutePath = resolvePath(storageKey);
  try {
    const info = await stat(absolutePath);
    if (!info.isFile()) {
      return null;
    }
    return { path: absolutePath, size: info.size };
  } catch {
    return null;
  }
}
