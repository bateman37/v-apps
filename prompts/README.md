# Prompts

Esta carpeta conserva, sin editar, los encargos (prompts) que el Product Owner entrega a Claude Code para cada iteración del proyecto.

## Convención de nombres

`NNNN-slug-descriptivo.md`

- `NNNN`: número secuencial de cuatro dígitos, correlativo por orden de entrega (`0001`, `0002`, ...).
- `slug-descriptivo`: resumen breve en minúsculas y con guiones del contenido del encargo.

Ejemplo: `0001-cimentacion-documental.md`.

## Reglas de conservación

1. Cada encargo entregado a Claude Code se guarda aquí como copia fiel del texto recibido, antes o durante la entrega que lo ejecuta.
2. Los prompts no se editan retroactivamente. Si un encargo se corrige o amplía, se crea un nuevo archivo con el siguiente número.
3. Un prompt documenta la intención original; las decisiones que finalmente se aprueban o rechazan quedan registradas en [`../docs/decisions/DECISIONS.md`](../docs/decisions/DECISIONS.md), no aquí.
4. Ningún prompt debe contener credenciales, datos reales de clientes ni información sensible. Si el encargo original las incluyera, se deben omitir o sustituir por marcadores antes de guardarlo.

## Relación con el flujo de trabajo

Ver las reglas completas de colaboración en [`../AGENTS.md`](../AGENTS.md). En resumen:

- El usuario (Product Owner) redacta o valida el encargo, con apoyo de ChatGPT para el análisis y la especificación.
- Claude Code ejecuta el encargo sobre el repositorio en una rama nueva y dentro del alcance descrito.
- El encargo ejecutado se conserva aquí como referencia histórica y trazabilidad del proyecto.
