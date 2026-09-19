# Maestros compartidos

## Principio general

Los maestros son administrables únicamente por usuarios autorizados. Los registros ya utilizados por algún dato transaccional (por ejemplo, una oferta) se desactivan cuando dejan de ser válidos; **no se eliminan físicamente**, para preservar la integridad del histórico.

## Maestro común de personas

No se modelan `Comercial` y `PM` como entidades independientes. Existe un único maestro de personas (`Person`), y cada persona puede estar habilitada como comercial, como PM, o como ambas cosas simultáneamente. Ver relación con `Offer` en [`../architecture/DATA_MODEL.md`](../architecture/DATA_MODEL.md).

## Código de cliente (DEC-021)

Desde DEV-004, `Client.code` es obligatorio y único al crear o editar un cliente en `/admin/clients`:

- Solo se recortan los espacios exteriores; se conserva exactamente la capitalización escrita.
- Los clientes existentes de DEV-003 se migraron con el código en `null` y se muestran con el aviso «Código pendiente»; no pueden guardarse de nuevo sin informarlo.
- Un cliente activo sin código no puede elegirse al crear una oferta nueva, pero una oferta histórica que ya lo use sigue siendo consultable y editable sin exigir el código.
- La búsqueda en `/admin/clients` encuentra por nombre o por código.

## Maestros conocidos del Gestor de Ofertas

- **Clientes** (ver código de cliente más arriba).
- **Personas** (ver principio anterior).
- **Perfiles profesionales**: ver tabla completa en [`../offers/BUSINESS_RULES.md`](../offers/BUSINESS_RULES.md).
- **Prioridades**: valores actuales conocidos: Alta, Media, Baja.
- **Orígenes**: valores actuales conocidos: Comercial, PM, CS.
- **Tipos de oferta**: valores actuales conocidos: Bolsa de horas, Cambio de alcance, Proyecto.
- **Estados de oferta**: ver detalle y evolución prevista en [`../offers/STATUSES.md`](../offers/STATUSES.md).
- **Segmentaciones**: ver valores conocidos en [`../offers/BUSINESS_RULES.md`](../offers/BUSINESS_RULES.md).
- **Motivos de cancelación**.

Los valores concretos, obligatoriedad y reglas de uso de cada uno de estos maestros dentro del formulario de oferta están detallados en [`../offers/FIELDS.md`](../offers/FIELDS.md).

> **Idiomas** (`Language`) queda `@deprecated` desde el hotfix DEV-005: se retiró de toda la experiencia funcional del Gestor de Ofertas (formulario, ficha, Administración, filtros y exportación) y ya no aparece en `/admin/master-data`. La tabla se conserva vacía y sin uso, por compatibilidad técnica (ver [`../decisions/DECISIONS.md`](../decisions/DECISIONS.md)).

## Maestros futuros, todavía no diseñados

- **Implantaciones**: en la primera versión del Gestor de Ofertas no existe como maestro; el campo `Implantación` es texto libre en la oferta. Su futura relación muchos a muchos con clientes está pendiente de diseño (ver [`../decisions/DECISIONS.md`](../decisions/DECISIONS.md)).
- **Tarifas**: se diseñarán cuando corresponda a ESM y a Administración común, fuera del alcance de esta entrega.

## Administración de maestros (implementada en DEV-003)

| Pantalla | Qué permite |
|---|---|
| `/admin/clients` | Crear un cliente, editar su nombre y activarlo o desactivarlo. Búsqueda por nombre y filtro por activo/inactivo. |
| `/admin/people` («Personas y accesos», hotfix DEV-005) | Crear una persona, editar su nombre y sus dos habilitaciones, activarla o desactivarla, y crear o administrar su acceso (usuario, rol, activación y contraseña temporal) desde la misma fila. Búsqueda por nombre y filtros por habilitación comercial, habilitación PM y estado. Solo `ADMIN`, comprobado en servidor. |
| `/admin/master-data` | Crear, editar y activar o desactivar registros de los siete catálogos vigentes (`Idioma` quedó retirado en el hotfix DEV-005). |

Reglas comunes aplicadas en las tres pantallas:

- **Nunca hay borrado físico** (`DEC-017`). Un registro usado por ofertas solo se desactiva.
- Un registro inactivo deja de ofrecerse al crear datos nuevos, pero **sigue visible** en los datos históricos que lo referencian y en la edición de una oferta que ya lo usa.
- La desactivación pide confirmación explícita y explica que no se borra el histórico.
- En los catálogos, el `code` es obligatorio, único y estable: se fija en el alta y **no se modifica nunca desde la interfaz**, para no romper referencias. `name`, `sortOrder` e `isActive` sí son editables. Los códigos nuevos se normalizan de forma predecible (mayúsculas, espacios a `_`) y se validan contra el patrón `A-Z 0-9 _ -`; los códigos ya aprobados no se renombran.
- Los clientes evitan duplicados exactos de nombre tras normalizar espacios, mediante una restricción única de PostgreSQL sobre una columna normalizada (ver [`../architecture/DATA_MODEL.md`](../architecture/DATA_MODEL.md)).
- Todas las operaciones quedan auditadas (ver [`../architecture/SECURITY.md`](../architecture/SECURITY.md)).

**Limitación vigente**: estas pantallas no tienen ninguna restricción real a administradores, porque todavía no hay autenticación (`DEC-019`). Solo deben usarse en local. Los permisos concretos dependen de `DEC-055` y `DEC-056`, ambas pendientes.

## Valores iniciales cargados (DEV-002)

Prioridades, orígenes, tipos de oferta, estados de oferta, segmentaciones y perfiles profesionales están cargados en PostgreSQL con sus valores aprobados, mediante una carga inicial idempotente (`prisma/seed.ts`). Idiomas y motivos de cancelación existen como tablas vacías, sin valores todavía aprobados.

Idiomas y motivos de cancelación siguen deliberadamente vacíos en una instalación nueva: el usuario los crea desde `/admin/master-data` cuando los necesite. La carga inicial no inventa ningún valor.

Cada registro tiene un identificador interno, un `code` técnico estable y único (independiente del nombre visible, para poder cambiar la etiqueta sin romper referencias), un `name` visible en español, un estado activo y un orden de visualización. El mapeo código–nombre completo, único lugar donde se documenta para evitar duplicarlo, está en `prisma/seed-data.ts`. Los perfiles profesionales reutilizan literalmente sus códigos funcionales ya conocidos (PM, AN, DIL, DE, IN, DI, PR-BE, PR-FE, PR-REM, KN, IT, UX, TL, PLATF); el resto de catálogos usa códigos técnicos legibles en inglés (por ejemplo `HIGH`, `COMMERCIAL`, `PROJECT`), que son identificadores internos y no nuevas reglas de negocio.
