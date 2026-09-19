# Modelo de datos conceptual

Este documento describe las entidades conceptuales necesarias para el Gestor de Ofertas y sus responsabilidades y relaciones principales.

## Estado de implementación

Estado tras DEV-004, en `prisma/schema.prisma`:

**Implementadas en PostgreSQL**, con migración acumulativa:

- Maestros de referencia (DEV-002): `Priority`, `Origin`, `OfferType`, `OfferStatus`, `Segmentation`, `ProfessionalProfile`, `Language`, `CancellationReason`.
- Núcleo transaccional (DEV-003): `Client` (con `code` desde DEV-004), `Person`, `Offer`, `OfferProfileDays`, `OfferStatusHistory`, `SystemCounter`, `AuditLog`.
- Autenticación, trazabilidad y notificaciones (DEV-004): `User`, `Session`, `OfferVersion`, `OfferComment`, `OfferAttachment`, `NotificationRule`, `NotificationRuleCondition`, `NotificationRuleAction`, `Notification`.

**Todavía conceptuales**, sin tabla ni código: `ImportBatch`, `ImportIssue`, y cualquier entidad de ESM, FACT, tarifas o implantaciones.

### Detalle de las tablas añadidas en DEV-004

| Modelo | Tabla | Notas |
|---|---|---|
| `User` | `users` | `username` único y normalizado, `passwordHash`, `role` (`ADMIN`/`USER`), `isActive`, `mustChangePassword`, relación uno a uno obligatoria con `Person`. |
| `Session` | `sessions` | Solo el hash SHA-256 del token, nunca el token en claro; `expiresAt`. |
| `OfferVersion` | `offer_versions` | `version` entero único dentro de la oferta (empieza en 1), instantánea inmutable de campos y jornadas en JSON validado, autor nullable. Restricción única `(offer_id, version)`. |
| `OfferComment` | `offer_comments` | `body`, autor, `createdAt`. Append-only: sin edición ni borrado desde la interfaz. |
| `OfferAttachment` | `offer_attachments` | `originalName`, `storageKey` (clave relativa, nunca ruta absoluta), `contentType`, `sizeBytes`, autor de subida, `removedAt`/`removedBy` para la retirada lógica. |
| `NotificationRule` | `notification_rules` | `key` estable y opcional (para las reglas del seed), `trigger`, `channel`, `isActive`, `sortOrder`. |
| `NotificationRuleCondition` | `notification_rule_conditions` | `group` (`ALL`/`ANY`), `field`, `operator`, y el valor en la columna tipada que corresponde al campo (`statusId`, `personId`, `clientId` o `booleanValue`). |
| `NotificationRuleAction` | `notification_rule_actions` | `kind` (destinatario) y `personId` solo cuando el destinatario es una persona concreta. |
| `Notification` | `notifications` | `userId`, `offerId` opcional, `trigger`, `channel`, `title`, `body`, `readAt`, `actorId`, `dedupeKey` único para no duplicar una notificación dentro del mismo evento. |

`Client.code` se añadió como columna nullable sobre la tabla existente, con índice único (`clients_code_key`, compatible con múltiples `NULL` en PostgreSQL): los clientes de DEV-003 conviven sin código hasta que se les asigne uno.

Índices añadidos, sin sobreindexar: por usuario y no leídas en `notifications`, por oferta y fecha en `offer_versions`/`offer_comments`/`offer_attachments`, por disparador y actividad en `notification_rules`.

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

## Principios

- Evitar duplicar datos derivados: se calculan o se derivan de su fuente salvo que exista una razón operativa (por ejemplo, reconciliación de importación) para conservarlos también de forma explícita.
- Los nombres visibles (de cliente, persona, estado, etc.) proceden de sus maestros; cuando sea necesario, se preservan snapshots históricos para no alterar el significado de datos ya guardados si el maestro cambia después. `OfferVersion.snapshot` es exactamente ese caso: incluye los identificadores y los nombres/códigos presentables necesarios para reconstruir la versión sin depender solo del valor actual del catálogo.
- Los maestros conservan sus registros usados mediante desactivación, no borrado físico (ver [`../shared/MASTER_DATA.md`](../shared/MASTER_DATA.md)).

## Entidades conceptuales

### Identidad y acceso

- **User**: usuario que accede a la plataforma. Relación uno a uno obligatoria con `Person`: no existe un usuario sin persona asociada. `role` distingue `ADMIN` de `USER` (`DEC-055`).
- **Session**: sesión activa de un usuario, identificada por el hash de un token aleatorio, con expiración.

### Personas y clientes

- **Person**: maestro común de personas. Una misma persona puede estar habilitada como comercial, como PM, o ambas cosas a la vez; no se modelan como entidades independientes (ver [`../shared/MASTER_DATA.md`](../shared/MASTER_DATA.md)).
- **Client**: cliente para el que se genera una oferta. `code` es obligatorio y único desde DEV-004 en altas y ediciones nuevas (`DEC-021`); los clientes de DEV-003 pueden tenerlo en `null` («Código pendiente»).

### Oferta y su detalle

- **Offer**: entidad central del Gestor de Ofertas. Referencia a `Client`, a las personas responsables (comercial y PM, vía `Person`), a los maestros de prioridad, origen, tipo y estado, a su creador (`User`, nullable para el histórico anterior al login) y contiene los campos descritos en [`../offers/FIELDS.md`](../offers/FIELDS.md). Su número se genera mediante el mecanismo descrito en [`../offers/BUSINESS_RULES.md`](../offers/BUSINESS_RULES.md).
- **OfferProfileDays**: detalle de jornadas de una oferta por perfil profesional. Relación oferta–perfil–jornadas; una oferta puede no tener ningún registro asociado. El total de jornadas de la oferta se deriva de este detalle, nunca se guarda como valor independiente.
- **OfferStatusHistory**: histórico de cambios de estado de una oferta, para trazabilidad. Complementa al estado actual de `Offer`.
- **OfferVersion**: instantánea inmutable de los campos funcionales y las jornadas de una oferta, en cada alta y en cada guardado que cambie algo. Nunca se edita ni se elimina.
- **OfferComment**: comentario interno de una oferta, con autor y fecha tomados siempre de la sesión.
- **OfferAttachment**: metadatos de un documento adjunto a una oferta; el binario vive en almacenamiento local fuera de Git (ver [`SECURITY.md`](SECURITY.md)).

### Maestros del Gestor de Ofertas

- **ProfessionalProfile**: perfil profesional (ver tabla de perfiles conocidos en [`../offers/BUSINESS_RULES.md`](../offers/BUSINESS_RULES.md)).
- **OfferType**: tipo de oferta.
- **OfferStatus**: estado de oferta. Ver campos previstos de evolución (orden, activo, requisitos, carácter terminal, porcentaje comercial) en [`../offers/STATUSES.md`](../offers/STATUSES.md).
- **Priority**: prioridad de la oferta.
- **Origin**: origen de la oferta.
- **Segmentation**: segmentación de la oferta.
- **CancellationReason**: motivo de cancelación, obligatorio cuando el estado de la oferta es `Anulado`.
- **Language**: `@deprecated` (hotfix DEV-005). `Idioma` se retiró de toda la experiencia funcional del Gestor de Ofertas; esta tabla y `Offer.languageId` se conservan sin uso, por compatibilidad con datos e instantáneas de versión ya existentes, pendientes de limpieza física futura.

### Numeración

- **SystemCounter**: contador global y seguro que alimenta la numeración de ofertas. Incremento atómico (`UPDATE ... RETURNING`) dentro de la transacción del alta. Administrado desde un área protegida (`/admin/counter`, `DEC-012`, implementado en DEV-004). Detalle de reglas en [`../offers/BUSINESS_RULES.md`](../offers/BUSINESS_RULES.md).

### Notificaciones (DEV-004)

- **NotificationRule**: regla configurable de notificación, con un disparador de una lista cerrada y un canal (`INTERNAL` o `INTERNAL_AND_EMAIL`, este último sin envío real todavía).
- **NotificationRuleCondition**: condición de una regla, agrupada en `ALL` («cumplir todas») o `ANY` («cumplir cualquiera»).
- **NotificationRuleAction**: destinatario de una regla (PM, comercial, creador, todos los administradores, o una persona concreta).
- **Notification**: notificación interna generada para un usuario concreto, con `dedupeKey` para no duplicarse si dos reglas coinciden en el mismo evento.

### Auditoría e importación

- **AuditLog**: registro de auditoría de altas, modificaciones, cambios de estado, revisiones, comentarios, adjuntos, gestión de usuarios, reglas de notificación y ajustes del contador (ver [`SECURITY.md`](SECURITY.md)). `actorId` es nullable: `null` para todo lo anterior al login de DEV-004. Conserva también las acciones históricas `ARCHIVE`/`RESTORE` de DEV-004: desde el hotfix DEV-005 no se generan eventos nuevos de ese tipo (`DEC-016` sustituida), pero el histórico ya existente no se reescribe.
- **ImportBatch**: lote de importación de datos históricos, con sistema de origen, fecha y trazabilidad del proceso.
- **ImportIssue**: incidencia detectada durante una importación, asociada a un `ImportBatch` y, cuando aplique, a la oferta afectada. Ver incidencias conocidas del histórico en [`../offers/MIGRATION.md`](../offers/MIGRATION.md).

## Relaciones principales (resumen)

- `Offer` → `Client`, `Person` (comercial), `Person` (PM), `Priority`, `Origin`, `OfferType`, `OfferStatus`, `Segmentation` (opcional), `CancellationReason` (condicional), `User` (creador, opcional). Las relaciones con `Language` y con `User` (archivado/recuperado por) quedan deprecadas y sin uso funcional (hotfix DEV-005).
- `Offer` 1—N `OfferProfileDays` → `ProfessionalProfile`.
- `Offer` 1—N `OfferStatusHistory` → `OfferStatus`, con actor (`User`, opcional).
- `Offer` 1—N `OfferVersion`, `OfferComment`, `OfferAttachment`, cada una con autor (`User`, opcional).
- `Offer` (opcional) → `ImportBatch`, cuando procede de una migración; puede generar `ImportIssue` asociadas.
- `User` 1—1 `Person`; `Person` puede estar habilitada como comercial, PM, o ambas cosas, sobre el mismo registro de maestro.
- `NotificationRule` 1—N `NotificationRuleCondition`, 1—N `NotificationRuleAction`, 1—N `Notification`.

## Explícitamente fuera de este modelo

- Maestro de implantaciones y su relación muchos a muchos con clientes: no existe todavía; en la primera versión, `Implantación` es un campo de texto libre en `Offer` (ver [`../offers/FIELDS.md`](../offers/FIELDS.md) y [`../decisions/DECISIONS.md`](../decisions/DECISIONS.md)).
- Reglas de coste, precio o tarifa asociadas a perfiles o jornadas: corresponden a ESM y a Administración común en fases futuras.
- Un objeto separado de «resultado de revisión» (aprobado/rechazado/cambios): la revisión se acredita con el nuevo estado, el histórico, la auditoría y la versión (ver [`../offers/STATUSES.md`](../offers/STATUSES.md)).
