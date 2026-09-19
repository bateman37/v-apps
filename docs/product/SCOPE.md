# Alcance

## Alcance de esta entrega (cimentación documental)

Esta entrega es exclusivamente documental. Incluye:

- Visión global de Vincle Apps y sus módulos futuros ([`VISION.md`](VISION.md)).
- Roadmap de alto nivel, sin fechas ([`ROADMAP.md`](ROADMAP.md)).
- Arquitectura inicial propuesta ([`../architecture/ARCHITECTURE.md`](../architecture/ARCHITECTURE.md)).
- Modelo conceptual de datos, sin migraciones ([`../architecture/DATA_MODEL.md`](../architecture/DATA_MODEL.md)).
- Reglas de seguridad y datos sensibles ([`../architecture/SECURITY.md`](../architecture/SECURITY.md)).
- Maestros compartidos conocidos ([`../shared/MASTER_DATA.md`](../shared/MASTER_DATA.md)).
- Especificación funcional conocida del Gestor de Ofertas, primer módulo ([`../offers/`](../offers/OVERVIEW.md)).
- Registro de decisiones aprobadas y pendientes ([`../decisions/DECISIONS.md`](../decisions/DECISIONS.md)).
- Reglas permanentes de colaboración con Claude Code ([`../../AGENTS.md`](../../AGENTS.md), [`../../CLAUDE.md`](../../CLAUDE.md)).

## Explícitamente fuera de alcance en esta entrega

No se ha realizado ni se realizará en esta Pull Request:

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

## Alcance funcional conocido del primer módulo

El Gestor de Ofertas es el único módulo con especificación funcional detallada en esta entrega. Su alcance conocido —pantallas, campos, numeración, maestros, migración— está documentado en [`../offers/`](../offers/OVERVIEW.md) y sujeto a las decisiones pendientes registradas en [`../decisions/DECISIONS.md`](../decisions/DECISIONS.md).
