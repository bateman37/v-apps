"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_SECTIONS } from "@/components/layout/nav-items";

/**
 * Navegación lateral con estado activo. Es un componente de cliente porque
 * necesita conocer la ruta actual (`usePathname`) para resaltar de forma
 * inequívoca la sección activa; el resto del layout se mantiene en servidor.
 *
 * El enlace activo es el de coincidencia más larga, para que `/offers/new`
 * resalte «Nueva oferta» y no también «Todas las ofertas».
 */
export function SidebarNav() {
  const pathname = usePathname() ?? "";

  const activeHref = NAV_SECTIONS.flatMap((section) => section.items)
    .filter(
      (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
    )
    .map((item) => item.href)
    .sort((left, right) => right.length - left.length)[0];

  return (
    <nav aria-label="Navegación principal" className="flex flex-col gap-6">
      {NAV_SECTIONS.map((section) => (
        <div key={section.title}>
          <h2 className="px-3 pb-2 text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
            {section.title}
          </h2>
          <ul className="flex flex-col gap-1">
            {section.items.map((item) => {
              const isActive = item.href === activeHref;

              if (item.disabled) {
                return (
                  <li key={item.href}>
                    <span
                      aria-disabled="true"
                      className="flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm text-[var(--color-text-muted)] opacity-60"
                    >
                      {item.label}
                      {item.disabledHint ? (
                        <span className="rounded bg-[var(--color-surface-muted)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                          {item.disabledHint}
                        </span>
                      ) : null}
                    </span>
                  </li>
                );
              }

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={`block rounded-md border-l-2 px-3 py-2 text-sm font-semibold transition-colors ${
                      isActive
                        ? "border-l-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                        : "border-l-transparent text-[var(--color-text)] hover:bg-[var(--color-surface-muted)]"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
