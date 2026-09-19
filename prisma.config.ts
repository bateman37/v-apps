import path from "node:path";
import { defineConfig } from "prisma/config";

// Carga las variables de entorno de ".env" (DATABASE_URL) antes de que
// Prisma CLI las necesite, tal como recomienda la configuración actual
// de Prisma. Ver README.md para cómo generar este archivo localmente.
import "dotenv/config";

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
