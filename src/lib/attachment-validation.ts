import path from "node:path";

/**
 * Validación de adjuntos (bloque 6), separada de `storage.ts` para que sea
 * pura y comprobable sin tocar el sistema de archivos ni depender de
 * `server-only` (que impide importar el módulo desde una prueba de Node
 * normal).
 */

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

export const ATTACHMENT_VALIDATION_MESSAGES: Record<AttachmentValidationError, string> = {
  empty: "El archivo está vacío.",
  "too-large": "El archivo supera el tamaño máximo permitido (25 MB).",
  "extension-not-allowed":
    "Ese tipo de archivo no está permitido. Formatos admitidos: PDF, Word, Excel, PowerPoint, imágenes y .msg.",
  "mime-not-allowed": "El contenido del archivo no coincide con su extensión.",
};
