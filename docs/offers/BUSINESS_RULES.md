# Gestor de Ofertas — reglas de negocio conocidas

## Numeración de ofertas

### Formato aprobado

`VI` + `AAAA` + `MM` + `-` + contador global.

Ejemplo (sintético): `VI202609-01019`.

### Reglas aprobadas

- El contador es **global**: no se reinicia al cambiar de mes o de año.
- El año y el mes de la numeración corresponden al momento de creación de la oferta.
- En el cierre definitivo del Excel se tomará el último contador existente en producción; PostgreSQL continuará la numeración desde el número siguiente.
- El contador debe ser seguro ante creación concurrente de ofertas (sin colisiones ni huecos por condiciones de carrera).
- Un número asignado nunca se reutiliza, aunque la oferta se anule o se elimine lógicamente.
- El número se asigna en el **primer guardado**, nunca al abrir el formulario.
- Antes del primer guardado, la interfaz puede mostrar el texto `Se asignará al guardar` en el lugar del número.
- El contador se administra desde un área protegida de Administración, como parámetro o maestro técnico de contadores accesible solo por administradores. No es un CRUD ordinario.
- Debe poder inicializarse explícitamente con el último contador del Excel en el momento del cierre definitivo, antes de habilitar la creación de ofertas en producción.
- Cualquier ajuste excepcional del contador debe ser administrativo y quedar auditado (ver `AuditLog` en [`../architecture/DATA_MODEL.md`](../architecture/DATA_MODEL.md)).
- El sistema nunca permite fijar un contador inferior a uno ya utilizado.
- El contador se muestra con un mínimo de cinco dígitos, pudiendo crecer a seis o más sin detenerse.

### Necesidad técnica futura (no implementada en esta entrega)

La garantía de unicidad y de seguridad ante concurrencia requerirá una operación transaccional o una secuencia segura a nivel de base de datos. Esta entrega documenta la necesidad; su implementación concreta corresponde a la entrega de código del Gestor de Ofertas.

## Jornadas por perfil

### Perfiles conocidos

| Código | Nombre |
|---|---|
| PM | Project Manager |
| AN | Analista |
| DIL | Data Insights Leader |
| DE | Data Engineer |
| IN | Consultor Insights |
| DI | Desarrollador Insights |
| PR-BE | Programador Backend |
| PR-FE | Programador Frontend |
| PR-REM | Programador Remoto |
| KN | Knowledge |
| IT | IT |
| UX | UX/UI |
| TL | Tech Lead |
| PLATF | Plataforma |

### Reglas aprobadas

- Los perfiles profesionales son un maestro (`ProfessionalProfile`).
- Las jornadas no se modelan como una columna fija por perfil en la entidad de oferta.
- Se utiliza una relación oferta–perfil–jornadas (`OfferProfileDays`, ver [`../architecture/DATA_MODEL.md`](../architecture/DATA_MODEL.md)).
- Una oferta puede guardarse sin ninguna jornada informada.
- Cuando existen jornadas, el total se calcula siempre desde el detalle por perfiles; no se guarda como un valor independiente.
- Las jornadas comerciales son un concepto separado de las jornadas por perfil y no deben confundirse con ellas.

No se fijan en esta entrega reglas de coste o tarifas asociadas a perfiles o jornadas: corresponden a ESM y a Administración común en fases posteriores (ver [`../product/ROADMAP.md`](../product/ROADMAP.md)).

## Segmentaciones conocidas

- Acción: Top desarrollos.
- Evolutivos grandes (>10 k€).
- Evolutivos pequeños (<10 k€).
- Nueva división.
- Nuevo módulo.
- Nuevo país.
- Proyecto VFS.
- Proyecto VSW.
- Upgrade VSW.
- Vertical PBI.
