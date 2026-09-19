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

/**
 * Personas operativas precargadas (DEV-004).
 *
 * El Product Owner autorizó **expresamente** la precarga de estos nombres como
 * dato maestro operativo. La autorización se limita a *nombre* y
 * *habilitación*: no se añade email, teléfono, nombre de usuario, contraseña,
 * departamento ni ningún otro dato personal, y la regla general de seguridad
 * del repositorio (no incluir datos personales ni credenciales) sigue vigente
 * para todo lo demás. Ver docs/architecture/SECURITY.md y
 * docs/shared/MASTER_DATA.md.
 *
 * Una misma persona puede estar habilitada como comercial, como PM o como
 * ambas cosas (DEC-013); el seed **acumula** habilitaciones y nunca retira
 * una que el usuario haya añadido después desde Administración.
 */
export type SeedPerson = {
  name: string;
  canBeCommercial: boolean;
  canBeProjectManager: boolean;
};

export const SEED_PEOPLE: SeedPerson[] = [
  // Comerciales.
  { name: "África Amilibia Puig", canBeCommercial: true, canBeProjectManager: false },
  { name: "Beatriz Esteve", canBeCommercial: true, canBeProjectManager: false },
  { name: "David Diez", canBeCommercial: true, canBeProjectManager: false },
  { name: "Hector Recio", canBeCommercial: true, canBeProjectManager: false },
  { name: "Juan Manuel Recio", canBeCommercial: true, canBeProjectManager: false },
  { name: "Miriam Recio", canBeCommercial: true, canBeProjectManager: false },
  { name: "Silvia Capdevila", canBeCommercial: true, canBeProjectManager: false },
  // Project Managers.
  { name: "David Oliva Viver", canBeCommercial: false, canBeProjectManager: true },
  { name: "Dennis Barragan", canBeCommercial: false, canBeProjectManager: true },
  { name: "Felix Carapaica", canBeCommercial: false, canBeProjectManager: true },
  { name: "Fernando Carrera", canBeCommercial: false, canBeProjectManager: true },
  { name: "Josep Miro", canBeCommercial: false, canBeProjectManager: true },
  { name: "Juan José Cibrián", canBeCommercial: false, canBeProjectManager: true },
  { name: "Sergio López", canBeCommercial: false, canBeProjectManager: true },
];

/**
 * Persona a la que se vincula la cuenta de administrador inicial creada por
 * `npm run auth:bootstrap-admin`. El nombre es un dato maestro autorizado; la
 * contraseña **no** vive aquí ni en ningún archivo versionado.
 */
export const BOOTSTRAP_ADMIN_PERSON_NAME = "Dennis Barragan";

/**
 * Reglas de notificación iniciales (bloque 9.3 de DEV-004).
 *
 * Se identifican por una `key` estable, de modo que repetir el seed las
 * verifique en lugar de duplicarlas, y que una regla desactivada o renombrada
 * por Administración no se «resucite» en cada ejecución: el seed solo crea las
 * que faltan.
 */
export type SeedNotificationRule = {
  key: string;
  name: string;
  description: string;
  trigger:
    | "OFFER_CREATED"
    | "OFFER_PENDING_PM_REVIEW"
    | "OFFER_PENDING_SALES_REVIEW";
  recipients: Array<"PROJECT_MANAGER" | "COMMERCIAL">;
  sortOrder: number;
};

export const SEED_NOTIFICATION_RULES: SeedNotificationRule[] = [
  {
    key: "offer-created-notify-assignees",
    name: "Nueva oferta: avisar al comercial y al PM",
    description:
      "Al crear una oferta, notifica internamente al comercial y al Project Manager asignados. Quien la crea no se notifica a sí mismo.",
    trigger: "OFFER_CREATED",
    recipients: ["COMMERCIAL", "PROJECT_MANAGER"],
    sortOrder: 1,
  },
  {
    key: "offer-pending-pm-review",
    name: "A valorar PM: avisar al Project Manager",
    description:
      "Cuando una oferta queda en «A valorar PM», notifica internamente al Project Manager asignado.",
    trigger: "OFFER_PENDING_PM_REVIEW",
    recipients: ["PROJECT_MANAGER"],
    sortOrder: 2,
  },
  {
    key: "offer-pending-sales-review",
    name: "Entregado a comercial: avisar al comercial",
    description:
      "Cuando una oferta queda en «Entregado a comercial», notifica internamente al comercial asignado.",
    trigger: "OFFER_PENDING_SALES_REVIEW",
    recipients: ["COMMERCIAL"],
    sortOrder: 3,
  },
];
