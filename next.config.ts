import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js 16 reescribe AGENTS.md en cada "dev"/"build" con sus propias
  // notas para agentes de IA. En este repositorio AGENTS.md ya es un
  // documento canónico propio (reglas de colaboración, ver DOC-001): se
  // desactiva para que el framework no le añada ni le quite contenido.
  agentRules: false,
  experimental: {
    serverActions: {
      // El límite funcional de un adjunto sigue siendo 25 MB en estricto
      // (ver `src/lib/attachment-validation.ts`); este valor solo da margen
      // de transporte al `multipart/form-data` (cabeceras, límites y el resto
      // de campos del envío) para que un archivo válido de 25 MB llegue
      // completo a esa validación en lugar de fallar antes por el límite por
      // defecto de Next.js (1 MB).
      bodySizeLimit: "30mb",
    },
  },
};

export default nextConfig;
