import type { ReactNode } from "react";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { LocalEnvironmentNotice } from "@/components/layout/local-environment-notice";

/**
 * Estructura común de la aplicación: menú lateral fijo en escritorio,
 * cabecera de contexto y contenido de la página activa. Diseño responsive
 * básico: en ventanas estrechas el menú pasa a ocupar el ancho completo por
 * encima del contenido, en lugar de romper el layout.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-col md:flex-row">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-[var(--color-primary)] focus:px-3 focus:py-2 focus:text-[var(--color-primary-contrast)]"
      >
        Saltar al contenido principal
      </a>

      <aside
        className="flex w-full flex-col gap-8 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-6 md:h-screen md:w-64 md:shrink-0 md:border-b-0 md:border-r md:sticky md:top-0 md:overflow-y-auto"
        aria-label="Barra lateral"
      >
        <div>
          <p className="text-lg font-semibold tracking-tight text-[var(--color-text)]">
            Vincle Apps
          </p>
          <p className="text-sm text-[var(--color-text-muted)]">
            Gestor de Ofertas
          </p>
        </div>

        <SidebarNav />

        <div className="mt-auto pt-4">
          <LocalEnvironmentNotice />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-4">
          <p className="text-sm text-[var(--color-text-muted)]">
            Vincle Apps · Gestor de Ofertas
          </p>
        </header>

        <main id="main-content" className="flex-1 px-6 py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
