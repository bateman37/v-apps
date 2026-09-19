# Modelo de datos conceptual

Este documento describe las entidades conceptuales necesarias para el Gestor de Ofertas y sus responsabilidades y relaciones principales. **No define migraciones, tipos SQL, índices ni nombres físicos definitivos.** Esa concreción corresponde a la entrega de implementación.

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

- **SystemCounter** (o mecanismo equivalente): contador global y seguro que alimenta la numeración de ofertas. Administrado desde un área protegida, no como CRUD ordinario. Detalle de reglas en [`../offers/BUSINESS_RULES.md`](../offers/BUSINESS_RULES.md).

### Auditoría e importación

- **AuditLog**: registro de auditoría de altas, modificaciones, cambios de estado, ajustes del contador e importaciones (ver [`SECURITY.md`](SECURITY.md)).
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
