# Estado del proyecto

## Última entrega

**Base técnica ejecutable del Gestor de Ofertas** (prompt [`prompts/0002-base-tecnica-gestor-ofertas.md`](../prompts/0002-base-tecnica-gestor-ofertas.md)).

Se ha creado la primera versión de código de Vincle Apps: proyecto Next.js (App Router) con TypeScript estricto y Tailwind CSS, PostgreSQL conectado mediante Prisma, una migración inicial con los maestros de referencia del Gestor de Ofertas, una carga inicial idempotente de los valores maestros ya aprobados, un layout corporativo común con menú lateral, la pantalla inicial `Gestor de Ofertas` (`/offers`) con un estado vacío honesto, y una pantalla de consulta, solo de lectura, de los maestros (`/admin/master-data`).

Como parte de esta entrega, el Product Owner ha decidido posponer la autenticación (ver `DEC-019` en [`decisions/DECISIONS.md`](decisions/DECISIONS.md)): la aplicación es únicamente apta para desarrollo local y muestra de forma visible el aviso `Entorno local · autenticación pendiente`.

## Estado de implementación

- **Implementado**: base técnica (Next.js, TypeScript, Prisma, PostgreSQL), layout con menú lateral, pantalla `Todas las ofertas` con estado vacío, pantalla de consulta de maestros, y los maestros de referencia: `Priority`, `Origin`, `OfferType`, `OfferStatus`, `Segmentation`, `ProfessionalProfile`, `Language`, `CancellationReason`.
- **Todavía pendiente**: el Gestor de Ofertas no está completo. No existen `Offer`, `Client` ni `Person`, ni el alta o edición de ofertas, ni el CRUD de ningún maestro. Ver [`architecture/DATA_MODEL.md`](architecture/DATA_MODEL.md) para el detalle de qué entidades siguen siendo conceptuales.
- No hay autenticación ni autorización, ni Docker, ni infraestructura de despliegue.

## Próximo objetivo

Cerrar los campos mínimos y la administración de `Client` y `Person`, como paso previo a implementar el formulario de alta de ofertas. El alcance funcional completo del módulo está en [`offers/OVERVIEW.md`](offers/OVERVIEW.md); las decisiones pendientes que deben resolverse antes o durante ese diseño están listadas en [`decisions/DECISIONS.md`](decisions/DECISIONS.md).

## Decisiones pendientes más relevantes para la siguiente entrega

- Validez de `Importe total = 0`.
- Flujo y transiciones permitidas entre estados de oferta.
- Estados que exigen informar el pedido/identificador de Navision.
- Mes exacto que se usará para el piloto de migración.
- Roles y permisos concretos de usuarios no administradores.
- Proveedor o mecanismo definitivo de autenticación.

El listado completo, con su estado (`APROBADO`, `PENDIENTE`, `PLANIFICADO`, `IMPLEMENTADO`), está en [`decisions/DECISIONS.md`](decisions/DECISIONS.md).

## Historial

Ver [`../CHANGELOG.md`](../CHANGELOG.md) para el registro completo de entregas.
