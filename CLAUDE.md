# CLAUDE.md — instrucciones para Claude Code

> Referencia obligatoria: [`AGENTS.md`](AGENTS.md) contiene las reglas canónicas de colaboración y tiene prioridad sobre cualquier instrucción puntual que lo contradiga sin justificación explícita. Este documento añade indicaciones específicas para Claude Code trabajando en `v-apps`.

## Antes de empezar cualquier entrega

1. Lee [`AGENTS.md`](AGENTS.md) completo.
2. Lee [`docs/PROJECT_STATUS.md`](docs/PROJECT_STATUS.md) para conocer el estado actual y la última entrega realizada.
3. Lee [`docs/INDEX.md`](docs/INDEX.md) y, dentro de él, los documentos relevantes para el encargo recibido.
4. Guarda el encargo recibido como un nuevo archivo en [`prompts/`](prompts/README.md) siguiendo su convención de nombres.

## Durante la entrega

- Trabaja únicamente dentro del alcance descrito en el encargo. Ante dudas sobre si algo está o no en alcance, trátalo como fuera de alcance y coméntalo en la respuesta final.
- No implementes decisiones marcadas como `PENDIENTE` en [`docs/decisions/DECISIONS.md`](docs/decisions/DECISIONS.md).
- No anticipes módulos futuros de la plataforma (ver [`docs/product/ROADMAP.md`](docs/product/ROADMAP.md)) ni pantallas, endpoints o modelos de datos no solicitados.
- No incluyas credenciales, datos reales de clientes ni información sensible. Ver [`docs/architecture/SECURITY.md`](docs/architecture/SECURITY.md).
- Si detectas una contradicción entre el encargo puntual y la documentación canónica, señálala explícitamente antes de modificar una decisión aprobada.

## Al finalizar la entrega

1. Actualiza la documentación afectada por los cambios realizados.
2. Actualiza [`CHANGELOG.md`](CHANGELOG.md) con un resumen de la entrega.
3. Actualiza [`docs/PROJECT_STATUS.md`](docs/PROJECT_STATUS.md) con el nuevo estado y el siguiente objetivo.
4. Crea una Pull Request contra `main` describiendo objetivo, cambios, decisiones registradas, decisiones pendientes y validaciones realizadas.
5. Deja la Pull Request abierta. Claude Code nunca fusiona una Pull Request.

## Estado de la implementación

A la fecha de esta entrega, el repositorio **no contiene código de aplicación**: ni `package.json`, ni configuración de Next.js/React/Node.js, ni esquema de Prisma, ni migraciones, ni Docker, ni infraestructura. El contenido actual es exclusivamente documental. Cualquier trabajo de implementación comenzará en una entrega futura y separada, una vez validada esta cimentación documental.

## Documentación de referencia rápida

| Necesito... | Documento |
|---|---|
| Entender la visión general del producto | [`docs/product/VISION.md`](docs/product/VISION.md) |
| Saber qué está en alcance ahora | [`docs/product/SCOPE.md`](docs/product/SCOPE.md) |
| Ver las fases previstas | [`docs/product/ROADMAP.md`](docs/product/ROADMAP.md) |
| Consultar la arquitectura propuesta | [`docs/architecture/ARCHITECTURE.md`](docs/architecture/ARCHITECTURE.md) |
| Consultar el modelo de datos conceptual | [`docs/architecture/DATA_MODEL.md`](docs/architecture/DATA_MODEL.md) |
| Consultar reglas de seguridad | [`docs/architecture/SECURITY.md`](docs/architecture/SECURITY.md) |
| Consultar maestros compartidos | [`docs/shared/MASTER_DATA.md`](docs/shared/MASTER_DATA.md) |
| Especificar el Gestor de Ofertas | [`docs/offers/`](docs/offers/OVERVIEW.md) |
| Ver decisiones aprobadas y pendientes | [`docs/decisions/DECISIONS.md`](docs/decisions/DECISIONS.md) |
