import { Alert } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/page-header";

/**
 * Pantalla de error cuando no se puede leer de PostgreSQL.
 *
 * El detalle técnico se registra únicamente en la consola del servidor de
 * desarrollo (mecanismo normal de Next.js); nunca se muestra en la interfaz,
 * para no exponer cadenas de conexión, SQL ni trazas. Ver
 * docs/architecture/SECURITY.md.
 */
export function DatabaseConnectionError({
  title,
  error,
}: {
  title: string;
  error?: unknown;
}) {
  if (process.env.NODE_ENV !== "production" && error !== undefined) {
    console.error(`[v-apps] Error al leer datos para «${title}»:`, error);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={title} />
      <Alert tone="error" title="No se ha podido conectar con los datos">
        <p>
          Revisa que PostgreSQL esté en marcha y que el archivo <code>.env</code>{" "}
          de tu copia local tenga configurado correctamente{" "}
          <code>DATABASE_URL</code>. Consulta la guía de arranque en el{" "}
          <code>README.md</code> del proyecto.
        </p>
      </Alert>
    </div>
  );
}
