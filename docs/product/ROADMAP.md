# Roadmap

Fases de alto nivel del proyecto. No se incluyen fechas ni compromisos de calendario, que no han sido definidos. El orden refleja la secuencia funcional prevista, no un compromiso cerrado.

## Fase 0 — Cimentación documental (completada)

Visión, alcance, arquitectura inicial, modelo conceptual, seguridad, maestros compartidos y especificación funcional conocida del Gestor de Ofertas. Sin código de aplicación. Ver [`../PROJECT_STATUS.md`](../PROJECT_STATUS.md).

## Fase 1 — Gestor de Ofertas (en curso)

Diseño e implementación del primer módulo funcional: alta, consulta y modificación de ofertas; numeración global; formulario con campos obligatorios y opcionales; maestros asociados; jornadas por perfil; migración piloto de un mes cerrado desde el histórico. Especificación en [`../offers/`](../offers/OVERVIEW.md).

Estado: DEV-002 entregó la base técnica y DEV-003 el primer flujo operativo (administración de maestros, alta, listado, consulta y modificación de ofertas, numeración global e identidad visual). Quedan dentro de esta fase, sin encargo todavía, la autenticación y el piloto de migración. Ver [`../PROJECT_STATUS.md`](../PROJECT_STATUS.md).

## Fase 2 — Migración completa del histórico de ofertas

Migración completa desde SQL Server (no desde el Excel visible), con staging, trazabilidad de origen, idempotencia y reconciliación de incidencias. Ver [`../offers/MIGRATION.md`](../offers/MIGRATION.md).

## Fases futuras — resto de módulos de la plataforma

Sin diseño funcional todavía. Se incorporarán progresivamente según se vayan especificando en encargos futuros:

- ESM.
- FACT.
- Budget Comercial y Revenue Control.
- License Manager e integraciones.
- Administración común (usuarios y permisos, tarifas, parámetros de sistema, auditoría) más allá de lo mínimo necesario para el Gestor de Ofertas.

Ver [`VISION.md`](VISION.md) para la descripción de cada módulo futuro.

## Principio de secuenciación

Ningún módulo o funcionalidad futura se diseña ni se implementa antes de que exista un encargo específico para él. Este roadmap no autoriza trabajo por adelantado; ver la regla correspondiente en [`../../AGENTS.md`](../../AGENTS.md).
