# v-apps — Vincle Apps

Vincle Apps es una plataforma web interna, todavía en fase inicial, que sustituirá progresivamente varias aplicaciones y ficheros Excel corporativos, compartiendo navegación, autenticación, datos maestros, seguridad, auditoría e integraciones.

## Estado actual

Esta entrega añade el **primer flujo realmente operativo del Gestor de Ofertas**, sobre la base técnica creada anteriormente:

- Administración de **clientes**, **personas** y los **ocho catálogos** de oferta: alta, edición y activación o desactivación. Ningún registro se borra físicamente.
- **Alta, listado, consulta y modificación de ofertas**, con numeración automática `VI` + año + mes + contador global, segura ante altas simultáneas e inmutable al modificar.
- **Búsqueda, filtros, ordenación y paginación** resueltos en PostgreSQL, con el estado completo en la dirección del navegador.
- **Jornadas por perfil** con total calculado, **histórico de estados** y **auditoría** de los cambios.
- **Identidad visual oficial de Vincle** aplicada de forma transversal (ver [`docs/design/BRAND_UI.md`](docs/design/BRAND_UI.md)).

> ⚠️ **Aplicación únicamente apta para desarrollo local.** Todavía no implementa autenticación ni autorización (decisión temporal aprobada, ver [`docs/decisions/DECISIONS.md`](docs/decisions/DECISIONS.md)). No la expongas en una red accesible ni la uses con datos reales de clientes o empleados.

Para el detalle del estado y del próximo objetivo, ver [`docs/PROJECT_STATUS.md`](docs/PROJECT_STATUS.md).

## Cómo navegar la documentación

El punto de entrada a toda la documentación es [`docs/INDEX.md`](docs/INDEX.md), que enlaza y ordena:

- La visión, el alcance y el roadmap del producto (`docs/product/`).
- La arquitectura, el modelo de datos y las reglas de seguridad (`docs/architecture/`).
- La identidad visual y los tokens de interfaz (`docs/design/BRAND_UI.md`).
- Los maestros compartidos por toda la plataforma (`docs/shared/`).
- La especificación funcional del primer módulo, el Gestor de Ofertas (`docs/offers/`).
- El registro de decisiones aprobadas y pendientes (`docs/decisions/DECISIONS.md`).

## Cómo se trabaja en este repositorio

Este proyecto se desarrolla mediante encargos entregados a Claude Code, conservados como prompts en [`prompts/`](prompts/README.md). Las reglas completas de colaboración —roles, ramas, Pull Requests, alcance, calidad e idioma— están fijadas en [`AGENTS.md`](AGENTS.md), con instrucciones específicas para Claude Code en [`CLAUDE.md`](CLAUDE.md).

En resumen:

- Cada entrega parte de `main` actualizado, se desarrolla en una rama propia y termina en una Pull Request abierta.
- El usuario (Product Owner) revisa, prueba manualmente y fusiona cada Pull Request; Claude Code nunca fusiona.
- Cada entrega se limita estrictamente a su alcance declarado.

## Guía de arranque local

Pensada para poder seguirse sin conocimientos técnicos previos.

### 1. Requisitos previos

- [Node.js](https://nodejs.org/) 22 (versión indicada en [`.nvmrc`](.nvmrc); si usas [nvm](https://github.com/nvm-sh/nvm), ejecuta `nvm use` en la carpeta del proyecto).
- [PostgreSQL](https://www.postgresql.org/) instalado y en marcha en tu máquina.
- Git.

### 2. Clonar o actualizar el repositorio

```bash
git clone https://github.com/bateman37/v-apps.git
cd v-apps
```

Si ya lo tenías clonado, simplemente actualiza tu copia con `git pull` en la rama correspondiente.

### 3. Instalar las dependencias

```bash
npm install
```

Este comando descarga, en la carpeta `node_modules`, exactamente las mismas versiones de librerías con las que se ha probado esta entrega (fijadas en `package-lock.json`).

### 4. Crear una base de datos PostgreSQL local para `v-apps`

Crea una base de datos separada, que no compartas con ningún otro proyecto. Por ejemplo, desde una consola con acceso a `psql`:

```sql
CREATE ROLE vapps LOGIN PASSWORD 'una_contrasena_local_a_tu_eleccion';
CREATE DATABASE vapps_dev OWNER vapps;
```

Usa una contraseña propia de tu máquina de desarrollo; no reutilices contraseñas reales ni las publiques en ningún sitio.

### 5. Configurar las variables de entorno

Copia el archivo de ejemplo:

```bash
cp .env.example .env
```

Abre `.env` y sustituye el valor de `DATABASE_URL` por la conexión a tu base de datos local, por ejemplo:

```
DATABASE_URL="postgresql://vapps:una_contrasena_local_a_tu_eleccion@localhost:5432/vapps_dev"
```

El archivo `.env` nunca se sube al repositorio (está en `.gitignore`): solo existe en tu máquina.

### 6. Generar el cliente Prisma

```bash
npm run db:generate
```

Genera, a partir de `prisma/schema.prisma`, el código que la aplicación usa para hablar con PostgreSQL.

### 7. Ejecutar la migración

```bash
npm run db:migrate
```

Crea, en tu base de datos local, las tablas de los maestros de referencia descritos en `prisma/schema.prisma`.

### 8. Cargar los maestros

```bash
npm run db:seed
```

Inserta (o actualiza si ya existían) los valores maestros aprobados: prioridades, orígenes, tipos de oferta, estados de oferta, segmentaciones y perfiles profesionales. Los idiomas y los motivos de cancelación se dejan intencionadamente vacíos, porque todavía no hay valores aprobados; podrás crearlos tú desde la propia aplicación.

También crea, **solo si todavía no existe**, el contador técnico de numeración de ofertas con valor `0`. Volver a ejecutar este comando nunca reinicia ni rebaja un contador que ya esté en uso. La carga inicial no crea ningún cliente, persona ni oferta de ejemplo.

### 9. Arrancar la aplicación

```bash
npm run dev
```

### 10. Abrir la aplicación

Visita [http://localhost:3000](http://localhost:3000) en tu navegador. La raíz te llevará automáticamente a `/offers`.

### 11. Detener la aplicación

Vuelve a la terminal donde ejecutaste `npm run dev` y pulsa `Ctrl+C`.

### 12. Repetir el seed y comprobar que no duplica registros

Vuelve a ejecutar:

```bash
npm run db:seed
```

Los mensajes mostrarán el mismo número de registros verificados que la primera vez (por ejemplo, 3 prioridades, 14 perfiles profesionales, etc.) y el contador de numeración seguirá mostrando su valor actual. Ejecutarlo varias veces nunca duplica datos ni reinicia el contador.

## Prueba manual de aceptación

Guía numerada para el Product Owner. Continúa después de la guía de arranque anterior, con la aplicación en marcha en [http://localhost:3000](http://localhost:3000). No necesitas tocar PostgreSQL en ningún momento, ni usar datos reales: todos los nombres que escribas pueden ser inventados.

### 1. Crear un cliente

Entra en **Administración > Clientes**. Escribe un nombre inventado (por ejemplo, `Cliente de prueba 1`) y pulsa **Crear cliente**.

> **Resultado esperado**: el cliente aparece en la tabla de abajo con la etiqueta verde `Activo` y con `0` ofertas. Si vuelves a intentar crear el mismo nombre (aunque cambies mayúsculas o espacios), verás el error `Ya existe un cliente con ese nombre.`

### 2. Crear una persona habilitada como comercial

Entra en **Administración > Personas**. Escribe un nombre inventado (por ejemplo, `Comercial de prueba`), marca la casilla **Comercial** y pulsa **Crear persona**.

> **Resultado esperado**: la persona aparece en la tabla con la casilla `Comercial` marcada y la casilla `PM` sin marcar.

### 3. Crear una persona habilitada como Project Manager

En la misma pantalla, crea otra persona (por ejemplo, `PM de prueba`) marcando solo **Project Manager**. También puedes marcar las dos casillas en una única persona: es una decisión aprobada del proyecto.

> **Resultado esperado**: las dos personas conviven en la tabla, cada una con sus habilitaciones.

### 4. Crear un motivo de cancelación (solo si quieres probar «Anulado»)

Entra en **Administración > Maestros de oferta** y baja hasta **Motivos de cancelación**. Verás que la lista está vacía a propósito. Escribe un código (por ejemplo, `PRUEBA`), un nombre (por ejemplo, `Motivo de prueba`), deja el orden en `0` y pulsa **Añadir**.

> **Resultado esperado**: aparece el registro con su código en gris y su etiqueta `Activo`. El código ya no se puede cambiar: solo el nombre y el orden.

### 5. Crear una oferta con importe `0,00 €` y sin jornadas

Pulsa **Nueva oferta** en el menú lateral. Fíjate en que, arriba, el número indica **«Se asignará al guardar»**. Rellena los campos marcados con asterisco: cliente, prioridad, origen, comercial, Project Manager, fecha de la oferta, descripción, tipo de oferta, nombre del solicitante, estado, y escribe `0` en **Importe total**. No escribas ninguna jornada. Pulsa **Guardar oferta**.

> **Resultado esperado**: la aplicación te lleva a la ficha de la oferta y muestra un aviso verde con el número asignado, por ejemplo `VI202609-00001`. El importe se muestra como `0,00 €` y la sección de jornadas dice que la oferta no tiene jornadas informadas. Si en lugar de `0` escribes `-5`, el guardado se rechaza con el mensaje `El importe total no puede ser negativo.` junto al campo; si dejas el importe vacío, se rechaza igualmente.

### 6. Crear otra oferta con jornadas en varios perfiles

Vuelve a **Nueva oferta** y repite el paso anterior, pero esta vez escribe un importe (por ejemplo, `12.345,67`) y jornadas en dos o tres perfiles distintos (por ejemplo, `2,5` en Analista y `3` en Programador Backend). Escribe también algo en **Jornadas comerciales**, por ejemplo `1,25`.

> **Resultado esperado**: mientras escribes, el recuadro **Total de jornadas por perfil** se actualiza solo y muestra `5,5`. Las jornadas comerciales **no** se suman a ese total: son un concepto separado, y la propia pantalla lo indica. Al guardar, la ficha muestra la tabla de jornadas con su total calculado.

### 7. Comprobar la numeración consecutiva

Mira los números de las dos ofertas que has creado.

> **Resultado esperado**: son consecutivos, por ejemplo `VI202609-00001` y `VI202609-00002`. El año y el mes corresponden al momento en que las creaste, no a la fecha que escribiste en el formulario. Si abres el formulario de nueva oferta y lo cancelas sin guardar, **no** se consume ningún número: la siguiente oferta seguirá la numeración sin saltos.

### 8. Buscar y filtrar

Entra en **Todas las ofertas**. Escribe en el buscador una palabra de la descripción de una de ellas, o su número, o el nombre del cliente, y pulsa **Aplicar filtros**. Prueba después a combinar varios desplegables a la vez (por ejemplo, cliente y estado).

> **Resultado esperado**: la tabla muestra solo las ofertas que cumplen **todas** las condiciones a la vez. Arriba se ve el recuento y la suma del importe y de las jornadas de todo el resultado filtrado, no solo de la página que estás viendo. La dirección del navegador refleja los filtros, así que puedes recargar o compartir esa vista. El botón **Limpiar filtros** vuelve al listado completo. Pulsando los títulos de las columnas Número, Fecha, Cliente, Estado e Importe se ordena por esa columna sin perder los filtros.

### 9. Modificar descripción, importe y jornadas

Abre una oferta y pulsa **Modificar**. Cambia la descripción, cambia el importe y modifica las jornadas: sube una, y **borra otra dejando el campo vacío**. Guarda.

> **Resultado esperado**: el número de oferta que aparece arriba **no cambia**, y la fecha de creación tampoco. El total de jornadas se recalcula, y el perfil cuyo campo has dejado vacío desaparece de la tabla de jornadas en lugar de quedarse a cero.

### 10. Cambiar de estado y comprobar el histórico

Vuelve a **Modificar** y cambia el estado, por ejemplo a `Anulado`. Al seleccionarlo aparecerá el campo **Motivo de cancelación**: es obligatorio. Elige el motivo que creaste en el paso 4 y guarda. Después, entra otra vez a modificar, cambia solo la descripción **sin tocar el estado**, y guarda.

> **Resultado esperado**: en la ficha, la sección **Histórico de estados** tiene ahora dos líneas: el alta inicial (con «Alta de la oferta» como estado anterior) y el cambio a `Anulado`. La segunda modificación, que no cambió el estado, **no** añade ninguna línea nueva. Si seleccionas `Anulado` sin haber creado ningún motivo, la aplicación te avisa y te remite a Administración en lugar de inventarse un motivo. Si después vuelves a un estado distinto de `Anulado`, el motivo deja de guardarse.

### 11. Desactivar un maestro y comprobar que la oferta histórica lo conserva

Entra en **Administración > Maestros de oferta**, busca el motivo de cancelación que creaste y pulsa **Desactivar**. Confirma el aviso, que te explica que no se borra nada. Haz lo mismo, si quieres, con el cliente en **Administración > Clientes**.

> **Resultado esperado**: el registro sigue en la tabla de Administración, ahora con la etiqueta gris `Inactivo`. Si abres la oferta que lo usa, el motivo y el cliente **siguen apareciendo con normalidad**. Si abres **Nueva oferta**, ese cliente ya no aparece entre los seleccionables; pero si abres **Modificar** en la oferta que ya lo usaba, sí sigue disponible, marcado como `(inactivo)`, para que puedas guardar los cambios sin perder el dato.

## Qué no incluye esta entrega

Para evitar confusiones durante la prueba, estas cosas **no** existen todavía, de forma deliberada:

- No hay login ni usuarios: la aplicación es **solo para uso local** y las pantallas de Administración no están restringidas a nadie.
- La aplicación registra qué cambió y cuándo, pero **no puede saber quién** lo cambió, porque no hay usuarios.
- No se puede borrar ninguna oferta, cliente, persona ni valor de catálogo: solo desactivarlos.
- No hay reglas sobre qué estados pueden seguir a cuáles, ni correos automáticos, ni exportación a Excel, ni importación del histórico.
- No existe pantalla para ajustar el contador de numeración.

## Comandos disponibles

| Comando | Qué hace |
|---|---|
| `npm run dev` | Arranca la aplicación en modo desarrollo. |
| `npm run build` | Genera la build de producción (solo para validación local en esta entrega). |
| `npm run start` | Arranca la build de producción ya generada. |
| `npm run lint` | Revisa el estilo y errores comunes del código. |
| `npm run typecheck` | Comprueba los tipos de TypeScript sin generar archivos. |
| `npm run test` | Ejecuta las pruebas automatizadas mínimas del proyecto. |
| `npm run db:generate` | Genera el cliente Prisma a partir del esquema. |
| `npm run db:migrate` | Aplica las migraciones de base de datos en desarrollo. |
| `npm run db:seed` | Carga (de forma idempotente) los maestros de referencia. |

## Historial de entregas

Ver [`CHANGELOG.md`](CHANGELOG.md).
