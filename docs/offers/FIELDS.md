# Gestor de Ofertas — campos del formulario

## Campos obligatorios para guardar

Una oferta solo puede guardarse inicialmente si tiene informados todos estos campos:

- Cliente.
- Prioridad.
- Comercial.
- Fecha.
- Origen.
- PM.
- Descripción.
- Tipo de oferta.
- Importe total.
- Estado.
- Nombre del solicitante.

Comercial y PM se seleccionan del maestro común de personas (ver [`../shared/MASTER_DATA.md`](../shared/MASTER_DATA.md)).

> **Pendiente**: si `Importe total = 0` es un valor válido o el importe debe ser siempre superior a cero. Ver [`../decisions/DECISIONS.md`](../decisions/DECISIONS.md).

## Campos opcionales inicialmente

- Implantación (ver sección específica más abajo).
- Fecha estimada de entrega comercial.
- Fecha estimada de entrega al cliente.
- Jornadas por perfil (todas ellas).
- Jornadas comerciales.
- Fecha estimada de cartera.
- Segmentación.
- Observaciones.
- Idioma.
- Pedido o identificador de Navision — salvo cuando una futura regla de estado lo exija (pendiente, ver [`../decisions/DECISIONS.md`](../decisions/DECISIONS.md)).
- Motivo de cancelación — obligatorio únicamente cuando el estado de la oferta sea `Anulado`.

## Implantación

En la primera versión, `Implantación` es únicamente un **campo de texto libre, opcional y nullable** en la oferta.

No existe todavía, y no debe anticiparse:

- Maestro de implantaciones.
- Validación del valor de implantación.
- Relación con clientes.
- Selector dependiente del cliente.

### Visión futura (pendiente de diseño)

- Un cliente podrá tener una o varias implantaciones.
- Una implantación podrá estar asociada a uno o varios clientes.
- La relación futura será, por tanto, muchos a muchos.
- El texto histórico introducido en la primera versión deberá poder migrarse posteriormente al futuro maestro de implantaciones.

Este modelo futuro no se implementa en la primera versión del formulario.

## Numeración de la oferta

El número de oferta no es un campo del formulario que el usuario introduzca: se asigna automáticamente. Ver [`BUSINESS_RULES.md`](BUSINESS_RULES.md) para el detalle completo de la numeración.

## Reutilización de componente

El formulario de alta y el de modificación deben reutilizar el mismo componente cuando se implementen, para evitar duplicar validaciones y lógica de campos.
