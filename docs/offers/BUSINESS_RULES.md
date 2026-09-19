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

### Implementación (DEV-003)

- El contador vive en la tabla `system_counters`, con la clave `offer_number`.
- Se incrementa con un `UPDATE ... SET value = value + 1 ... RETURNING value` dentro de la transacción del alta. PostgreSQL bloquea la fila durante la transacción, de modo que dos altas concurrentes se serializan y obtienen valores distintos. No se lee y después se escribe, que sería una condición de carrera.
- Si la transacción revierte, el contador revierte con ella: no queda ninguna oferta parcial ni un número consumido a medias.
- `offers.number` tiene una restricción única de base de datos.
- El año y el mes provienen del instante real de creación, no de la `Fecha de la oferta` que introduce el usuario.
- La carga inicial (`prisma/seed.ts`) crea el contador con valor `0` **solo si no existe**. Volver a ejecutar el seed nunca lo rebaja, reinicia ni sobrescribe.
- Una modificación de la oferta jamás vuelve a tocar el número.

### Administración del contador (DEV-004, DEC-012)

`/admin/counter`, accesible solo para `ADMIN`, permite:

- Ver si el contador existe y su valor actual (el último número **ya consumido**, no el próximo).
- Inicializarlo explícitamente si falta.
- Aumentarlo con confirmación reforzada que muestra el valor anterior y el nuevo; nunca permite reducirlo, y detecta un conflicto de concurrencia si el valor cambió entre que se mostró y que se confirmó.
- Cada ajuste queda auditado con actor, valor anterior y valor nuevo.

### Todavía pendiente de implementar

- La inicialización del contador con el último valor del Excel legado, en el corte definitivo, sigue pendiente y deberá hacerse antes de habilitar la creación de ofertas en producción.

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

### Implementación (DEV-003)

- `OfferProfileDays` tiene una restricción única por pareja (oferta, perfil), que impide duplicados incluso ante envíos repetidos.
- No se crea fila para un campo vacío ni para un valor cero. Al modificar una oferta, las filas que se quedan sin valor se eliminan dentro de la misma transacción.
- El total se suma con aritmética decimal exacta (`src/lib/decimal.ts`), nunca con coma flotante.
- `Offer` **no** almacena ningún campo `totalProfileDays`.
- `Offer.commercialDays` es un campo independiente y nunca se suma al total por perfil.

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
