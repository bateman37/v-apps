export function MasterDataConnectionError() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-text)]">
        Maestros
      </h1>

      <div
        role="alert"
        className="flex flex-col gap-2 rounded-lg border border-[var(--color-danger)] bg-[color-mix(in_srgb,var(--color-danger)_8%,transparent)] px-4 py-4"
      >
        <p className="font-semibold text-[var(--color-danger)]">
          No se ha podido conectar con los datos.
        </p>
        <p className="text-sm text-[var(--color-text)]">
          Revisa que PostgreSQL esté en marcha y que el archivo{" "}
          <code className="rounded bg-[var(--color-surface)] px-1 py-0.5 text-xs">
            .env
          </code>{" "}
          de tu copia local tenga configurado correctamente{" "}
          <code className="rounded bg-[var(--color-surface)] px-1 py-0.5 text-xs">
            DATABASE_URL
          </code>
          . Consulta la guía de arranque en el{" "}
          <code className="rounded bg-[var(--color-surface)] px-1 py-0.5 text-xs">
            README.md
          </code>{" "}
          del proyecto.
        </p>
      </div>
    </div>
  );
}
