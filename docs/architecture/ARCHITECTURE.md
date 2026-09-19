# Arquitectura

## Estado de estas decisiones

Las decisiones técnicas de este documento son el punto de partida aprobado para el diseño de Vincle Apps. Su implementación concreta se validará antes de comenzar el código de cada módulo. Ninguna de ellas se ha traducido todavía en código, configuración ejecutable o infraestructura real.

## Decisiones técnicas iniciales aprobadas

- Plataforma web interna.
- Arquitectura inicial de **monolito modular**: un único despliegue que organiza internamente los módulos (Gestor de Ofertas, ESM, FACT, Budget Comercial y Revenue Control, License Manager, Administración común) como unidades cohesionadas, en lugar de servicios independientes.
- Node.js y TypeScript como base del backend.
- Frontend con React/Next.js.
- PostgreSQL como base de datos central.
- Prisma como opción inicial de ORM.
- Repositorio privado de GitHub.
- Sin Docker, salvo autorización posterior expresa.
- Configuración y secretos fuera del código y del repositorio (ver [`SECURITY.md`](SECURITY.md)).
- Entornos separados de desarrollo, pruebas y producción.
- Reglas de negocio deterministas: la aplicación no necesita inteligencia artificial en producción para calcular jornadas, importes, márgenes o estados.
- Diseño preparado para integrar APIs y procesos de importación en el futuro (por ejemplo, License Manager o la migración completa del histórico de ofertas).

## Principio de monolito modular

Cada módulo de negocio (Gestor de Ofertas, ESM, FACT, etc.) se organiza como una unidad interna independiente en cuanto a dominio, con fronteras claras entre sus responsabilidades, pero se despliega como parte de un único proyecto. Esto permite:

- Compartir navegación, autenticación, maestros y auditoría sin duplicar infraestructura.
- Evolucionar hacia servicios independientes en el futuro si fuera necesario, sin que esa evolución sea un requisito de esta fase.

## Elementos compartidos entre módulos

- Menú lateral común, con secciones que se activan progresivamente por módulo (ver [`../offers/OVERVIEW.md`](../offers/OVERVIEW.md) para el menú previsto en la primera implementación).
- Autenticación y sesión de usuario.
- Maestros compartidos (ver [`../shared/MASTER_DATA.md`](../shared/MASTER_DATA.md)).
- Auditoría (ver [`SECURITY.md`](SECURITY.md)).
- Modelo de datos conceptual (ver [`DATA_MODEL.md`](DATA_MODEL.md)).

## Fuera de alcance en esta entrega

No se define en este documento, por no estar todavía decidido:

- Proveedor o mecanismo definitivo de autenticación (ver [`../decisions/DECISIONS.md`](../decisions/DECISIONS.md)).
- Infraestructura y estrategia de despliegue (ver [`../decisions/DECISIONS.md`](../decisions/DECISIONS.md)).
- Estructura de carpetas, librerías auxiliares o convenciones de código concretas, que se definirán al iniciar la implementación del Gestor de Ofertas.
