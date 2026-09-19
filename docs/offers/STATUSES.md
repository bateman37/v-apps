# Gestor de Ofertas — estados de oferta

## Estados conocidos

- A valorar PM.
- Entregado a comercial.
- Enviado.
- Oferta 90 %.
- Aceptado.
- Desarrollo.
- Entregado.
- Facturado.
- Anulado.
- En revisión.

## Reglas aprobadas e implementadas (DEV-004)

### Flujo de estados (DEC-051)

De forma general, una oferta activa puede pasar de cualquier estado a cualquier otro estado activo: no hay estados terminales ni un motor configurable de transiciones. La única restricción es la de la bandeja de revisión: completar una revisión exige elegir un estado **distinto** del que la generó (ver [`OVERVIEW.md`](OVERVIEW.md)).

### Pedido de Navision (DEC-052)

`navisionOrder` es obligatorio cuando el estado técnico es `ACCEPTED` (`Aceptado`), validado en servidor al crear, editar y revisar. Abandonar `Aceptado` no borra automáticamente un pedido ya informado. No se ha definido ni se exige ningún formato o longitud corporativa: basta un texto no vacío y recortado.

### Motivo de cancelación

El motivo de cancelación (`CancellationReason`) es obligatorio cuando el estado es `Anulado` (ver [`FIELDS.md`](FIELDS.md)). Anular una oferta se hace desde el formulario completo, no desde la bandeja de revisión: la revisión remite al formulario si se elige `Anulado`, en lugar de pedir el motivo en dos sitios distintos.

### Notificaciones asociadas a cambios de estado (DEC-053, parcial)

Existen reglas de notificación configurables (ver [`../shared/MASTER_DATA.md`](../shared/MASTER_DATA.md) y la administración en `/admin/notification-rules`), con tres reglas iniciales activas:

1. Al crear una oferta, se notifica internamente al comercial y al PM asignados (salvo al propio actor).
2. Al quedar en `A valorar PM`, se notifica internamente al PM asignado.
3. Al quedar en `Entregado a comercial`, se notifica internamente al comercial asignado.

El canal `Interna + email` puede seleccionarse en una regla, pero **no envía ni simula ningún correo real** en esta entrega: el proveedor de email queda pendiente (`DEC-061`).

## Pendiente de definición

> **PENDIENTE**: evolución del maestro de estados (`OfferStatus`) para incluir orden, estado activo, requisitos, carácter terminal y posible porcentaje comercial asociado (`DEC-033`, planificado). Ninguno de estos atributos está definido todavía.

## Trazabilidad

Todo cambio de estado de una oferta queda registrado en el histórico de estados (`OfferStatusHistory`, ver [`../architecture/DATA_MODEL.md`](../architecture/DATA_MODEL.md)), sujeto a auditoría con actor (ver [`../architecture/SECURITY.md`](../architecture/SECURITY.md)), y genera una nueva versión de la oferta (ver [`../architecture/DATA_MODEL.md`](../architecture/DATA_MODEL.md)).

### Implementación

- El alta de una oferta crea el primer evento del histórico, con estado anterior `null`.
- Una modificación o una revisión crea un evento **solo si el estado cambia realmente**; si no cambia, no se duplica nada.
- El histórico se muestra en la ficha de la oferta, de más reciente a más antiguo, con el autor del cambio.
- Los eventos anteriores al login de DEV-004 conservan `actorId = null` y se muestran como «Usuario no disponible (registro anterior al login)».
- La bandeja «Pendiente de revisión» (`/offers/pending-review`) deriva de los estados técnicos `TO_BE_ASSESSED_PM` y `DELIVERED_TO_SALES` y de la asignación de PM/comercial; no es un circuito paralelo de aprobaciones. Un administrador ve todas las pendientes; un usuario normal solo las suyas.
