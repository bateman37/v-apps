/**
 * Navegación lateral de Vincle Apps para esta entrega.
 *
 * Deliberadamente no incluye entradas para ESM, FACT, Budget Comercial,
 * License Manager ni otros módulos futuros (ver docs/product/ROADMAP.md):
 * se añadirán cuando cada módulo se implemente.
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
};

export const NAV_SECTIONS: NavSection[] = [
  {
    title: "Gestor de Ofertas",
    items: [
      { label: "Todas las ofertas", href: "/offers" },
      {
        label: "Nueva oferta",
        href: "/offers/new",
        disabled: true,
        disabledHint: "Próxima entrega",
      },
    ],
  },
  {
    title: "Administración",
    items: [{ label: "Maestros", href: "/admin/master-data" }],
  },
];
