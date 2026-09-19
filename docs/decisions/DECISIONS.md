# Registro de decisiones

Este documento es la fuente canónica del estado de cada decisión relevante del proyecto. Otros documentos enlazan aquí en lugar de repetir el estado de una decisión.

## Etiquetas

- **APROBADO**: decisión validada por el Product Owner, lista para diseñarse o implementarse.
- **PLANIFICADO**: forma parte de la visión o el roadmap, pero sin diseño funcional detallado todavía.
- **PENDIENTE**: decisión material sin resolver. No debe implementarse ni asumirse ningún criterio propio hasta que se apruebe.
- **IMPLEMENTADO**: decisión ya reflejada en código en el repositorio. Ninguna decisión tiene este estado a la fecha de esta entrega.

## Decisiones técnicas — APROBADO

| ID | Decisión | Referencia |
|---|---|---|
| DEC-001 | Arquitectura inicial de monolito modular | [`../architecture/ARCHITECTURE.md`](../architecture/ARCHITECTURE.md) |
| DEC-002 | Node.js y TypeScript en backend, React/Next.js en frontend | [`../architecture/ARCHITECTURE.md`](../architecture/ARCHITECTURE.md) |
| DEC-003 | PostgreSQL como base de datos central, Prisma como ORM inicial | [`../architecture/ARCHITECTURE.md`](../architecture/ARCHITECTURE.md) |
| DEC-004 | Sin Docker salvo autorización posterior expresa | [`../architecture/ARCHITECTURE.md`](../architecture/ARCHITECTURE.md) |
| DEC-005 | Reglas de negocio deterministas, sin IA en producción | [`../architecture/ARCHITECTURE.md`](../architecture/ARCHITECTURE.md) |

## Decisiones funcionales del Gestor de Ofertas — APROBADO

| ID | Decisión | Referencia |
|---|---|---|
| DEC-010 | Formato de numeración `VI` + `AAAA` + `MM` + `-` + contador global, contador nunca reiniciado ni reutilizado | [`../offers/BUSINESS_RULES.md`](../offers/BUSINESS_RULES.md) |
| DEC-011 | El número de oferta se asigna en el primer guardado, no al abrir el formulario | [`../offers/BUSINESS_RULES.md`](../offers/BUSINESS_RULES.md) |
| DEC-012 | El contador se administra desde un área protegida de Administración, no como CRUD ordinario | [`../offers/BUSINESS_RULES.md`](../offers/BUSINESS_RULES.md) |
| DEC-013 | Maestro común de personas; Comercial y PM no son entidades independientes | [`../shared/MASTER_DATA.md`](../shared/MASTER_DATA.md) |
| DEC-014 | Jornadas modeladas como relación oferta–perfil–jornadas, no como columnas fijas | [`../offers/BUSINESS_RULES.md`](../offers/BUSINESS_RULES.md) |
| DEC-015 | `Implantación` es un campo de texto libre, opcional y nullable en la primera versión | [`../offers/FIELDS.md`](../offers/FIELDS.md) |
| DEC-016 | Eliminación lógica de ofertas; el histórico nunca se borra físicamente | [`../offers/OVERVIEW.md`](../offers/OVERVIEW.md) |
| DEC-017 | Los maestros se desactivan, no se eliminan físicamente, cuando dejan de usarse | [`../shared/MASTER_DATA.md`](../shared/MASTER_DATA.md) |
| DEC-018 | Migración en dos etapas: piloto de un mes cerrado y migración completa posterior desde SQL Server | [`../offers/MIGRATION.md`](../offers/MIGRATION.md) |

## Decisiones planificadas — PLANIFICADO

| ID | Decisión | Referencia |
|---|---|---|
| DEC-030 | Incorporación futura de ESM, FACT, Budget Comercial y Revenue Control, License Manager, y Administración común | [`../product/VISION.md`](../product/VISION.md) |
| DEC-031 | Modelo futuro de implantaciones con relación muchos a muchos con clientes | [`../offers/FIELDS.md`](../offers/FIELDS.md) |
| DEC-032 | Exportación a Excel de la pantalla principal de ofertas, en una fase posterior | [`../offers/OVERVIEW.md`](../offers/OVERVIEW.md) |
| DEC-033 | Evolución del maestro de estados para incluir orden, estado activo, requisitos, carácter terminal y porcentaje comercial | [`../offers/STATUSES.md`](../offers/STATUSES.md) |

## Decisiones pendientes — PENDIENTE

| ID | Decisión pendiente | Referencia |
|---|---|---|
| DEC-050 | Si `Importe total = 0` es válido o debe ser siempre superior a cero | [`../offers/FIELDS.md`](../offers/FIELDS.md) |
| DEC-051 | Flujo y transiciones permitidas entre estados de oferta | [`../offers/STATUSES.md`](../offers/STATUSES.md) |
| DEC-052 | Estados que obligan a informar el identificador o pedido de Navision | [`../offers/STATUSES.md`](../offers/STATUSES.md) |
| DEC-053 | Momento y destinatarios de los correos automáticos | [`../offers/STATUSES.md`](../offers/STATUSES.md) |
| DEC-054 | Mes exacto que se usará para el piloto de migración | [`../offers/MIGRATION.md`](../offers/MIGRATION.md) |
| DEC-055 | Roles y permisos concretos de los usuarios no administradores | [`../architecture/DATA_MODEL.md`](../architecture/DATA_MODEL.md) |
| DEC-056 | Proveedor o mecanismo definitivo de autenticación | [`../architecture/ARCHITECTURE.md`](../architecture/ARCHITECTURE.md) |
| DEC-057 | Infraestructura y estrategia de despliegue | [`../architecture/ARCHITECTURE.md`](../architecture/ARCHITECTURE.md) |
| DEC-058 | Política de edición de ofertas históricas importadas | [`../offers/MIGRATION.md`](../offers/MIGRATION.md) |
| DEC-059 | Modelo definitivo de implantaciones y su relación muchos a muchos con clientes | [`../offers/FIELDS.md`](../offers/FIELDS.md) |
| DEC-060 | Tarifas, costes, márgenes y reglas de negocio de ESM | [`../product/VISION.md`](../product/VISION.md) |

Ninguna de las decisiones marcadas como `PENDIENTE` debe resolverse por iniciativa de un agente. Deben plantearse al Product Owner o esperar a un encargo que las resuelva explícitamente.
