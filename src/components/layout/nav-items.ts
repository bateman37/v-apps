/**
 * Navegación lateral de Vincle Apps para esta entrega.
 *
 * Deliberadamente no incluye entradas para ESM, FACT, Budget Comercial,
 * License Manager ni otros módulos futuros (ver docs/product/ROADMAP.md):
 * se añadirán cuando cada módulo se implemente.
 *
 * Las entradas de Administración solo se muestran a un `ADMIN`. Ocultarlas no
 * es la autorización: cada página y cada acción vuelve a comprobar el rol en
 * servidor.
 */
export type NavItem = {
  label: string;
  href: string;
  /** Si es `true`, el enlace se muestra pero no permite navegar todavía. */
  disabled?: boolean;
  /** Texto corto que explica por qué está deshabilitado. */
  disabledHint?: string;
};

export type NavSection = {
  title: string;
  items: NavItem[];
  /** Si es `true`, la sección solo se muestra a un administrador. */
  adminOnly?: boolean;
};

export const NAV_SECTIONS: NavSection[] = [
  {
    title: "Gestor de Ofertas",
    items: [
      { label: "Todas las ofertas", href: "/offers" },
      { label: "Nueva oferta", href: "/offers/new" },
      { label: "Pendiente de revisión", href: "/offers/pending-review" },
      { label: "Ofertas archivadas", href: "/offers?scope=archivadas" },
    ],
  },
  {
    title: "Administración",
    adminOnly: true,
    items: [
      { label: "Clientes", href: "/admin/clients" },
      { label: "Personas", href: "/admin/people" },
      { label: "Maestros de oferta", href: "/admin/master-data" },
      { label: "Usuarios", href: "/admin/users" },
      { label: "Reglas de notificación", href: "/admin/notification-rules" },
      { label: "Contador de ofertas", href: "/admin/counter" },
    ],
  },
];

/** Secciones visibles para el rol indicado. */
export function visibleNavSections(isAdmin: boolean): NavSection[] {
  return NAV_SECTIONS.filter((section) => !section.adminOnly || isAdmin);
}
