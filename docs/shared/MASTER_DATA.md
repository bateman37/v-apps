# Maestros compartidos

## Principio general

Los maestros son administrables únicamente por usuarios autorizados. Los registros ya utilizados por algún dato transaccional (por ejemplo, una oferta) se desactivan cuando dejan de ser válidos; **no se eliminan físicamente**, para preservar la integridad del histórico.

## Maestro común de personas

No se modelan `Comercial` y `PM` como entidades independientes. Existe un único maestro de personas (`Person`), y cada persona puede estar habilitada como comercial, como PM, o como ambas cosas simultáneamente. Ver relación con `Offer` en [`../architecture/DATA_MODEL.md`](../architecture/DATA_MODEL.md).

## Maestros conocidos del Gestor de Ofertas

- **Clientes**.
- **Personas** (ver principio anterior).
- **Perfiles profesionales**: ver tabla completa en [`../offers/BUSINESS_RULES.md`](../offers/BUSINESS_RULES.md).
- **Prioridades**: valores actuales conocidos: Alta, Media, Baja.
- **Orígenes**: valores actuales conocidos: Comercial, PM, CS.
- **Tipos de oferta**: valores actuales conocidos: Bolsa de horas, Cambio de alcance, Proyecto.
- **Estados de oferta**: ver detalle y evolución prevista en [`../offers/STATUSES.md`](../offers/STATUSES.md).
- **Segmentaciones**: ver valores conocidos en [`../offers/BUSINESS_RULES.md`](../offers/BUSINESS_RULES.md).
- **Motivos de cancelación**.
- **Idiomas**.

Los valores concretos, obligatoriedad y reglas de uso de cada uno de estos maestros dentro del formulario de oferta están detallados en [`../offers/FIELDS.md`](../offers/FIELDS.md).

## Maestros futuros, todavía no diseñados

- **Implantaciones**: en la primera versión del Gestor de Ofertas no existe como maestro; el campo `Implantación` es texto libre en la oferta. Su futura relación muchos a muchos con clientes está pendiente de diseño (ver [`../decisions/DECISIONS.md`](../decisions/DECISIONS.md)).
- **Tarifas**: se diseñarán cuando corresponda a ESM y a Administración común, fuera del alcance de esta entrega.

## Administración de maestros

La gestión de estos maestros (alta, edición, activación/desactivación) corresponde al módulo de Administración común descrito en [`../product/VISION.md`](../product/VISION.md). Su diseño detallado —pantallas, permisos concretos— no forma parte de esta entrega.

## Implementación de esta entrega (DEV-002)

Prioridades, orígenes, tipos de oferta, estados de oferta, segmentaciones y perfiles profesionales están cargados en PostgreSQL con sus valores aprobados, mediante una carga inicial idempotente (`prisma/seed.ts`). Idiomas y motivos de cancelación existen como tablas vacías, sin valores todavía aprobados.

Cada registro tiene un identificador interno, un `code` técnico estable y único (independiente del nombre visible, para poder cambiar la etiqueta sin romper referencias), un `name` visible en español, un estado activo y un orden de visualización. El mapeo código–nombre completo, único lugar donde se documenta para evitar duplicarlo, está en `prisma/seed-data.ts`. Los perfiles profesionales reutilizan literalmente sus códigos funcionales ya conocidos (PM, AN, DIL, DE, IN, DI, PR-BE, PR-FE, PR-REM, KN, IT, UX, TL, PLATF); el resto de catálogos usa códigos técnicos legibles en inglés (por ejemplo `HIGH`, `COMMERCIAL`, `PROJECT`), que son identificadores internos y no nuevas reglas de negocio.
