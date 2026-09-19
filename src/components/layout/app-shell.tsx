import Link from "next/link";
import type { ReactNode } from "react";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { LocalEnvironmentNotice } from "@/components/layout/local-environment-notice";
import { logoutAction } from "@/modules/auth/actions";
import type { AuthenticatedUser } from "@/modules/auth/identity";

/**
 * Estructura común de la aplicación: menú lateral fijo en escritorio,
 * cabecera con la persona autenticada, el acceso global a notificaciones y el
 * contenido de la página activa. Diseño responsive básico: en ventanas
 * estrechas el menú pasa a ocupar el ancho completo por encima del contenido,
 * en lugar de romper el layout.
 *
 * Mientras no exista en el repositorio un archivo oficial de logotipo, la
 * marca se representa únicamente con la denominación textual «Vincle Apps»
 * (ver docs/design/BRAND_UI.md).
 */
export function AppShell({
  user,
  unreadNotifications,
  children,
}: {
  user: AuthenticatedUser;
  unreadNotifications: number;
  children: ReactNode;
}) {
  const isAdmin = user.role === "ADMIN";

  return (
    <div className="flex min-h-full flex-col md:flex-row">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-[var(--color-primary)] focus:px-3 focus:py-2 focus:text-[var(--color-primary-contrast)]"
      >
        Saltar al contenido principal
      </a>

      <aside
        className="flex w-full flex-col gap-8 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-6 md:sticky md:top-0 md:h-screen md:w-64 md:shrink-0 md:overflow-y-auto md:border-b-0 md:border-r"
        aria-label="Barra lateral"
      >
        <div>
          <p className="text-lg font-extrabold tracking-tight text-[var(--color-primary)]">
            Vincle Apps
          </p>
          <p className="text-sm text-[var(--color-text-muted)]">
            Gestor de Ofertas
          </p>
        </div>

        <SidebarNav isAdmin={isAdmin} />

        <div className="mt-auto pt-4">
          <LocalEnvironmentNotice />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 sm:px-6">
          <p className="text-sm text-[var(--color-text-muted)]">
            Vincle Apps · Gestor de Ofertas
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              className="v-link text-sm font-semibold"
              href="/notificaciones"
              aria-label={
                unreadNotifications > 0
                  ? `Notificaciones: ${unreadNotifications} sin leer`
                  : "Notificaciones: ninguna sin leer"
              }
            >
              Notificaciones
              <span
                className="ml-1 inline-block rounded-full px-2 py-0.5 text-xs font-bold"
                style={
                  unreadNotifications > 0
                    ? {
                        backgroundColor: "var(--color-primary)",
                        color: "var(--color-primary-contrast)",
                      }
                    : {
                        backgroundColor: "var(--color-surface-muted)",
                        color: "var(--color-text-muted)",
                      }
                }
              >
                {unreadNotifications}
              </span>
            </Link>

            <span className="text-sm text-[var(--color-text)]">
              <Link className="v-link" href="/cuenta/contrasena">
                {user.personName}
              </Link>{" "}
              <span className="text-[var(--color-text-muted)]">
                ({isAdmin ? "Administrador" : "Usuario"})
              </span>
            </span>

            <form action={logoutAction}>
              <button type="submit" className="v-btn v-btn-secondary">
                Cerrar sesión
              </button>
            </form>
          </div>
        </header>

        <main id="main-content" className="flex-1 px-4 py-8 sm:px-6">
          {children}
        </main>
      </div>
    </div>
  );
}

/** Envoltura mínima para las pantallas sin sesión (login). */
export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 py-10">
      <main id="main-content" className="w-full max-w-md">
        {children}
      </main>
    </div>
  );
}
