# Gestor de Ofertas — visión funcional

## Objetivo

Sustituir el Excel actual, conectado a SQL Server, por un módulo web sobre PostgreSQL, manteniendo el histórico, mejorando la trazabilidad y preparando la conexión futura con ESM, FACT y el resto de Vincle Apps.

El Excel actual contiene aproximadamente 1.254 ofertas históricas, una tabla de jornadas por perfil, maestros, generación de correos y lógica de validación.

## Navegación implementada

La plataforma tiene un menú lateral común (ver [`../architecture/ARCHITECTURE.md`](../architecture/ARCHITECTURE.md)). Desde DEV-004 muestra:

- **Gestor de Ofertas**
  - Todas las ofertas (`/offers`)
  - Nueva oferta (`/offers/new`)
  - Pendiente de revisión (`/offers/pending-review`)
  - Ofertas archivadas (`/offers?scope=archivadas`)
- **Administración** (solo `ADMIN`)
  - Clientes (`/admin/clients`)
  - Personas (`/admin/people`)
  - Maestros de oferta (`/admin/master-data`)
  - Usuarios (`/admin/users`)
  - Reglas de notificación (`/admin/notification-rules`)
  - Contador de ofertas (`/admin/counter`)

Un acceso global a **Notificaciones**, con contador de no leídas, está disponible en la cabecera para cualquier persona autenticada.

El menú debe quedar preparado para incorporar otros módulos (ESM, FACT, Budget Comercial, License Manager), pero no se crean ahora páginas vacías para ellos.

## Pantalla principal de ofertas

Implementada en `/offers`, sustituyendo la tabla del Excel:

- Listado real leído de PostgreSQL, con número, fecha, cliente, descripción resumida, comercial, PM, estado, importe, total de jornadas por perfil y acceso a la oferta.
- Un usuario no administrador solo ve las ofertas de las que es creador, comercial o PM asignado (`DEC-055`); un administrador ve todas.
- Formato monetario español en euros y fechas `DD/MM/AAAA`.
- Búsqueda por número, descripción, cliente o solicitante.
- Filtros combinables por año, mes, cliente, comercial, PM, estado, tipo de oferta y origen, con botón para limpiarlos.
- Ordenación por número, fecha, cliente, estado e importe.
- Paginación de 25 registros que conserva filtros, orden y ámbito (activas/archivadas).
- Todo el estado vive en parámetros de URL, de modo que una pantalla filtrada es reproducible.
- Recuento de resultados y suma de importe y de jornadas sobre el **conjunto filtrado completo**, no solo sobre la página visible.
- Estado vacío honesto, con acceso directo a crear la primera oferta.
- **Exportación a Excel** (`DEC-032`) con exactamente los mismos filtros, permisos y ámbito que la pantalla, en tres hojas: `Ofertas`, `Jornadas` e `Historial`.

## Archivo lógico y recuperación (DEC-016)

- Archivar una oferta la oculta del listado ordinario, con confirmación, registro de fecha/usuario y auditoría; nunca la borra físicamente.
- «Ofertas archivadas» (`/offers?scope=archivadas`) muestra exactamente esas, con la misma búsqueda, filtros y exportación que el listado ordinario.
- Recuperar devuelve la oferta al listado normal con el mismo número y los mismos datos.
- Comentarios, versiones, histórico, auditoría, adjuntos y notificaciones permanecen asociados a la oferta archivada.
- Para modificar los datos funcionales de una oferta archivada, primero hay que recuperarla.

## Formulario de oferta

El alta (`/offers/new`) y la modificación (`/offers/[id]/edit`) reutilizan el mismo componente y las mismas reglas de validación. Tras cualquier error del servidor, se recuperan y se vuelven a mostrar todos los valores enviados, incluidas las jornadas de todos los perfiles: no hay que rellenar de nuevo el formulario. El detalle de campos está en [`FIELDS.md`](FIELDS.md).

## Ficha de la oferta

La consulta (`/offers/[id]`) muestra todos los datos, el detalle de jornadas con el total calculado, el histórico de estados con autor, y añade desde DEV-004:

- **Comentarios internos**: autor y fecha siempre de la sesión, nunca escritos por quien comenta.
- **Adjuntos**: subida y descarga autenticada, hasta 25 MB, con formatos cerrados (PDF, Word, Excel, PowerPoint, imágenes, `.msg`). Retirar un adjunto es lógico, no borra el fichero.
- **Archivar/recuperar**, cuando la persona puede modificar la oferta.
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
