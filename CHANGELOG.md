# Changelog

Registro de entregas realizadas sobre `v-apps`. Cada entrada resume el objetivo y el resultado de una entrega, con enlace al prompt que la originó.

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
