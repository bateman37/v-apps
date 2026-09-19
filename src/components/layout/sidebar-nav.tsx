"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_SECTIONS } from "@/components/layout/nav-items";

/**
 * Navegación lateral con estado activo. Es un componente de cliente porque
 * necesita conocer la ruta actual (`usePathname`) para resaltar de forma
 * inequívoca la sección activa; el resto del layout se mantiene en servidor.
 */
export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Navegación principal" className="flex flex-col gap-6">
      {NAV_SECTIONS.map((section) => (
        <div key={section.title}>
          <h2 className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
            {section.title}
          </h2>
          <ul className="flex flex-col gap-1">
            {section.items.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname?.startsWith(`${item.href}/`));

              if (item.disabled) {
                return (
                  <li key={item.href}>
                    <span
                      aria-disabled="true"
                      className="flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm text-[var(--color-text-muted)] opacity-60"
                    >
                      {item.label}
                      {item.disabledHint ? (
                        <span className="rounded bg-[var(--color-border)] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
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
                    className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-[var(--color-primary)] text-[var(--color-primary-contrast)]"
                        : "text-[var(--color-text)] hover:bg-[var(--color-border)]"
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
