import { createReadStream } from "node:fs";
import { Readable } from "node:stream";
import { prisma } from "@/lib/db/prisma";
import { readAttachmentFile } from "@/lib/storage";
import { canAccessOffer } from "@/modules/auth/identity";
import { isSameOriginRequest, requireUser } from "@/modules/auth/session";

/**
 * Descarga autenticada y autorizada de un adjunto (bloque 6).
 *
 * Es una ruta propia (no una Server Action) porque necesita hacer streaming
 * del fichero con cabeceras de respuesta binaria. Nunca expone la ruta local
 * del disco: solo el contenido, con el nombre original en `Content-Disposition`.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; attachmentId: string }> },
) {
  if (!(await isSameOriginRequest())) {
    return new Response("Origen no permitido.", { status: 403 });
  }

  const user = await requireUser();
  const { id: offerId, attachmentId } = await params;

  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    select: { id: true, createdById: true, commercialId: true, projectManagerId: true },
  });

  if (!offer || !canAccessOffer(user, offer)) {
    // Respuesta segura: no distingue "no existe" de "no autorizado".
    return new Response("No encontrado.", { status: 404 });
  }

  const attachment = await prisma.offerAttachment.findUnique({
    where: { id: attachmentId },
    select: {
      offerId: true,
      originalName: true,
      contentType: true,
      storageKey: true,
      sizeBytes: true,
      removedAt: true,
    },
  });

  if (!attachment || attachment.offerId !== offerId || attachment.removedAt !== null) {
    return new Response("No encontrado.", { status: 404 });
  }

  const file = await readAttachmentFile(attachment.storageKey);
  if (!file) {
    return new Response("El archivo ya no está disponible.", { status: 404 });
  }

  const nodeStream = createReadStream(file.path);
  const body = Readable.toWeb(nodeStream) as ReadableStream;
  const safeFileName = attachment.originalName.replaceAll('"', "");

  return new Response(body, {
    headers: {
      "Content-Type": attachment.contentType,
      "Content-Length": String(file.size),
      "Content-Disposition": `attachment; filename="${safeFileName}"`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    },
  });
}
