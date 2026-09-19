# Registro de decisiones

Este documento es la fuente canónica del estado de cada decisión relevante del proyecto. Otros documentos enlazan aquí en lugar de repetir el estado de una decisión.

## Etiquetas

- **APROBADO**: decisión validada por el Product Owner, lista para diseñarse o implementarse.
- **PLANIFICADO**: forma parte de la visión o el roadmap, pero sin diseño funcional detallado todavía.
- **PENDIENTE**: decisión material sin resolver. No debe implementarse ni asumirse ningún criterio propio hasta que se apruebe.
- **IMPLEMENTADO**: decisión ya reflejada en código en el repositorio.

Una decisión `APROBADO` puede estar además implementada; cuando así sea se indica explícitamente en la columna «Estado de implementación».

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
| DEC-016 | Archivo lógico de ofertas (no «Anulado», que es un estado de negocio distinto); el histórico nunca se borra físicamente y puede recuperarse | [`../offers/OVERVIEW.md`](../offers/OVERVIEW.md) |
| DEC-017 | Los maestros se desactivan, no se eliminan físicamente, cuando dejan de usarse | [`../shared/MASTER_DATA.md`](../shared/MASTER_DATA.md) |
| DEC-018 | Migración en dos etapas: piloto de un mes cerrado y migración completa posterior desde SQL Server | [`../offers/MIGRATION.md`](../offers/MIGRATION.md) |
| DEC-020 | `Importe total = 0` es un valor **válido**, siempre que el campo se haya informado explícitamente: vacío no es válido, un valor negativo no es válido y `0,00 €` sí lo es. El importe se almacena como decimal de base de datos con dos posiciones. | [`../offers/FIELDS.md`](../offers/FIELDS.md) |
| DEC-021 | Código de cliente (`Client.code`): obligatorio en altas y ediciones nuevas, único, solo se recortan espacios exteriores, se conserva la capitalización del usuario. Los clientes de DEV-003 se migran con el código en `null` («Código pendiente») y no pueden guardarse de nuevo ni elegirse en una oferta nueva sin informarlo; sus ofertas históricas siguen siendo consultables y editables. | [`../shared/MASTER_DATA.md`](../shared/MASTER_DATA.md) |
| DEC-051 | Flujo de estados: de forma general, una oferta activa puede pasar a cualquier otro estado activo; no hay estados terminales ni un motor configurable de transiciones. Completar una revisión desde la bandeja exige elegir un estado distinto del que la generó. | [`../offers/STATUSES.md`](../offers/STATUSES.md) |
| DEC-052 | `navisionOrder` es obligatorio cuando el estado técnico es `ACCEPTED` (`Aceptado`), tanto al crear como al editar o revisar. Abandonar `Aceptado` no borra un pedido ya informado. | [`../offers/STATUSES.md`](../offers/STATUSES.md) |
| DEC-053 | Notificaciones internas configurables por Administración mediante reglas (disparador, condiciones `TODAS`/`CUALQUIERA` y destinatarios). El canal `Interna + email` puede seleccionarse y conserva la intención, pero **el envío por email no está configurado ni se simula** en esta entrega: solo se genera la notificación interna. | [`../offers/STATUSES.md`](../offers/STATUSES.md) |
| DEC-055 | Roles iniciales `ADMIN` y `USER` (autenticación local provisional, ver `DEC-019`). Un `ADMIN` ve y administra todo. Un `USER` crea ofertas y accede a una oferta si es su creador, su comercial asignado o su Project Manager asignado; no accede a Administración. | [`../architecture/DATA_MODEL.md`](../architecture/DATA_MODEL.md) |

### Estado de implementación de las decisiones funcionales

| ID | Estado de implementación |
|---|---|
| DEC-010, DEC-011 | **IMPLEMENTADO** (DEV-003): numeración `VI`+`AAAA`+`MM`+`-`+contador global, asignada en el primer guardado dentro de una transacción. |
| DEC-012 | **IMPLEMENTADO** (DEV-004): `/admin/counter`, solo `ADMIN`. Inicializa el contador si falta, lo ajusta con confirmación reforzada y nunca permite reducirlo. La inicialización con el último contador del Excel legado en el cierre definitivo sigue sin implementarse: no forma parte de esta entrega. |
| DEC-013 | **IMPLEMENTADO** (DEV-003): maestro único `Person` con dos indicadores. |
| DEC-014 | **IMPLEMENTADO** (DEV-003): `OfferProfileDays`; el total se deriva y no se almacena. |
| DEC-015 | **IMPLEMENTADO** (DEV-003): `implantationText` como texto libre nullable. |
| DEC-016 | **IMPLEMENTADO** (DEV-004): acción «Archivar»/«Recuperar» visible en la ficha, con confirmación, auditoría y vista «Ofertas archivadas» (`/offers?scope=archivadas`), con los mismos filtros y exportación que el listado ordinario. |
| DEC-017 | **IMPLEMENTADO** (DEV-003): clientes, personas y los ocho catálogos solo se desactivan; no hay borrado físico en ninguna pantalla. |
| DEC-018 | **APROBADO, no implementado**: la migración no forma parte de DEV-003 ni de DEV-004. |
| DEC-020 | **IMPLEMENTADO** (DEV-003): validado en alta y edición, con pruebas automatizadas. |
| DEC-021 | **IMPLEMENTADO** (DEV-004): campo, validación y aviso «Código pendiente» en `/admin/clients`; un cliente sin código queda excluido de la selección en ofertas nuevas. |
| DEC-051 | **IMPLEMENTADO** (DEV-004): la bandeja «Pendiente de revisión» exige un estado distinto del que generó la pendiente; cualquier otra transición entre estados activos está permitida sin restricción adicional. |
| DEC-052 | **IMPLEMENTADO** (DEV-004): validado en servidor en alta, edición y revisión. |
| DEC-053 | **IMPLEMENTADO parcialmente** (DEV-004): motor de reglas, tres reglas iniciales (oferta creada, `A valorar PM`, `Entregado a comercial`) y centro de notificaciones. El canal `Interna + email` no envía ni simula ningún correo: sigue pendiente el proveedor real (ver «Fuera de alcance» más abajo). |
| DEC-055 | **IMPLEMENTADO** (DEV-004): autenticación local provisional (`DEC-019`), `requireUser`/`requireAdmin` en cada página y cada Server Action, y `canAccessOffer` aplicado de forma uniforme en listado, ficha, mutaciones, adjuntos y exportación. |

## Decisiones técnicas temporales — APROBADO

| ID | Decisión | Referencia |
|---|---|---|
| DEC-019 | Autenticación local provisional, **implementada desde DEV-004**: login con usuario y contraseña, sesión por cookie `HttpOnly`, roles `ADMIN`/`USER` y autorización comprobada en servidor. No es SSO, OAuth, LDAP ni el mecanismo corporativo definitivo (eso sigue siendo `DEC-056`, `PENDIENTE`). La interfaz muestra de forma visible `Entorno local · autenticación local provisional`, y no debe exponerse en una red accesible ni usarse en producción mientras esta decisión siga vigente. | [`../architecture/SECURITY.md`](../architecture/SECURITY.md), [`../../README.md`](../../README.md) |

## Decisiones planificadas — PLANIFICADO

| ID | Decisión | Referencia |
|---|---|---|
| DEC-030 | Incorporación futura de ESM, FACT, Budget Comercial y Revenue Control, License Manager, y Administración común | [`../product/VISION.md`](../product/VISION.md) |
| DEC-031 | Modelo futuro de implantaciones con relación muchos a muchos con clientes | [`../offers/FIELDS.md`](../offers/FIELDS.md) |
| DEC-033 | Evolución del maestro de estados para incluir orden, estado activo, requisitos, carácter terminal y porcentaje comercial | [`../offers/STATUSES.md`](../offers/STATUSES.md) |

## Decisiones aprobadas e implementadas — APROBADO / IMPLEMENTADO

| ID | Decisión | Referencia |
|---|---|---|
| DEC-032 | Exportación a Excel del listado de ofertas, con los mismos filtros, permisos y ámbito (activas/archivadas) que la pantalla, en tres hojas: `Ofertas`, `Jornadas` e `Historial` | [`../offers/OVERVIEW.md`](../offers/OVERVIEW.md) |

## Decisiones pendientes — PENDIENTE

| ID | Decisión pendiente | Referencia |
|---|---|---|
| DEC-054 | Mes exacto que se usará para el piloto de migración | [`../offers/MIGRATION.md`](../offers/MIGRATION.md) |
| DEC-056 | Proveedor o mecanismo definitivo de autenticación (corporativo, no la autenticación local provisional de `DEC-019`) | [`../architecture/ARCHITECTURE.md`](../architecture/ARCHITECTURE.md) |
| DEC-057 | Infraestructura y estrategia de despliegue | [`../architecture/ARCHITECTURE.md`](../architecture/ARCHITECTURE.md) |
| DEC-058 | Política de edición de ofertas históricas importadas | [`../offers/MIGRATION.md`](../offers/MIGRATION.md) |
| DEC-059 | Modelo definitivo de implantaciones y su relación muchos a muchos con clientes | [`../offers/FIELDS.md`](../offers/FIELDS.md) |
| DEC-060 | Tarifas, costes, márgenes y reglas de negocio de ESM | [`../product/VISION.md`](../product/VISION.md) |
| DEC-061 | Proveedor y configuración real de email para el canal `Interna + email` de las reglas de notificación | [`../offers/STATUSES.md`](../offers/STATUSES.md) |

> `DEC-050` («si `Importe total = 0` es válido») fue resuelta en DEV-003 y sustituida por `DEC-020`. No debe reintroducirse como pendiente.

Ninguna de las decisiones marcadas como `PENDIENTE` debe resolverse por iniciativa de un agente. Deben plantearse al Product Owner o esperar a un encargo que las resuelva explícitamente.

## Limitaciones vigentes de la autenticación local (DEC-019)

Mientras `DEC-019` siga siendo la autenticación local provisional y `DEC-056` siga pendiente:

- No hay SSO, OAuth, LDAP ni recuperación de contraseña por email: un administrador genera una contraseña temporal explícita desde `/admin/users`.
- La aplicación es únicamente apta para desarrollo local; no debe exponerse en una red accesible ni usarse con datos reales de clientes o empleados.
- La auditoría (`AuditLog`) y el histórico de estados anteriores al login conservan `actorId = null` y se muestran como «Usuario no disponible (registro anterior al login)»: no se reescribe el pasado ni se inventa un actor.
