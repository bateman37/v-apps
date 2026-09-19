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

### Importe total: el cero es válido (`DEC-020`, IMPLEMENTADO)

`Importe total = 0` es un valor **válido**, siempre que el campo se haya informado explícitamente:

- El campo vacío **no** es válido: hay que escribir un valor, aunque sea `0`.
- Un valor negativo **no** es válido.
- `0,00 €` **sí** es válido.

El importe se almacena como `numeric(14,2)` en PostgreSQL, nunca como coma flotante. La interfaz admite coma o punto como separador decimal; si aparecen ambos, el último es el separador decimal y el otro se interpreta como separador de millares.

## Estado de implementación

Desde DEV-003 este formulario existe realmente en `/offers/new` (alta) y `/offers/[id]/edit` (modificación), y ambos reutilizan el mismo componente y las mismas reglas de validación. La validación de servidor es la autoridad; la del navegador es solo una ayuda.

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
- Pedido o identificador de Navision — **obligatorio cuando el estado es `Aceptado`** (`DEC-052`, implementado; ver [`STATUSES.md`](STATUSES.md)), opcional en el resto de estados.
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

## Reglas adicionales de validación implementadas

- La persona seleccionada como comercial debe tener la habilitación de comercial; la seleccionada como PM, la de Project Manager.
- El motivo de cancelación es obligatorio cuando el estado tiene código estable `CANCELLED`. Para cualquier otro estado no se conserva un motivo antiguo: se borra.
- Si se selecciona `CANCELLED` y no hay motivos activos, la interfaz avisa y remite a Administración. Nunca se inventa un motivo.
- Las jornadas por perfil y las jornadas comerciales no pueden ser negativas.
- Las relaciones enviadas deben existir. Un maestro desactivado no puede asignarse de nuevo, pero sí se conserva si la oferta que se edita ya lo usaba.

## Reutilización de componente

El formulario de alta y el de modificación reutilizan el mismo componente (`src/modules/offers/offer-form.tsx`) y las mismas reglas (`src/modules/offers/validation.ts`), para no duplicar validaciones ni lógica de campos.
