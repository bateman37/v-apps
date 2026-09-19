# Changelog

Registro de entregas realizadas sobre `v-apps`. Cada entrada resume el objetivo y el resultado de una entrega, con enlace al prompt que la originó.

## [Sin versionar] — Hotfix de usabilidad del Gestor de Ofertas y notificaciones

- **Prompt**: [`prompts/0005-hotfix-usabilidad-ofertas-notificaciones.md`](prompts/0005-hotfix-usabilidad-ofertas-notificaciones.md)
- **Tipo**: hotfix funcional sobre DEV-004, a partir de las primeras pruebas reales del Product Owner. No amplía el producto con módulos nuevos.
- **Resumen**:
  - **Cliente solo por nombre fuera de su maestro**: los selectores operativos (ofertas, filtros, reglas de notificación) muestran únicamente el nombre del cliente; el código sigue siendo obligatorio y único en `/admin/clients` y se conserva en la exportación.
  - **`Idioma` retirado** de alta, edición, ficha, Administración > Maestros de oferta, filtros, exportación y nuevas instantáneas de versión. `Language` y `Offer.languageId` quedan deprecados y sin uso funcional, conservados por compatibilidad técnica (sin migración destructiva).
  - **Observaciones**: se retira el texto de ayuda bajo el campo; se conservan el campo, su versionado y el historial de comentarios.
  - **Hotfix bloqueante de adjuntos**: se elimina la combinación incompatible de `encType` manual con una Server Action en `attachment-controls.tsx` (causaba el error de React y, en archivos grandes, `Failed to fetch`), y se amplía el límite de transporte de las Server Actions (`experimental.serverActions.bodySizeLimit`) con margen para el límite funcional estricto de 25 MB.
  - **Sin archivo lógico de ofertas** (`DEC-016` sustituida por `DEC-016b`): se eliminan «Archivar»/«Recuperar», la vista «Ofertas archivadas» y el parámetro `scope`; toda oferta, incluida `Anulado`, es siempre localizable, filtrable y exportable. Migración de datos que recupera automáticamente las ofertas archivadas durante DEV-004 y desactiva de forma segura cualquier regla de notificación con la condición `ARCHIVED` (ninguna la usaba en el seed inicial).
  - **Filtros del listado**: `Año`/`Mes` se sustituyen por `Fecha desde`/`Fecha hasta` (rango inclusivo sobre `offerDate`), con aviso y sin ejecutar la consulta si `Desde` es posterior a `Hasta`. El selector único de `Estado` se sustituye por una multiselección accesible (`<details>` con casillas, parámetro `statusId` repetible), sin filtro por defecto equivalente a «todos los estados». Todo persiste en la URL, la paginación, la ordenación y la exportación.
  - **«Personas y accesos»** (`/admin/people`): pantalla única de Administración para el maestro de personas y sus cuentas de acceso, creando o gestionando el acceso desde la propia fila. `Person` y `User` siguen siendo modelos separados; `/admin/users` redirige a la pantalla unificada.
  - **Reglas de notificación con filas progresivas**: cada bloque (`TODAS`, `CUALQUIERA`, `Destinatarios`) empieza con una única fila vacía y añade la siguiente al completarla, hasta el máximo de cuatro ya existente. Se retira `ARCHIVED` del catálogo de condiciones seleccionables (el valor del enum se conserva por compatibilidad).
  - **Panel de notificaciones como entrada principal**: aparece en el menú antes del Gestor de Ofertas. Un `USER` aterriza en `/notificaciones` tras iniciar sesión, al visitar `/` y tras completar el cambio obligatorio de contraseña; un `ADMIN` conserva `/offers`.
- **Migración**: `20260919180000_dev005_offers_archive_removal_and_rule_cleanup`, de datos (sin cambios de esquema): recupera las ofertas archivadas de DEV-004 y desactiva reglas de notificación que usaran `ARCHIVED`.
- **Decisión sustituida**: `DEC-016` → `DEC-016b`. Nuevas decisiones registradas: `DEC-062`, `DEC-063`, `DEC-064`, `DEC-065`.
- **Pruebas añadidas**: parser/serializador de filtros (`dateFrom`, `dateTo`, varios `statusId`), construcción de la condición Prisma (rango inclusivo, `statusId in [...]`), estado inicial sin filtros, y el helper puro de filas progresivas de las reglas de notificación.
- **Validado manualmente en navegador**: adjuntar un PDF válido, una imagen, un archivo con extensión no permitida y uno superior a 25 MB; descarga y persistencia tras recargar; selector de cliente sin código; filtros de fecha y multiselección de estados, incluido el aviso de rango incoherente; pantalla unificada de personas y accesos, incluida la creación de un acceso desde la fila; redirección de `/admin/users`; filas progresivas de reglas de notificación; y las redirecciones de `/`, login y cambio de contraseña obligatorio para `ADMIN` y `USER`.
- **Sigue pendiente**: todo lo ya pendiente en DEV-004 (`DEC-054`, `DEC-056`, `DEC-057`, `DEC-058`, `DEC-059`, `DEC-060`, `DEC-061`).
- **Siguiente objetivo**: ver [`docs/PROJECT_STATUS.md`](docs/PROJECT_STATUS.md).

## [Sin versionar] — Cierre funcional del Gestor de Ofertas, autenticación local y notificaciones

- **Prompt**: [`prompts/0004-cierre-gestor-ofertas-autenticacion-notificaciones.md`](prompts/0004-cierre-gestor-ofertas-autenticacion-notificaciones.md)
- **Tipo**: entrega funcional grande, agrupa piezas interdependientes en una única Pull Request.
- **Resumen**:
  - **Corrección del formulario de oferta**: tras cualquier error del servidor se recuperan y se vuelven a mostrar todos los valores enviados, incluidas las jornadas de todos los perfiles.
  - **Código de cliente** (`Client.code`) obligatorio y único, con migración compatible (nullable) para los clientes de DEV-003 y aviso «Código pendiente».
  - **Autenticación local provisional**: `User`, `Session`, hash de contraseña con scrypt, cookie `HttpOnly`/`SameSite=Lax`, roles `ADMIN`/`USER`, `/login`, `/cuenta/contrasena`, `/admin/users` y `scripts/bootstrap-admin.ts`. Corrige de paso una brecha real: las acciones de administración de clientes, personas y catálogos heredadas de DEV-003 no exigían `ADMIN` ni atribuían auditoría.
  - **Auditoría atribuible y versiones inmutables** de oferta (`OfferVersion`), con comparación de campos y jornadas.
  - **Comentarios internos** (`OfferComment`) y **adjuntos locales** (`OfferAttachment`, `src/lib/storage.ts`), con validación de tamaño/extensión/MIME, almacenamiento fuera de `public/` y descarga autenticada por streaming.
  - **Archivo lógico y recuperación** de ofertas, con vista «Ofertas archivadas» que comparte filtros y exportación con el listado ordinario.
  - **Bandeja «Pendiente de revisión»**, flujo de estados (cualquier estado activo a cualquier otro, salvo la restricción de completar una revisión) y pedido de Navision obligatorio en `Aceptado`.
  - **Centro de notificaciones internas** y administración de reglas de notificación (`/admin/notification-rules`); el motor de evaluación y las tres reglas iniciales ya estaban en el seed, esta entrega añade la pantalla.
  - **Exportación a Excel** del listado (`exceljs`), con las tres hojas `Ofertas`, `Jornadas` e `Historial`, reutilizando exactamente el mismo `where`/`orderBy` que el listado.
  - **Administración protegida del contador** de numeración (`/admin/counter`, DEC-012).
- **Modelo de datos añadido**: `User`, `Session`, `OfferVersion`, `OfferComment`, `OfferAttachment`, `NotificationRule`, `NotificationRuleCondition`, `NotificationRuleAction`, `Notification`, y `Client.code`.
- **Migración**: `20260919160000_add_auth_versions_comments_attachments_notifications`, acumulativa y no destructiva.
- **Decisiones cerradas**: `DEC-012`, `DEC-016`, `DEC-021` (código de cliente, nueva), `DEC-032`, `DEC-051`, `DEC-052`, `DEC-053` (parcial: sin email real), `DEC-055`. `DEC-019` deja de significar «sin autenticación» y pasa a describir la autenticación local provisional ya implementada.
- **Dependencia añadida**: `exceljs`, para generar el `.xlsx` de exportación.
- **Corrección de sesión**: `changeOwnPasswordAction` redirige explícitamente tras revocar y recrear la sesión, en lugar de devolver el estado en línea, para evitar un cierre de sesión involuntario detectado durante la validación con PostgreSQL real.
- **Sigue pendiente**: proveedor de autenticación corporativa definitiva (`DEC-056`), infraestructura y despliegue (`DEC-057`), migración del histórico (`DEC-054`, `DEC-058`), modelo de implantaciones (`DEC-059`), tarifas y reglas de ESM (`DEC-060`), y proveedor real de email (`DEC-061`, nueva).
- **Limitación explícita**: la pantalla dedicada de comparación de versiones (más allá del histórico de estados ya visible en la ficha) no tiene interfaz propia en esta entrega, aunque la Server Action y la consulta ya existen.
- **Siguiente objetivo**: ver [`docs/PROJECT_STATUS.md`](docs/PROJECT_STATUS.md).

## [Sin versionar] — Primer flujo operativo del Gestor de Ofertas y branding Vincle

- **Prompt**: [`prompts/0003-flujo-operativo-ofertas-branding-vincle.md`](prompts/0003-flujo-operativo-ofertas-branding-vincle.md)
- **Tipo**: entrega funcional. Agrupa tres incrementos consecutivos sobre el mismo modelo.
- **Resumen**:
  - **Identidad visual de Vincle** aplicada de forma transversal mediante tokens semánticos: azul corporativo `#1F18C0` para acciones, navegación activa y foco; negro corporativo para titulares y texto; mostaza `#DBBA12` únicamente como acento (~10 %). Pila tipográfica preparada para Gilroy con la alternativa de respaldo ya incluida en el proyecto; no se han añadido logotipos ni archivos de fuente sin licencia. Documentado en [`docs/design/BRAND_UI.md`](docs/design/BRAND_UI.md).
  - **Administración operativa**: alta, edición y activación/desactivación de clientes (`/admin/clients`), personas (`/admin/people`) y los ocho catálogos (`/admin/master-data`). Sin borrado físico en ningún caso.
  - **Núcleo de datos de ofertas** y numeración global `VI`+`AAAA`+`MM`+`-`+contador, atómica y segura ante concurrencia.
  - **Flujo completo de ofertas**: listado con búsqueda, filtros combinables, ordenación y paginación en PostgreSQL; alta, consulta y modificación compartiendo componente y reglas de validación.
- **Modelo de datos añadido**: `Client`, `Person`, `Offer`, `OfferProfileDays`, `OfferStatusHistory`, `SystemCounter`, `AuditLog`, más las relaciones inversas en los ocho catálogos.
- **Migración**: `20260919094119_add_offers_core_clients_people_audit`, acumulativa y no destructiva. No se ha modificado la migración de DEV-002.
- **Decisión cerrada**: `DEC-020` — `Importe total = 0` es válido si el campo se ha informado explícitamente; vacío y negativo no lo son. Sustituye a la antigua `DEC-050`, que deja de estar pendiente.
- **Dependencia añadida**: `zod`, como motor de validación compartido entre alta y edición.
- **Sigue pendiente**: autenticación y autorización (`DEC-019` vigente), pantalla protegida de ajuste del contador (`DEC-012`), inicialización del contador con el último valor legado, flujo de estados (`DEC-051`), estados que exigen pedido de Navision (`DEC-052`), correos (`DEC-053`), migración del histórico y exportación a Excel.
- **Limitación explícita**: aplicación únicamente apta para desarrollo local. Las pantallas de Administración no tienen restricción real de acceso y la auditoría registra siempre `actorId = null`.
- **Siguiente objetivo**: ver [`docs/PROJECT_STATUS.md`](docs/PROJECT_STATUS.md).

## [Sin versionar] — Base técnica ejecutable del Gestor de Ofertas

- **Prompt**: [`prompts/0002-base-tecnica-gestor-ofertas.md`](prompts/0002-base-tecnica-gestor-ofertas.md)
- **Tipo**: primera entrega de código.
- **Resumen**: se crea la primera versión ejecutable de Vincle Apps: Next.js (App Router) con TypeScript estricto y Tailwind CSS, PostgreSQL conectado mediante Prisma, migración inicial y carga idempotente de los maestros de referencia del Gestor de Ofertas, layout corporativo con menú lateral, pantalla `Todas las ofertas` con estado vacío honesto, y pantalla de consulta, solo de lectura, de los maestros.
- **Modelo de datos**: `Priority`, `Origin`, `OfferType`, `OfferStatus`, `Segmentation`, `ProfessionalProfile`, `Language`, `CancellationReason`. No incluye todavía `Offer`, `Client`, `Person` ni ninguna otra entidad transaccional.
- **Decisión temporal aprobada**: autenticación pospuesta; la aplicación es únicamente apta para desarrollo local (ver `DEC-019` en [`docs/decisions/DECISIONS.md`](docs/decisions/DECISIONS.md)).
- **Siguiente objetivo**: cerrar los campos mínimos y la administración de clientes y personas, antes de implementar el formulario de alta de ofertas. Ver [`docs/PROJECT_STATUS.md`](docs/PROJECT_STATUS.md).

## [Sin versionar] — Cimentación documental del proyecto

- **Prompt**: [`prompts/0001-cimentacion-documental.md`](prompts/0001-cimentacion-documental.md)
- **Tipo**: exclusivamente documental. No se ha generado código de aplicación.
- **Resumen**: se crea la base documental completa de Vincle Apps: visión global de la plataforma, alcance y arquitectura inicial propuesta, especificación funcional conocida del Gestor de Ofertas (primer módulo), registro de decisiones aprobadas y pendientes, y reglas permanentes de colaboración con Claude Code.
- **Documentos creados**: ver el listado completo en la descripción de la Pull Request asociada y en [`docs/INDEX.md`](docs/INDEX.md).
- **Siguiente objetivo**: diseño e implementación del Gestor de Ofertas, una vez validada esta cimentación documental. Ver [`docs/PROJECT_STATUS.md`](docs/PROJECT_STATUS.md).
