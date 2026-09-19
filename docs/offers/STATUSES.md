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

Todo cambio de estado de una oferta debe quedar registrado en el histórico de estados (`OfferStatusHistory`, ver [`../architecture/DATA_MODEL.md`](../architecture/DATA_MODEL.md)) y sujeto a auditoría (ver [`../architecture/SECURITY.md`](../architecture/SECURITY.md)).
