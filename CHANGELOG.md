# Changelog

Registro de entregas realizadas sobre `v-apps`. Cada entrada resume el objetivo y el resultado de una entrega, con enlace al prompt que la originó.

## [Sin versionar] — Base técnica ejecutable del Gestor de Ofertas

- **Prompt**: [`prompts/0002-base-tecnica-gestor-ofertas.md`](prompts/0002-base-tecnica-gestor-ofertas.md)
- **Tipo**: primera entrega de código.
- **Resumen**: se crea la primera versión ejecutable de Vincle Apps: Next.js (App Router) con TypeScript estricto y Tailwind CSS, PostgreSQL conectado mediante Prisma, migración inicial y carga idempotente de los maestros de referencia del Gestor de Ofertas, layout corporativo con menú lateral, pantalla `Todas las ofertas` con estado vacío honesto, y pantalla de consulta, solo de lectura, de los maestros.
- **Modelo de datos**: `Priority`, `Origin`, `OfferType`, `OfferStatus`, `Segmentation`, `ProfessionalProfile`, `Language`, `CancellationReason`. No incluye todavía `Offer`, `Client`, `Person` ni ninguna otra entidad transaccional.
- **Decisión temporal aprobada**: autenticación pospuesta; la aplicación es únicamente apta para desarrollo local (ver `DEC-019` en [`docs/decisions/DECISIONS.md`](docs/decisions/DECISIONS.md)).
- **Siguiente objetivo**: cerrar los campos mínimos y la administración de clientes y personas, antes de implementar el formulario de alta de ofertas. Ver [`docs/PROJECT_STATUS.md`](docs/PROJECT_STATUS.md).

## [Sin versionar] — Cimentación documental del proyecto

- **Prompt**: [`prompts/0001-cimentacion-documental.md`](prompts/0001-cimentacion-documental.md)
- **Tipo**: exclusivamente documental. No se ha generado código de aplicación.
- **Resumen**: se crea la base documental completa de Vincle Apps: visión global de la plataforma, alcance y arquitectura inicial propuesta, especificación funcional conocida del Gestor de Ofertas (primer módulo), registro de decisiones aprobadas y pendientes, y reglas permanentes de colaboración con Claude Code.
- **Documentos creados**: ver el listado completo en la descripción de la Pull Request asociada y en [`docs/INDEX.md`](docs/INDEX.md).
- **Siguiente objetivo**: diseño e implementación del Gestor de Ofertas, una vez validada esta cimentación documental. Ver [`docs/PROJECT_STATUS.md`](docs/PROJECT_STATUS.md).
