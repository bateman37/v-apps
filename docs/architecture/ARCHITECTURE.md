# Arquitectura

## Estado de estas decisiones

Las decisiones técnicas de este documento son el punto de partida aprobado para el diseño de Vincle Apps. Desde la entrega de base técnica del Gestor de Ofertas (DEV-002), las decisiones de esta sección están **implementadas** en código: Next.js con App Router, TypeScript estricto, PostgreSQL y Prisma. Ver [`../PROJECT_STATUS.md`](../PROJECT_STATUS.md) para el detalle de qué contiene exactamente esa entrega.

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

## Estructura de código (implementada en DEV-002)

El proyecto es un único monolito Next.js (App Router), organizado así:

```text
src/
  app/                  Rutas y composición de páginas (Next.js App Router).
  components/
    layout/             Layout común: menú lateral, cabecera, aviso de entorno.
    ui/                 Componentes de presentación realmente compartidos.
  modules/
    offers/             Código específico del Gestor de Ofertas.
    master-data/         Acceso y presentación de los maestros.
  lib/
    db/                 Cliente Prisma y utilidades estrictamente técnicas.
prisma/
  schema.prisma         Modelo de datos.
  seed.ts / seed-data.ts Carga inicial idempotente de maestros.
  migrations/           Historial de migraciones.
```

Componentes de servidor por defecto; solo la navegación lateral (resaltado de la sección activa) es un componente de cliente, por depender de la ruta actual del navegador.

## Fuera de alcance en esta entrega

No se define todavía, por no estar decidido:

- Proveedor o mecanismo definitivo de autenticación. Ver la decisión temporal de posponerla en [`../decisions/DECISIONS.md`](../decisions/DECISIONS.md) (`DEC-019`, `DEC-056`).
- Infraestructura y estrategia de despliegue (ver [`../decisions/DECISIONS.md`](../decisions/DECISIONS.md)).
- El modelo de datos transaccional (`Offer`, `Client`, `Person` y el resto de entidades descritas en [`DATA_MODEL.md`](DATA_MODEL.md)), que corresponde a entregas posteriores.
