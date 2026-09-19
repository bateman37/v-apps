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

## Reglas conocidas

- El motivo de cancelación (`CancellationReason`) es obligatorio cuando el estado es `Anulado` (ver [`FIELDS.md`](FIELDS.md)).
- El maestro de estados (`OfferStatus`) deberá poder evolucionar para incluir: orden, estado activo, requisitos, carácter terminal y posible porcentaje comercial asociado. Ninguno de estos atributos está definido todavía.

## Pendiente de definición

> **PENDIENTE**: el flujo y las transiciones permitidas entre estados no están definidos. No se debe implementar ni asumir ninguna máquina de estados hasta que se apruebe explícitamente. Ver [`../decisions/DECISIONS.md`](../decisions/DECISIONS.md).

> **PENDIENTE**: qué estados obligan a informar el pedido o identificador de Navision. Ver [`../decisions/DECISIONS.md`](../decisions/DECISIONS.md).

> **PENDIENTE**: en qué momento y a qué destinatarios se envían correos automáticos asociados a cambios de estado. Ver [`../decisions/DECISIONS.md`](../decisions/DECISIONS.md).

## Trazabilidad

Todo cambio de estado de una oferta queda registrado en el histórico de estados (`OfferStatusHistory`, ver [`../architecture/DATA_MODEL.md`](../architecture/DATA_MODEL.md)) y sujeto a auditoría (ver [`../architecture/SECURITY.md`](../architecture/SECURITY.md)).

### Implementación (DEV-003)

- El alta de una oferta crea el primer evento, con estado anterior `null`.
- Una modificación crea un evento **solo si el estado cambia realmente**; si no cambia, no se duplica nada.
- El histórico se muestra en la pantalla de consulta de la oferta, de más reciente a más antiguo.
- `actorId` es siempre `null` mientras no exista autenticación (`DEC-019`): la atribución del cambio es desconocida y no se inventa ningún usuario.
- **No** se ha implementado ninguna máquina de estados ni restricción de transición: cualquier estado activo puede seleccionarse, porque `DEC-051` sigue pendiente.
- `navisionOrder` sigue siendo opcional en todos los estados, porque `DEC-052` sigue pendiente.
- No se envía ningún correo, porque `DEC-053` sigue pendiente.
