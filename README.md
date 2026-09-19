# v-apps — Vincle Apps

Vincle Apps es una plataforma web interna, todavía en fase de diseño, que sustituirá progresivamente varias aplicaciones y ficheros Excel corporativos, compartiendo navegación, autenticación, datos maestros, seguridad, auditoría e integraciones.

## Estado actual

**Esta entrega es exclusivamente documental.** El repositorio no contiene todavía código de aplicación: no hay `package.json`, ni proyecto Next.js/React/Node.js, ni esquema de Prisma, ni migraciones de base de datos, ni configuración de Docker o de despliegue. Todo lo anterior se abordará en entregas futuras y separadas.

Para el detalle del estado y de la próxima entrega prevista, ver [`docs/PROJECT_STATUS.md`](docs/PROJECT_STATUS.md).

## Cómo navegar la documentación

El punto de entrada a toda la documentación es [`docs/INDEX.md`](docs/INDEX.md), que enlaza y ordena:

- La visión, el alcance y el roadmap del producto (`docs/product/`).
- La arquitectura propuesta, el modelo de datos conceptual y las reglas de seguridad (`docs/architecture/`).
- Los maestros compartidos por toda la plataforma (`docs/shared/`).
- La especificación funcional del primer módulo, el Gestor de Ofertas (`docs/offers/`).
- El registro de decisiones aprobadas y pendientes (`docs/decisions/DECISIONS.md`).

## Cómo se trabaja en este repositorio

Este proyecto se desarrolla mediante encargos entregados a Claude Code, conservados como prompts en [`prompts/`](prompts/README.md). Las reglas completas de colaboración —roles, ramas, Pull Requests, alcance, calidad e idioma— están fijadas en [`AGENTS.md`](AGENTS.md), con instrucciones específicas para Claude Code en [`CLAUDE.md`](CLAUDE.md).

En resumen:

- Cada entrega parte de `main` actualizado, se desarrolla en una rama propia y termina en una Pull Request abierta.
- El usuario (Product Owner) revisa, prueba manualmente y fusiona cada Pull Request; Claude Code nunca fusiona.
- Cada entrega se limita estrictamente a su alcance declarado.

## Historial de entregas

Ver [`CHANGELOG.md`](CHANGELOG.md).
