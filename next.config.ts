import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js 16 reescribe AGENTS.md en cada "dev"/"build" con sus propias
  // notas para agentes de IA. En este repositorio AGENTS.md ya es un
  // documento canónico propio (reglas de colaboración, ver DOC-001): se
  // desactiva para que el framework no le añada ni le quite contenido.
  agentRules: false,
};

export default nextConfig;
