import { describe, expect, it } from "vitest";
import {
  ATTACHMENT_VALIDATION_MESSAGES,
  MAX_ATTACHMENT_SIZE_BYTES,
  validateAttachment,
} from "@/lib/attachment-validation";

const ONE_MB = 1024 * 1024;

describe("validateAttachment (bloque 6)", () => {
  it("acepta un PDF dentro del límite de tamaño", () => {
    expect(
      validateAttachment({ name: "oferta.pdf", size: ONE_MB, type: "application/pdf" }),
    ).toBeNull();
  });

  it("acepta un .msg aunque el MIME sea genérico (application/octet-stream)", () => {
    expect(
      validateAttachment({
        name: "correo.msg",
        size: ONE_MB,
        type: "application/octet-stream",
      }),
    ).toBeNull();
  });

  it("rechaza un archivo vacío", () => {
    expect(validateAttachment({ name: "vacio.pdf", size: 0, type: "application/pdf" })).toBe(
      "empty",
    );
  });

  it("rechaza un archivo que supera los 25 MB", () => {
    expect(
      validateAttachment({
        name: "grande.pdf",
        size: MAX_ATTACHMENT_SIZE_BYTES + 1,
        type: "application/pdf",
      }),
    ).toBe("too-large");
  });

  it("acepta exactamente el límite de tamaño", () => {
    expect(
      validateAttachment({
        name: "limite.pdf",
        size: MAX_ATTACHMENT_SIZE_BYTES,
        type: "application/pdf",
      }),
    ).toBeNull();
  });

  it("rechaza extensiones no permitidas, como ejecutables o comprimidos", () => {
    expect(
      validateAttachment({ name: "script.exe", size: ONE_MB, type: "application/octet-stream" }),
    ).toBe("extension-not-allowed");
    expect(
      validateAttachment({ name: "paquete.zip", size: ONE_MB, type: "application/zip" }),
    ).toBe("extension-not-allowed");
  });

  it("rechaza un MIME que no coincide con la extensión declarada", () => {
    expect(
      validateAttachment({ name: "falso.pdf", size: ONE_MB, type: "image/png" }),
    ).toBe("mime-not-allowed");
  });

  it("cada código de error tiene un mensaje en español para mostrar", () => {
    for (const code of Object.keys(ATTACHMENT_VALIDATION_MESSAGES)) {
      expect(ATTACHMENT_VALIDATION_MESSAGES[code as keyof typeof ATTACHMENT_VALIDATION_MESSAGES]).toMatch(
        /[a-záéíóúñ]/i,
      );
    }
  });
});
