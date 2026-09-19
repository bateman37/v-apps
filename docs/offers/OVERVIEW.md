# Gestor de Ofertas — visión funcional

## Objetivo

Sustituir el Excel actual, conectado a SQL Server, por un módulo web sobre PostgreSQL, manteniendo el histórico, mejorando la trazabilidad y preparando la conexión futura con ESM, FACT y el resto de Vincle Apps.

El Excel actual contiene aproximadamente 1.254 ofertas históricas, una tabla de jornadas por perfil, maestros, generación de correos y lógica de validación.

## Navegación implementada

La plataforma tiene un menú lateral común (ver [`../architecture/ARCHITECTURE.md`](../architecture/ARCHITECTURE.md)). Desde DEV-005 muestra:

- **Panel de notificaciones** (`/notificaciones`), antes que el Gestor de Ofertas: es la entrada principal de cualquier persona autenticada.
- **Gestor de Ofertas**
  - Todas las ofertas (`/offers`)
  - Nueva oferta (`/offers/new`)
  - Pendiente de revisión (`/offers/pending-review`)
- **Administración** (solo `ADMIN`)
  - Clientes (`/admin/clients`)
  - Personas y accesos (`/admin/people`)
  - Maestros de oferta (`/admin/master-data`)
  - Reglas de notificación (`/admin/notification-rules`)
  - Contador de ofertas (`/admin/counter`)

Un acceso global a **Notificaciones**, con contador de no leídas, sigue disponible en la cabecera para cualquier persona autenticada. Tras iniciar sesión, un `USER` aterriza en `/notificaciones`; un `ADMIN` conserva `/offers` (hotfix DEV-005).

`/admin/users` ya no es una pantalla propia: redirige a `/admin/people` para no romper marcadores existentes (hotfix DEV-005, bloque 7). `Personas y accesos` gestiona en una sola pantalla el maestro de personas y sus cuentas de acceso, que **siguen siendo entidades separadas** (`Person` y `User`): la pantalla solo las presenta y las administra juntas.

El menú debe quedar preparado para incorporar otros módulos (ESM, FACT, Budget Comercial, License Manager), pero no se crean ahora páginas vacías para ellos.

## Pantalla principal de ofertas

Implementada en `/offers`, sustituyendo la tabla del Excel:

- Listado real leído de PostgreSQL, con número, fecha, cliente, descripción resumida, comercial, PM, estado, importe, total de jornadas por perfil y acceso a la oferta.
- Un usuario no administrador solo ve las ofertas de las que es creador, comercial o PM asignado (`DEC-055`); un administrador ve todas.
- El selector de cliente, en pantallas operativas (ofertas, filtros, reglas de notificación), muestra únicamente el **nombre** del cliente, nunca su código (hotfix DEV-005, bloque 1). El código sigue siendo obligatorio y único en `/admin/clients` y en la exportación.
- Formato monetario español en euros y fechas `DD/MM/AAAA`.
- Búsqueda por número, descripción, cliente o solicitante.
- Filtros combinables por **fecha de oferta** (`Desde`/`Hasta`, rango inclusivo), cliente, comercial, PM, **estado (multiselección)**, tipo de oferta y origen, con botón para limpiarlos (hotfix DEV-005, bloque 6). Sin ningún filtro informado, el listado muestra todas las fechas y todos los estados, incluido `Anulado`.
- Ordenación por número, fecha, cliente, estado e importe.
- Paginación de 25 registros que conserva los filtros y el orden.
- Todo el estado vive en parámetros de URL (los estados seleccionados como `statusId` repetible), de modo que una pantalla filtrada es reproducible.
- Recuento de resultados y suma de importe y de jornadas sobre el **conjunto filtrado completo**, no solo sobre la página visible.
- Estado vacío honesto, con acceso directo a crear la primera oferta.
- **Exportación a Excel** (`DEC-032`) con exactamente los mismos filtros y permisos que la pantalla, en tres hojas: `Ofertas`, `Jornadas` e `Historial`.

## Sin archivo lógico de ofertas (`DEC-016` sustituida)

Desde el hotfix DEV-005, el Gestor de Ofertas **no tiene** concepto funcional de oferta archivada:

- No existen los botones `Archivar` ni `Recuperar`, ni una vista separada de «Ofertas archivadas».
- Toda oferta accesible por el usuario es siempre localizable en `/offers`, filtrable y exportable, sea cual sea su estado, incluido `Anulado`.
- Si una oferta se cancela, su estado de negocio es `Anulado`; ya no existe un concepto de archivo independiente del estado.
- Las ofertas archivadas durante DEV-004 se recuperaron automáticamente en la migración de este hotfix; las columnas técnicas de archivo (`deletedAt`, `archivedById`, `restoredAt`, `restoredById`) se conservan en el esquema, deprecadas y sin uso funcional, y las auditorías históricas de archivo/recuperación que ya existieran se conservan tal cual.

## Formulario de oferta

El alta (`/offers/new`) y la modificación (`/offers/[id]/edit`) reutilizan el mismo componente y las mismas reglas de validación. Tras cualquier error del servidor, se recuperan y se vuelven a mostrar todos los valores enviados, incluidas las jornadas de todos los perfiles: no hay que rellenar de nuevo el formulario. El detalle de campos está en [`FIELDS.md`](FIELDS.md).

## Ficha de la oferta

La consulta (`/offers/[id]`) muestra todos los datos, el detalle de jornadas con el total calculado, el histórico de estados con autor, y añade desde DEV-004:

- **Comentarios internos**: autor y fecha siempre de la sesión, nunca escritos por quien comenta. Bajo `Observaciones` no hay texto de ayuda adicional (hotfix DEV-005, bloque 3): el campo, su versionado y el historial de comentarios se mantienen sin cambios.
- **Adjuntos**: subida y descarga autenticada, hasta 25 MB, con formatos cerrados (PDF, Word, Excel, PowerPoint, imágenes, `.msg`). Retirar un adjunto es lógico, no borra el fichero.
- **Revisar**, cuando la oferta está en la bandeja de revisión pendiente de la persona (ver [`STATUSES.md`](STATUSES.md)).

## Bandeja «Pendiente de revisión»

`/offers/pending-review` muestra las ofertas en `A valorar PM` (para su PM asignado) o `Entregado a comercial` (para su comercial asignado). Un administrador ve todas y puede filtrar por tipo, comercial, PM, cliente y antigüedad; un usuario normal solo ve las suyas. Se deriva del estado y la asignación: no es un circuito paralelo de aprobaciones.

## Documentos relacionados

- [`FIELDS.md`](FIELDS.md): campos obligatorios y opcionales del formulario.
- [`BUSINESS_RULES.md`](BUSINESS_RULES.md): numeración de ofertas, jornadas por perfil y otras reglas de negocio conocidas.
- [`STATUSES.md`](STATUSES.md): estados de oferta, flujo y notificaciones asociadas.
- [`MIGRATION.md`](MIGRATION.md): estrategia de migración desde el histórico en SQL Server/Excel.
- [`../shared/MASTER_DATA.md`](../shared/MASTER_DATA.md): maestros utilizados por el Gestor de Ofertas.
- [`../architecture/DATA_MODEL.md`](../architecture/DATA_MODEL.md): modelo conceptual de datos.
- [`../architecture/SECURITY.md`](../architecture/SECURITY.md): autenticación, autorización y adjuntos.
- [`../decisions/DECISIONS.md`](../decisions/DECISIONS.md): decisiones aprobadas y pendientes que afectan a este módulo.
