/**
 * Aviso discreto pero visible de que la autenticación está pospuesta
 * (decisión temporal aprobada, ver docs/decisions/DECISIONS.md). Esta
 * aplicación es únicamente apta para desarrollo local y no debe exponerse
 * en una red accesible ni usarse en producción mientras no exista
 * autenticación y autorización.
 */
export function LocalEnvironmentNotice() {
  return (
    <p
      role="status"
      className="rounded-md border border-[var(--color-warning-bg)] bg-[var(--color-warning-bg)] px-3 py-2 text-xs font-medium text-[var(--color-warning)]"
    >
      Entorno local · autenticación pendiente
    </p>
  );
}
