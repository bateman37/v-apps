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
    // «Panel de notificaciones» aparece antes que el Gestor de Ofertas
    // (hotfix DEV-005, bloque 9): es la entrada principal de un usuario
    // normal, disponible para ADMIN y USER.
    title: "Notificaciones",
    items: [{ label: "Panel de notificaciones", href: "/notificaciones" }],
  },
  {
    title: "Gestor de Ofertas",
    items: [
      { label: "Todas las ofertas", href: "/offers" },
      { label: "Nueva oferta", href: "/offers/new" },
      { label: "Pendiente de revisión", href: "/offers/pending-review" },
    ],
  },
  {
    title: "Administración",
    adminOnly: true,
    items: [
      { label: "Clientes", href: "/admin/clients" },
      // «Personas y accesos» sustituye a las antiguas entradas separadas
      // «Personas» y «Usuarios» (hotfix DEV-005, bloque 7); `/admin/users`
      // sigue existiendo y redirige aquí para no romper marcadores.
      { label: "Personas y accesos", href: "/admin/people" },
      { label: "Maestros de oferta", href: "/admin/master-data" },
      { label: "Reglas de notificación", href: "/admin/notification-rules" },
      { label: "Contador de ofertas", href: "/admin/counter" },
    ],
  },
];

/** Secciones visibles para el rol indicado. */
export function visibleNavSections(isAdmin: boolean): NavSection[] {
  return NAV_SECTIONS.filter((section) => !section.adminOnly || isAdmin);
}
