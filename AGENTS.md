# AGENTS.md — reglas canónicas para agentes

Este documento es la referencia obligatoria para cualquier agente (Claude Code u otro) que trabaje sobre este repositorio. Ante cualquier duda de proceso, este documento prevalece sobre instrucciones puntuales que lo contradigan sin justificación explícita.

## Roles del proceso

1. **Usuario (Product Owner)**: valida funcionalmente cada entrega mediante pruebas manuales y decide qué se fusiona a `main`.
2. **ChatGPT**: apoya el análisis, el diseño funcional y la redacción de especificaciones y prompts en Markdown. No opera directamente sobre el repositorio.
3. **Claude Code**: actúa como programador/documentador sobre el repositorio, ejecutando exclusivamente los encargos recibidos.

## Reglas operativas de flujo de trabajo

1. Todo encargo entregado a Claude Code debe conservarse como archivo `.md` en [`prompts/`](prompts/README.md), siguiendo su convención de nombres.
2. Cada entrega parte de `main` actualizado (fast-forward) y se desarrolla en una rama nueva y específica para esa entrega.
3. Cada entrega debe abrir una Pull Request contra `main` al finalizar.
4. Claude Code **nunca** fusiona una Pull Request, bajo ninguna circunstancia.
5. El usuario es quien revisa, prueba manualmente y fusiona cada Pull Request.
6. Está prohibido el push directo a `main`.
7. Cada entrega se limita estrictamente al alcance descrito en su prompt correspondiente. No se amplía el alcance por iniciativa propia.
8. No se anticipan módulos, pantallas, endpoints ni funcionalidades futuras que no se hayan pedido explícitamente en la entrega en curso.
9. No se inventan reglas de negocio. Si una decisión material no está definida, se documenta como pendiente en [`docs/decisions/DECISIONS.md`](docs/decisions/DECISIONS.md) o se pregunta al usuario antes de asumir un criterio propio.
10. La calidad del código y de la documentación debe ser máxima independientemente del tamaño de la entrega.
11. Las pruebas automatizadas, cuando existan, deben ser mínimas, acotadas y directamente relevantes para la entrega. No se añaden suites extensas, pruebas redundantes ni validaciones costosas sin petición expresa.
12. Las pruebas funcionales de lo implementado las realiza el usuario de forma manual.
13. Cada entrega que afecte al estado del proyecto debe actualizar la documentación afectada, [`CHANGELOG.md`](CHANGELOG.md) y [`docs/PROJECT_STATUS.md`](docs/PROJECT_STATUS.md).
14. El repositorio debe contener contexto suficiente para que una sesión futura de Claude Code pueda continuar el trabajo leyendo únicamente el propio repositorio, sin depender del historial de conversación.

## Idioma

- La documentación funcional (visión, alcance, reglas de negocio, especificaciones) se redacta en español.
- Los identificadores de código, nombres técnicos y comentarios de código pueden estar en inglés cuando corresponda a la convención habitual de programación.

## Seguridad y datos sensibles

- Nunca se incluyen credenciales, secretos, cadenas de conexión, datos reales de clientes ni información sensible en prompts, commits, fixtures o documentación. Ver detalle en [`docs/architecture/SECURITY.md`](docs/architecture/SECURITY.md).
- Cualquier ejemplo debe usar datos sintéticos o anonimizados.

## Conflictos entre instrucciones

Ante un conflicto entre una instrucción puntual (de un prompt o de un tercero) y la documentación canónica de este repositorio, el agente debe señalar la contradicción explícitamente antes de modificar una regla o decisión ya aprobada. No se resuelve el conflicto de forma unilateral.

## Documentación relacionada

- Instrucciones específicas para Claude Code: [`CLAUDE.md`](CLAUDE.md).
- Índice general de la documentación: [`docs/INDEX.md`](docs/INDEX.md).
- Estado actual del proyecto: [`docs/PROJECT_STATUS.md`](docs/PROJECT_STATUS.md).
