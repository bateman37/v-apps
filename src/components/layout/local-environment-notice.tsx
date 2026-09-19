/**
 * Aviso honesto sobre el estado de la autenticación.
 *
 * DEV-004 sustituye el antiguo «autenticación pendiente»: ahora existe un
 * login local real, pero **no** es el mecanismo corporativo definitivo. El
 * proveedor final (SSO o equivalente) sigue siendo una decisión pendiente
 * (`DEC-056`), y la aplicación continúa siendo apta solo para uso local
 * mientras no existan infraestructura ni despliegue aprobados (`DEC-057`).
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
      Entorno local · autenticación local provisional
    </p>
  );
}
