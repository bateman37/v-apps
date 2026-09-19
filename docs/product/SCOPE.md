# Alcance

## Alcance implementado hasta hoy

Tras la entrega DEV-003, el repositorio contiene una aplicación ejecutable con el primer flujo operativo del Gestor de Ofertas: administración de clientes, personas y los ocho catálogos; alta, listado, consulta y modificación de ofertas; numeración global segura; jornadas por perfil derivadas; histórico de estados y auditoría mínima; e identidad visual oficial de Vincle. El detalle exacto, con lo implementado, lo aprobado pendiente de implementar y lo pendiente de decisión, está en [`../PROJECT_STATUS.md`](../PROJECT_STATUS.md).

Sigue **fuera de alcance** hasta que exista un encargo específico: autenticación y autorización, despliegue e infraestructura, migración desde SQL Server o Excel, importación o exportación Excel, correos y notificaciones, adjuntos, ESM, FACT, Budget Comercial, Revenue Control, License Manager, tarifas, costes y márgenes, el maestro de implantaciones, la eliminación física de datos y el ajuste manual del contador desde la interfaz.

## Alcance de la primera entrega (cimentación documental)

Aquella entrega fue exclusivamente documental. Incluyó:

- Visión global de Vincle Apps y sus módulos futuros ([`VISION.md`](VISION.md)).
- Roadmap de alto nivel, sin fechas ([`ROADMAP.md`](ROADMAP.md)).
- Arquitectura inicial propuesta ([`../architecture/ARCHITECTURE.md`](../architecture/ARCHITECTURE.md)).
- Modelo conceptual de datos, sin migraciones ([`../architecture/DATA_MODEL.md`](../architecture/DATA_MODEL.md)).
- Reglas de seguridad y datos sensibles ([`../architecture/SECURITY.md`](../architecture/SECURITY.md)).
- Maestros compartidos conocidos ([`../shared/MASTER_DATA.md`](../shared/MASTER_DATA.md)).
- Especificación funcional conocida del Gestor de Ofertas, primer módulo ([`../offers/`](../offers/OVERVIEW.md)).
- Registro de decisiones aprobadas y pendientes ([`../decisions/DECISIONS.md`](../decisions/DECISIONS.md)).
- Reglas permanentes de colaboración con Claude Code ([`../../AGENTS.md`](../../AGENTS.md), [`../../CLAUDE.md`](../../CLAUDE.md)).

### Explícitamente fuera de alcance en aquella entrega documental

No se realizó en aquella Pull Request:

- Inicialización de Next.js, React, Node.js, Prisma o PostgreSQL.
- Creación de `package.json` ni de ninguna dependencia.
- Migraciones de base de datos.
- Implementación de autenticación.
- Desarrollo de pantallas o componentes de interfaz.
- Endpoints o servicios de backend.
- Datos de prueba ejecutables (fixtures, seeds).
- Configuración de Docker.
- Infraestructura o estrategia de despliegue.
- Diseño funcional detallado de ESM, FACT, Budget Comercial y Revenue Control, License Manager, o Administración común más allá de lo descrito en la visión.
- Cualquier decisión funcional no aprobada explícitamente (ver las marcadas como `PENDIENTE` en [`../decisions/DECISIONS.md`](../decisions/DECISIONS.md)).

## Alcance funcional del primer módulo

El Gestor de Ofertas sigue siendo el único módulo con especificación funcional detallada. Su alcance —pantallas, campos, numeración, maestros, migración— está documentado en [`../offers/`](../offers/OVERVIEW.md) y sujeto a las decisiones pendientes registradas en [`../decisions/DECISIONS.md`](../decisions/DECISIONS.md).
