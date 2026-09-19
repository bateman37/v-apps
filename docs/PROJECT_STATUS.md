# Estado del proyecto

## Última entrega

**Cimentación documental del proyecto** (prompt [`prompts/0001-cimentacion-documental.md`](../prompts/0001-cimentacion-documental.md)).

Se ha creado la base documental completa de Vincle Apps: visión, alcance, roadmap, arquitectura inicial propuesta, modelo conceptual de datos, reglas de seguridad, maestros compartidos, especificación funcional conocida del Gestor de Ofertas, y registro de decisiones aprobadas y pendientes.

## Estado de implementación

No existe código de aplicación en el repositorio. No hay proyecto Next.js/React/Node.js, ni `package.json`, ni esquema de Prisma, ni migraciones de base de datos, ni Docker, ni infraestructura de despliegue. El contenido actual es exclusivamente documental.

## Próximo objetivo

Diseño e implementación del **Gestor de Ofertas**, primer módulo funcional de Vincle Apps, sobre la base documental fijada en esta entrega. El alcance detallado conocido está en [`offers/OVERVIEW.md`](offers/OVERVIEW.md); las decisiones pendientes que deben resolverse antes o durante ese diseño están listadas en [`decisions/DECISIONS.md`](decisions/DECISIONS.md).

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
