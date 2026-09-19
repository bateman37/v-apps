import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, open, rm, stat } from "node:fs/promises";
import path from "node:path";

export {
  ATTACHMENT_VALIDATION_MESSAGES,
  MAX_ATTACHMENT_SIZE_BYTES,
  validateAttachment,
  type AttachmentValidationError,
} from "@/lib/attachment-validation";

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
 * - La validación (tamaño, extensión, MIME) vive en
 *   `@/lib/attachment-validation`, pura y sin `server-only`, para poder
 *   probarse sin tocar el sistema de archivos.
 */

const DEFAULT_STORAGE_DIR = "./storage/offer-attachments";

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
