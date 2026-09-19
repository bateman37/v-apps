# Modelo de datos conceptual

Este documento describe las entidades conceptuales necesarias para el Gestor de Ofertas y sus responsabilidades y relaciones principales.

## Estado de implementación

Estado tras DEV-003, en `prisma/schema.prisma`:

**Implementadas en PostgreSQL**, con migración acumulativa:

- Maestros de referencia (DEV-002): `Priority`, `Origin`, `OfferType`, `OfferStatus`, `Segmentation`, `ProfessionalProfile`, `Language`, `CancellationReason`.
- Núcleo transaccional (DEV-003): `Client`, `Person`, `Offer`, `OfferProfileDays`, `OfferStatusHistory`, `SystemCounter`, `AuditLog`.

**Todavía conceptuales**, sin tabla ni código: `User`, `Role`, `ImportBatch`, `ImportIssue`, y cualquier entidad de ESM, FACT, tarifas o implantaciones.

### Detalle de las tablas añadidas en DEV-003

| Modelo | Tabla | Notas |
|---|---|---|
| `Client` | `clients` | `name`, `isActive`, timestamps. `nameNormalized` es una columna derivada (minúsculas, espacios colapsados) con **restricción única**: es la forma compatible con PostgreSQL de impedir duplicados exactos de nombre sin depender de una extensión ni de un índice funcional que Prisma no modela. La aplicación la calcula siempre a partir de `name`. |
| `Person` | `people` | `name`, `canBeCommercial`, `canBeProjectManager`, `isActive`, timestamps. Sin email, teléfono, departamento ni credenciales. |
| `Offer` | `offers` | `number` único e inmutable; importes y jornadas en `numeric` exacto (`numeric(14,2)` y `numeric(8,2)`), nunca coma flotante; fechas de negocio como `date`; `deletedAt` nullable para la eliminación lógica aprobada. |
| `OfferProfileDays` | `offer_profile_days` | Restricción única `(offer_id, professional_profile_id)`. Sin timestamps: no aportarían trazabilidad real y no se usarían. |
| `OfferStatusHistory` | `offer_status_history` | Estado anterior nullable para el alta inicial, estado nuevo, `changedAt` y `actorId` nullable. |
| `SystemCounter` | `system_counters` | Clave única y valor entero. Única clave en uso: `offer_number`. |
| `AuditLog` | `audit_logs` | Tipo de entidad, identificador, acción, `changes` en JSON y `actorId` nullable. |

Índices creados: la clave única de `offers.number`, un índice por cada clave foránea usada como filtro (`clientId`, `commercialId`, `projectManagerId`, `statusId`, `offerTypeId`, `originId`, `priorityId`, `segmentationId`, `languageId`, `cancellationReasonId`), un índice compuesto `(deletedAt, offerDate)` para el listado, `(offerId, changedAt)` en el histórico y `(entityType, entityId, createdAt)` más `(createdAt)` en la auditoría. No se han creado índices especulativos.

## Principios

- Evitar duplicar datos derivados: se calculan o se derivan de su fuente salvo que exista una razón operativa (por ejemplo, reconciliación de importación) para conservarlos también de forma explícita.
- Los nombres visibles (de cliente, persona, estado, etc.) proceden de sus maestros; cuando sea necesario, se preservan snapshots históricos para no alterar el significado de datos ya guardados si el maestro cambia después.
- Los maestros conservan sus registros usados mediante desactivación, no borrado físico (ver [`../shared/MASTER_DATA.md`](../shared/MASTER_DATA.md)).

## Entidades conceptuales

### Identidad y acceso

- **User**: usuario que accede a la plataforma. Su relación con `Person` y con los roles de negocio (comercial, PM) todavía no está cerrada (ver decisiones pendientes).
- **Role**: rol de acceso a la plataforma, para control de permisos. Su diseño detallado está pendiente (ver [`../decisions/DECISIONS.md`](../decisions/DECISIONS.md)).

### Personas y clientes

- **Person**: maestro común de personas. Una misma persona puede estar habilitada como comercial, como PM, o ambas cosas a la vez; no se modelan como entidades independientes (ver [`../shared/MASTER_DATA.md`](../shared/MASTER_DATA.md)).
- **Client**: cliente para el que se genera una oferta.

### Oferta y su detalle

- **Offer**: entidad central del Gestor de Ofertas. Referencia a `Client`, a las personas responsables (comercial y PM, vía `Person`), a los maestros de prioridad, origen, tipo y estado, y contiene los campos descritos en [`../offers/FIELDS.md`](../offers/FIELDS.md). Su número se genera mediante el mecanismo descrito en [`../offers/BUSINESS_RULES.md`](../offers/BUSINESS_RULES.md).
- **OfferProfileDays**: detalle de jornadas de una oferta por perfil profesional. Relación oferta–perfil–jornadas; una oferta puede no tener ningún registro asociado. El total de jornadas de la oferta se deriva de este detalle, nunca se guarda como valor independiente.
- **OfferStatusHistory**: histórico de cambios de estado de una oferta, para trazabilidad. Complementa al estado actual de `Offer`.

### Maestros del Gestor de Ofertas

- **ProfessionalProfile**: perfil profesional (ver tabla de perfiles conocidos en [`../offers/BUSINESS_RULES.md`](../offers/BUSINESS_RULES.md)).
- **OfferType**: tipo de oferta.
- **OfferStatus**: estado de oferta. Ver campos previstos de evolución (orden, activo, requisitos, carácter terminal, porcentaje comercial) en [`../offers/STATUSES.md`](../offers/STATUSES.md).
- **Priority**: prioridad de la oferta.
- **Origin**: origen de la oferta.
- **Segmentation**: segmentación de la oferta.
- **CancellationReason**: motivo de cancelación, obligatorio cuando el estado de la oferta es `Anulado`.
- **Language**: idioma de la oferta.

### Numeración

- **SystemCounter**: contador global y seguro que alimenta la numeración de ofertas. Implementado con incremento atómico (`UPDATE ... RETURNING`) dentro de la transacción del alta. La administración desde un área protegida (`DEC-012`) **no** está implementada: sin autenticación no podría considerarse protegida. Detalle de reglas en [`../offers/BUSINESS_RULES.md`](../offers/BUSINESS_RULES.md).

### Auditoría e importación

- **AuditLog**: registro de auditoría de altas, modificaciones, cambios de estado, activaciones y desactivaciones (ver [`SECURITY.md`](SECURITY.md)). Implementado para ofertas, clientes, personas y catálogos. Los ajustes del contador y las importaciones se auditarán cuando existan.
- **ImportBatch**: lote de importación de datos históricos, con sistema de origen, fecha y trazabilidad del proceso.
- **ImportIssue**: incidencia detectada durante una importación, asociada a un `ImportBatch` y, cuando aplique, a la oferta afectada. Ver incidencias conocidas del histórico en [`../offers/MIGRATION.md`](../offers/MIGRATION.md).

## Relaciones principales (resumen)

- `Offer` → `Client`, `Person` (comercial), `Person` (PM), `Priority`, `Origin`, `OfferType`, `OfferStatus`, `Segmentation` (opcional), `CancellationReason` (condicional), `Language` (opcional).
- `Offer` 1—N `OfferProfileDays` → `ProfessionalProfile`.
- `Offer` 1—N `OfferStatusHistory` → `OfferStatus`.
- `Offer` (opcional) → `ImportBatch`, cuando procede de una migración; puede generar `ImportIssue` asociadas.
- `Person` puede estar habilitada como comercial, PM, o ambas cosas, sobre el mismo registro de maestro.

## Explícitamente fuera de este modelo

- Maestro de implantaciones y su relación muchos a muchos con clientes: no existe todavía; en la primera versión, `Implantación` es un campo de texto libre en `Offer` (ver [`../offers/FIELDS.md`](../offers/FIELDS.md) y [`../decisions/DECISIONS.md`](../decisions/DECISIONS.md)).
- Reglas de coste, precio o tarifa asociadas a perfiles o jornadas: corresponden a ESM y a Administración común en fases futuras.
