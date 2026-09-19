# Gestor de Ofertas — visión funcional

## Objetivo

Sustituir el Excel actual, conectado a SQL Server, por un módulo web sobre PostgreSQL, manteniendo el histórico, mejorando la trazabilidad y preparando la conexión futura con ESM, FACT y el resto de Vincle Apps.

El Excel actual contiene aproximadamente 1.254 ofertas históricas, una tabla de jornadas por perfil, maestros, generación de correos y lógica de validación.

## Navegación implementada

La plataforma tiene un menú lateral común (ver [`../architecture/ARCHITECTURE.md`](../architecture/ARCHITECTURE.md)). Desde DEV-003 muestra:

- **Gestor de Ofertas**
  - Todas las ofertas (`/offers`)
  - Nueva oferta (`/offers/new`)
- **Administración**
  - Clientes (`/admin/clients`)
  - Personas (`/admin/people`)
  - Maestros de oferta (`/admin/master-data`)

«Usuarios y permisos» se añadirá cuando se diseñe la autenticación (`DEC-055`, `DEC-056`, ambas pendientes).

El menú debe quedar preparado para incorporar otros módulos (ESM, FACT, Budget Comercial, License Manager), pero no se crean ahora páginas vacías para ellos.

## Pantalla principal de ofertas

Implementada en `/offers` desde DEV-003, sustituyendo la tabla del Excel:

- Listado real leído de PostgreSQL, con número, fecha, cliente, descripción resumida, comercial, PM, estado, importe, total de jornadas por perfil y acceso a la oferta.
- Formato monetario español en euros y fechas `DD/MM/AAAA`.
- Búsqueda por número, descripción, cliente o solicitante.
- Filtros combinables por año, mes, cliente, comercial, PM, estado, tipo de oferta y origen, con botón para limpiarlos.
- Ordenación por número, fecha, cliente, estado e importe.
- Paginación de 25 registros que conserva filtros y orden.
- Todo el estado vive en parámetros de URL, de modo que una pantalla filtrada es reproducible.
- Recuento de resultados y suma de importe y de jornadas sobre el **conjunto filtrado completo**, no solo sobre la página visible.
- Estado vacío honesto, con acceso directo a crear la primera oferta.
- Exclusión por defecto de los registros con `deletedAt` informado: eliminación lógica, nunca física.

Pendiente para fases posteriores: exportación a Excel (`DEC-032`, `PLANIFICADO`).

## Formulario de oferta

El alta (`/offers/new`) y la modificación (`/offers/[id]/edit`) reutilizan el mismo componente y las mismas reglas de validación. La consulta está en `/offers/[id]`, con todos los datos, el detalle de jornadas, el total calculado y el histórico de estados. El detalle de campos está en [`FIELDS.md`](FIELDS.md).

En esta entrega no se expone el borrado de ofertas desde la interfaz; `deletedAt` queda preparado para la eliminación lógica aprobada (`DEC-016`).

## Documentos relacionados

- [`FIELDS.md`](FIELDS.md): campos obligatorios y opcionales del formulario.
- [`BUSINESS_RULES.md`](BUSINESS_RULES.md): numeración de ofertas, jornadas por perfil y otras reglas de negocio conocidas.
- [`STATUSES.md`](STATUSES.md): estados de oferta conocidos y su evolución prevista.
- [`MIGRATION.md`](MIGRATION.md): estrategia de migración desde el histórico en SQL Server/Excel.
- [`../shared/MASTER_DATA.md`](../shared/MASTER_DATA.md): maestros utilizados por el Gestor de Ofertas.
- [`../architecture/DATA_MODEL.md`](../architecture/DATA_MODEL.md): modelo conceptual de datos.
- [`../decisions/DECISIONS.md`](../decisions/DECISIONS.md): decisiones aprobadas y pendientes que afectan a este módulo.
