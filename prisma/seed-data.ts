/**
 * Valores maestros aprobados para la carga inicial (ver
 * docs/shared/MASTER_DATA.md y docs/offers/BUSINESS_RULES.md).
 *
 * Este módulo no depende de Prisma ni de ninguna conexión a base de datos:
 * es un mapeo puro código–nombre, único lugar donde se documenta, para que
 * tanto el seed (`prisma/seed.ts`) como sus pruebas (`prisma/__tests__/`)
 * lo reutilicen sin duplicarlo.
 */

export type SeedValue = { code: string; name: string };

export const PRIORITIES: SeedValue[] = [
  { code: "HIGH", name: "Alta" },
  { code: "MEDIUM", name: "Media" },
  { code: "LOW", name: "Baja" },
];

export const ORIGINS: SeedValue[] = [
  { code: "COMMERCIAL", name: "Comercial" },
  { code: "PM", name: "PM" },
  { code: "CS", name: "CS" },
];

export const OFFER_TYPES: SeedValue[] = [
  { code: "HOURS_POOL", name: "Bolsa de horas" },
  { code: "SCOPE_CHANGE", name: "Cambio de alcance" },
  { code: "PROJECT", name: "Proyecto" },
];

export const OFFER_STATUSES: SeedValue[] = [
  { code: "TO_BE_ASSESSED_PM", name: "A valorar PM" },
  { code: "DELIVERED_TO_SALES", name: "Entregado a comercial" },
  { code: "SENT", name: "Enviado" },
  { code: "OFFER_90", name: "Oferta 90 %" },
  { code: "ACCEPTED", name: "Aceptado" },
  { code: "DEVELOPMENT", name: "Desarrollo" },
  { code: "DELIVERED", name: "Entregado" },
  { code: "INVOICED", name: "Facturado" },
  { code: "CANCELLED", name: "Anulado" },
  { code: "UNDER_REVIEW", name: "En revisión" },
];

export const SEGMENTATIONS: SeedValue[] = [
  { code: "TOP_DEVELOPMENTS", name: "Acción: Top desarrollos" },
  { code: "LARGE_EVOLUTIONS", name: "Evolutivos grandes (>10 k€)" },
  { code: "SMALL_EVOLUTIONS", name: "Evolutivos pequeños (<10 k€)" },
  { code: "NEW_DIVISION", name: "Nueva división" },
  { code: "NEW_MODULE", name: "Nuevo módulo" },
  { code: "NEW_COUNTRY", name: "Nuevo país" },
  { code: "VFS_PROJECT", name: "Proyecto VFS" },
  { code: "VSW_PROJECT", name: "Proyecto VSW" },
  { code: "VSW_UPGRADE", name: "Upgrade VSW" },
  { code: "PBI_VERTICAL", name: "Vertical PBI" },
];

// Códigos funcionales ya conocidos (ver docs/offers/BUSINESS_RULES.md):
// se conservan literalmente, no son códigos técnicos inventados.
export const PROFESSIONAL_PROFILES: SeedValue[] = [
  { code: "PM", name: "Project Manager" },
  { code: "AN", name: "Analista" },
  { code: "DIL", name: "Data Insights Leader" },
  { code: "DE", name: "Data Engineer" },
  { code: "IN", name: "Consultor Insights" },
  { code: "DI", name: "Desarrollador Insights" },
  { code: "PR-BE", name: "Programador Backend" },
  { code: "PR-FE", name: "Programador Frontend" },
  { code: "PR-REM", name: "Programador Remoto" },
  { code: "KN", name: "Knowledge" },
  { code: "IT", name: "IT" },
  { code: "UX", name: "UX/UI" },
  { code: "TL", name: "Tech Lead" },
  { code: "PLATF", name: "Plataforma" },
];

// Sin valores aprobados todavía (ver docs/shared/MASTER_DATA.md):
// las tablas se crean y se dejan deliberadamente vacías.
export const LANGUAGES: SeedValue[] = [];
export const CANCELLATION_REASONS: SeedValue[] = [];
