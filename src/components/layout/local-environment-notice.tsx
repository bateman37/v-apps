/**
 * Aviso discreto pero visible de que la autenticación está pospuesta
 * (decisión temporal aprobada `DEC-019`, ver docs/decisions/DECISIONS.md).
 * Esta aplicación es únicamente apta para desarrollo local y no debe
 * exponerse en una red accesible ni usarse en producción mientras no exista
 * autenticación y autorización.
 */
export function LocalEnvironmentNotice() {
  return (
    <p
      role="status"
      className="rounded-md border px-3 py-2 text-xs font-semibold"
      style={{
        borderColor: "var(--color-warning)",
        backgroundColor: "var(--color-warning-soft)",
        color: "var(--color-warning)",
      }}
    >
      Entorno local · autenticación pendiente
    </p>
  );
}
