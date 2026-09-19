# Arquitectura

## Estado de estas decisiones

Las decisiones técnicas de este documento son el punto de partida aprobado para el diseño de Vincle Apps. Desde la entrega de base técnica del Gestor de Ofertas (DEV-002), las decisiones de esta sección están **implementadas** en código: Next.js con App Router, TypeScript estricto, PostgreSQL y Prisma. Ver [`../PROJECT_STATUS.md`](../PROJECT_STATUS.md) para el detalle de qué contiene exactamente esa entrega.

## Decisiones técnicas iniciales aprobadas

- Plataforma web interna.
- Arquitectura inicial de **monolito modular**: un único despliegue que organiza internamente los módulos (Gestor de Ofertas, ESM, FACT, Budget Comercial y Revenue Control, License Manager, Administración común) como unidades cohesionadas, en lugar de servicios independientes.
- Node.js y TypeScript como base del backend.
- Frontend con React/Next.js.
- PostgreSQL como base de datos central.
- Prisma como opción inicial de ORM.
- Repositorio privado de GitHub.
- Sin Docker, salvo autorización posterior expresa.
- Configuración y secretos fuera del código y del repositorio (ver [`SECURITY.md`](SECURITY.md)).
- Entornos separados de desarrollo, pruebas y producción.
- Reglas de negocio deterministas: la aplicación no necesita inteligencia artificial en producción para calcular jornadas, importes, márgenes o estados.
- Diseño preparado para integrar APIs y procesos de importación en el futuro (por ejemplo, License Manager o la migración completa del histórico de ofertas).

## Principio de monolito modular

Cada módulo de negocio (Gestor de Ofertas, ESM, FACT, etc.) se organiza como una unidad interna independiente en cuanto a dominio, con fronteras claras entre sus responsabilidades, pero se despliega como parte de un único proyecto. Esto permite:

- Compartir navegación, autenticación, maestros y auditoría sin duplicar infraestructura.
- Evolucionar hacia servicios independientes en el futuro si fuera necesario, sin que esa evolución sea un requisito de esta fase.

## Elementos compartidos entre módulos

- Menú lateral común, con secciones que se activan progresivamente por módulo (ver [`../offers/OVERVIEW.md`](../offers/OVERVIEW.md) para el menú previsto en la primera implementación).
- Autenticación y sesión de usuario.
- Maestros compartidos (ver [`../shared/MASTER_DATA.md`](../shared/MASTER_DATA.md)).
- Auditoría (ver [`SECURITY.md`](SECURITY.md)).
- Modelo de datos conceptual (ver [`DATA_MODEL.md`](DATA_MODEL.md)).

## Estructura de código (implementada en DEV-002)

El proyecto es un único monolito Next.js (App Router), organizado así:

```text
src/
  app/                  Rutas y composición de páginas (Next.js App Router).
  components/
    layout/             Layout común: menú lateral, cabecera, aviso de entorno.
    ui/                 Componentes de presentación realmente compartidos.
  modules/
    offers/             Dominio y casos de uso del Gestor de Ofertas.
    admin/              Administración de clientes y personas, y piezas comunes.
    master-data/        Los ocho catálogos: lectura y administración.
    audit/              Registro de auditoría compartido.
  lib/
    db/                 Cliente Prisma y traducción segura de errores.
    decimal.ts          Decimal exacto (parseo y suma con BigInt).
    format.ts           Serialización y formato español de fechas e importes.
    validation.ts       Primitivas de validación compartidas (zod).
    text.ts             Normalización de nombres y códigos.
prisma/
  schema.prisma         Modelo de datos.
  seed.ts / seed-data.ts Carga inicial idempotente de maestros.
  migrations/           Historial de migraciones.
```

Componentes de servidor por defecto. Son de cliente únicamente los que tienen interacción real: la navegación lateral (necesita la ruta actual), el formulario de oferta (recalcula el total de jornadas y muestra el motivo de cancelación según el estado) y las pantallas de Administración (edición en línea, estado de envío y confirmación de desactivación).

Las mutaciones se hacen con **Server Actions**; no existe ninguna API REST paralela. Las operaciones críticas —alta y modificación de ofertas con sus jornadas, histórico y auditoría, y cualquier cambio de maestro con su auditoría— se ejecutan dentro de una transacción de Prisma.

La única dependencia añadida en DEV-003 es `zod`, como motor de validación compartido entre alta y edición. No se ha añadido ninguna librería de formularios ni de componentes.

## Fuera de alcance en esta entrega

No se define todavía, por no estar decidido:

- Proveedor o mecanismo definitivo de autenticación. Ver la decisión temporal de posponerla en [`../decisions/DECISIONS.md`](../decisions/DECISIONS.md) (`DEC-019`, `DEC-056`).
- Infraestructura y estrategia de despliegue (ver [`../decisions/DECISIONS.md`](../decisions/DECISIONS.md)).
- El modelo de datos de importación (`ImportBatch`, `ImportIssue`) y de identidad (`User`, `Role`), descritos en [`DATA_MODEL.md`](DATA_MODEL.md), que corresponden a entregas posteriores.

## Identidad visual

Los tokens de color, la tipografía y los requisitos de accesibilidad de la interfaz están documentados en [`../design/BRAND_UI.md`](../design/BRAND_UI.md).
