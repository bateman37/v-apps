# Identidad visual e interfaz

Este documento describe cómo se aplica la identidad visual oficial de Vincle a la interfaz de Vincle Apps. Es la referencia canónica de los tokens de color, la tipografía y los requisitos de accesibilidad. Ningún componente debe escribir un color literal: todos consumen los tokens definidos en `src/app/globals.css`.

## 1. Colores oficiales del manual de marca

Valores aprobados por el Product Owner a partir del `Brand Manual` de Vincle, edición de mayo de 2024:

| Uso | Valor oficial | RGB |
|---|---|---|
| Azul corporativo principal | `#1F18C0` | `31, 24, 192` |
| Negro corporativo | `#000000` | `0, 0, 0` |
| Mostaza secundario | `#DBBA12` | `219, 186, 18` |

El PDF del manual **no** se ha copiado a este repositorio, y no se ha extraído de él ningún recurso gráfico.

## 2. Tokens de interfaz

Los tres colores oficiales se declaran una sola vez como `--brand-blue`, `--brand-black` y `--brand-mustard`. El resto de la interfaz usa exclusivamente tokens semánticos, de modo que un cambio de marca se aplique en un único punto.

### 2.1 Tokens derivados de marca

| Token | Valor | Uso |
|---|---|---|
| `--color-primary` | `#1F18C0` | Acciones principales, navegación activa, enlaces relevantes, foco. |
| `--color-primary-hover` | `#1811A0` | Estado `hover` del botón principal. |
| `--color-primary-active` | `#140E85` | Estado pulsado del botón principal. |
| `--color-primary-contrast` | `#FFFFFF` | Texto sobre azul corporativo. |
| `--color-primary-soft` | `#ECEBFB` | Fondo suave de la entrada de menú activa y del `hover` de fila. |
| `--color-focus-ring` | `#1F18C0` | Anillo de foco visible. |
| `--color-accent` | `#DBBA12` | Acento mostaza sobre superficies pequeñas. |
| `--color-accent-soft` | `#FBF4D6` | Fondo del destacado de totales. |
| `--color-accent-text` | `#6B5A00` | Variante oscurecida del mostaza, la única admitida como **texto** sobre blanco. |

### 2.2 Neutros derivados (no son colores de marca)

| Token | Valor | Uso |
|---|---|---|
| `--color-text` | `#0B0B12` | Texto principal y titulares: casi negro, derivado del negro corporativo. |
| `--color-text-muted` | `#55555F` | Texto secundario, etiquetas de tabla, ayudas. |
| `--color-bg` | `#F6F6F9` | Fondo general de la aplicación. |
| `--color-surface` | `#FFFFFF` | Tarjetas, cabecera y menú lateral. |
| `--color-surface-muted` | `#F1F1F5` | Cabeceras de tabla y fondos sutiles. |
| `--color-border` | `#DCDCE4` | Bordes de tarjeta y separadores de tabla. |
| `--color-border-strong` | `#B5B5C2` | Bordes de campos de formulario y botones secundarios. |

### 2.3 Colores funcionales de interfaz

**No forman parte del manual de marca.** Son colores derivados, elegidos para señalar estados de forma inequívoca y con contraste suficiente. Se documentan aquí explícitamente para que no se confundan con la paleta corporativa.

| Token | Valor | Uso |
|---|---|---|
| `--color-success` / `--color-success-soft` | `#12663F` / `#E3F3EA` | Confirmaciones, estado «Activo». |
| `--color-warning` / `--color-warning-soft` | `#7A4F00` / `#FBF0D8` | Avisos, incluido `Entorno local · autenticación pendiente`. |
| `--color-danger` / `--color-danger-soft` | `#A4131A` / `#FBE9E9` | Errores de validación y de conexión. |

## 3. Regla de proporción del mostaza

El mostaza es un **acento**, en torno al 10 % de la composición. En la aplicación se limita deliberadamente a:

- El destacado del total de jornadas en el formulario de oferta.
- Las cifras agregadas del listado (importe total y jornadas del conjunto filtrado).
- El total calculado del detalle de jornadas de una oferta.

No se usa como fondo de pantallas, cabeceras ni tarjetas, ni como color de botón. Como texto sobre blanco solo se admite la variante oscurecida `--color-accent-text`: el mostaza puro no alcanza el contraste AA sobre fondo blanco.

La aplicación mantiene fondos blancos y neutros claros para resultar sobria y cómoda en jornadas largas de trabajo. No se usan degradados decorativos, sombras marcadas ni animaciones innecesarias: es una herramienta corporativa interna, no una página de marketing.

## 4. Tipografía

Gilroy es la tipografía oficial de Vincle. **No se han proporcionado archivos de fuente licenciados y no se descarga ninguna fuente de terceros.**

La pila tipográfica declarada es:

```
"Gilroy", var(--font-geist-sans), "Segoe UI", Arial, Helvetica, sans-serif
```

- Si Gilroy está instalada en el equipo del usuario, se usa automáticamente.
- Si no lo está, se usa la alternativa web ya incluida en el proyecto desde DEV-002.
- El repositorio **no** simula tener Gilroy ni incorpora archivos de fuente sin licencia.

Jerarquía de pesos, equivalente a la del manual sin sobredimensionarla para una aplicación interna:

| Elemento | Peso |
|---|---|
| Títulos de página (`h1`) | 800 (equivalente a Gilroy Black) |
| Títulos de sección (`h2`, `h3`) | 600 (Semibold) |
| Etiquetas, encabezados de tabla, botones | 600–700 |
| Cuerpo de texto | 400 (Regular) |

## 5. Logotipo

**El repositorio no contiene ningún activo oficial de logotipo.** No se ha dibujado, trazado, recreado ni alterado el logotipo a partir del PDF del manual, y no se ha descargado de ninguna fuente externa.

Mientras esa situación no cambie, la marca se representa únicamente con la denominación textual `Vincle Apps`, en azul corporativo, en la cabecera del menú lateral. Cuando el Product Owner aporte un archivo oficial de logotipo, bastará con sustituir ese texto por la imagen.

## 6. Accesibilidad

Requisitos que debe cumplir toda pantalla de la aplicación:

1. **Contraste WCAG AA.** El azul `#1F18C0` sobre blanco y el blanco sobre azul superan holgadamente 4,5:1. Los neutros de texto (`--color-text`, `--color-text-muted`) también. El mostaza puro no se usa nunca como texto sobre blanco.
2. **Foco visible.** Todos los elementos interactivos muestran un anillo de foco de 2 px en azul corporativo con separación de 2 px (`:focus-visible` global en `globals.css`).
3. **Navegación por teclado.** Existe un enlace «Saltar al contenido principal» al inicio del documento, y ningún control depende del ratón.
4. **Estados distinguibles sin color.** `hover`, `focus`, `disabled` y error se diferencian también por borde, opacidad o texto:
   - Los campos con error llevan `aria-invalid`, borde de 2 px y un mensaje que empieza por la palabra «Error:».
   - Los avisos empiezan por un título textual (`Error`, `Aviso`, `Correcto`, `Información`).
   - La entrada de menú activa se marca con una barra lateral y `aria-current="page"`, no solo con el color.
   - Los botones deshabilitados combinan opacidad reducida y el atributo `disabled`.
5. **Semántica.** Cada campo tiene su `<label>` asociado, los errores se enlazan con `aria-describedby`, las tablas llevan `<caption>` (visible o para lectores de pantalla) y `scope` en sus encabezados, y los mensajes usan `role="status"` o `role="alert"` según corresponda.

## 7. Capa de componentes compartidos

Para que el sistema visual sea consistente sin repetir cadenas largas de utilidades, `globals.css` define una capa mínima de clases: `.v-btn` (con `.v-btn-primary`, `.v-btn-secondary`, `.v-btn-quiet`), `.v-input`, `.v-label`, `.v-hint`, `.v-field-error`, `.v-card`, `.v-card-header`, `.v-table`, `.v-badge`, `.v-link` y `.v-num` (cifras tabulares). No es un sistema de diseño completo: es exactamente el conjunto que la aplicación usa hoy.

## Documentos relacionados

- [`../architecture/ARCHITECTURE.md`](../architecture/ARCHITECTURE.md) — estructura de código y componentes.
- [`../decisions/DECISIONS.md`](../decisions/DECISIONS.md) — registro de decisiones.
