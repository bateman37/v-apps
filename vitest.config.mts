import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Vitest carga automáticamente ".env", de donde procede DATABASE_URL para la
// prueba de integración del contador, que se omite si no hay PostgreSQL.

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "prisma/**/*.test.ts"],
  },
});
