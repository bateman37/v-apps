# Gestor de Ofertas — visión funcional

## Objetivo

Sustituir el Excel actual, conectado a SQL Server, por un módulo web sobre PostgreSQL, manteniendo el histórico, mejorando la trazabilidad y preparando la conexión futura con ESM, FACT y el resto de Vincle Apps.

El Excel actual contiene aproximadamente 1.254 ofertas históricas, una tabla de jornadas por perfil, maestros, generación de correos y lógica de validación.

## Navegación inicial prevista

La plataforma admite un menú lateral común (ver [`../architecture/ARCHITECTURE.md`](../architecture/ARCHITECTURE.md)). En la primera implementación funcional, el menú solo necesita mostrar:

- **Gestor de Ofertas**
  - Todas las ofertas
  - Nueva oferta
- **Administración**
  - Maestros
  - Usuarios y permisos, cuando se diseñen

El menú debe quedar preparado para incorporar otros módulos (ESM, FACT, Budget Comercial, License Manager), pero no se crean ahora páginas vacías para ellos.

## Pantalla principal de ofertas

La futura pantalla principal sustituye la tabla del Excel y debe permitir:

- Consultar todas las ofertas.
- Crear una nueva oferta.
- Abrir y modificar una oferta existente.
- Buscar y filtrar.
- Ordenar resultados.
- Paginar.
- Filtrar por año, mes, cliente, comercial, PM, estado, tipo de oferta y origen.
- Mostrar totales sobre los resultados filtrados, cuando se diseñe esa entrega.
- Mantener eliminación lógica: el histórico nunca se elimina físicamente.
- Incorporar exportación a Excel en una fase posterior.

## Formulario de oferta

El formulario de alta y el de modificación reutilizan el mismo componente cuando se implementen. El detalle de campos está en [`FIELDS.md`](FIELDS.md).

## Documentos relacionados

- [`FIELDS.md`](FIELDS.md): campos obligatorios y opcionales del formulario.
- [`BUSINESS_RULES.md`](BUSINESS_RULES.md): numeración de ofertas, jornadas por perfil y otras reglas de negocio conocidas.
- [`STATUSES.md`](STATUSES.md): estados de oferta conocidos y su evolución prevista.
- [`MIGRATION.md`](MIGRATION.md): estrategia de migración desde el histórico en SQL Server/Excel.
- [`../shared/MASTER_DATA.md`](../shared/MASTER_DATA.md): maestros utilizados por el Gestor de Ofertas.
- [`../architecture/DATA_MODEL.md`](../architecture/DATA_MODEL.md): modelo conceptual de datos.
- [`../decisions/DECISIONS.md`](../decisions/DECISIONS.md): decisiones aprobadas y pendientes que afectan a este módulo.
