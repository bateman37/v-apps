# v-apps — Vincle Apps

Vincle Apps es una plataforma web interna, todavía en fase inicial, que sustituirá progresivamente varias aplicaciones y ficheros Excel corporativos, compartiendo navegación, autenticación, datos maestros, seguridad, auditoría e integraciones.

## Estado actual

Esta entrega (DEV-004) cierra funcionalmente el primer módulo, el Gestor de Ofertas, sobre la base operativa de DEV-003:

- **Autenticación local provisional**: login con usuario y contraseña, cambio de contraseña obligatorio en el primer acceso, cierre de sesión, y administración de usuarios (`/admin/users`) vinculados al maestro común de personas. Roles `ADMIN` y `USER`, con permisos comprobados en servidor en cada pantalla y cada acción.
- **Código de cliente** obligatorio y único en `/admin/clients`, con aviso «Código pendiente» para los clientes heredados de DEV-003.
- **Auditoría atribuible y versiones inmutables** de cada oferta, con comparación de campos y jornadas entre versiones.
- **Comentarios internos** y **adjuntos** (hasta 25 MB, formatos cerrados) en la ficha de cada oferta, con descarga autenticada.
- **Archivo lógico y recuperación** de ofertas (`/offers?scope=archivadas`), sin borrado físico.
- **Bandeja «Pendiente de revisión»** derivada del estado y la asignación, con regla de flujo de estados y pedido de Navision obligatorio en `Aceptado`.
- **Centro de notificaciones internas** y administración de reglas de notificación (`/admin/notification-rules`), al estilo de un disparador. El canal «Interna + email» no envía todavía ningún correo real.
- **Exportación a Excel** del listado, con los mismos filtros y permisos, en tres hojas (`Ofertas`, `Jornadas`, `Historial`).
- **Administración protegida del contador** de numeración (`/admin/counter`), solo para `ADMIN`.

> ⚠️ **Aplicación únicamente apta para desarrollo local.** La autenticación es local y provisional (decisión temporal aprobada, ver [`docs/decisions/DECISIONS.md`](docs/decisions/DECISIONS.md)): no hay SSO, no hay email real, y no debe exponerse en una red accesible ni usarse con datos reales de clientes o empleados.

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

Abre `.env` y completa, como mínimo:

```
DATABASE_URL="postgresql://vapps:una_contrasena_local_a_tu_eleccion@localhost:5432/vapps_dev"
ADMIN_BOOTSTRAP_USERNAME="elige-un-usuario"
ADMIN_BOOTSTRAP_PASSWORD="elige-una-contrasena-temporal"
```

`ADMIN_BOOTSTRAP_USERNAME` y `ADMIN_BOOTSTRAP_PASSWORD` solo se usan una vez, en el paso 9 de más abajo, para crear la primera cuenta de administrador. Puedes borrarlas del `.env` en cuanto hayas iniciado sesión. El resto de variables (`SESSION_COOKIE_NAME`, `ATTACHMENTS_STORAGE_PATH`) tienen un valor por defecto razonable y no es necesario tocarlas.

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

También crea, **solo si todavía no existe**, el contador técnico de numeración de ofertas con valor `0`, y comprueba o crea idempotentemente las personas autorizadas (comerciales y Project Managers) y las tres reglas iniciales de notificación. Volver a ejecutar este comando nunca reinicia ni rebaja un contador que ya esté en uso, ni duplica personas ni reglas. La carga inicial no crea ningún cliente ni oferta de ejemplo.

### 9. Crear el administrador inicial

```bash
npm run auth:bootstrap-admin
```

Crea, **solo si todavía no existe**, la cuenta de administrador con el usuario y la contraseña temporal de tu `.env`, vinculada a la persona «Dennis Barragan» del seed. Solo se guarda el hash de la contraseña; nunca se imprime en la consola ni se restablece si la cuenta ya existe. Repetir este comando cuando la cuenta ya existe no hace nada y te lo indica explícitamente.

### 10. Arrancar la aplicación

```bash
npm run dev
```

### 11. Abrir la aplicación e iniciar sesión

Visita [http://localhost:3000](http://localhost:3000). Sin sesión, la raíz te lleva a `/login`. Inicia sesión con el usuario y la contraseña temporal del paso 9: la aplicación te pedirá cambiarla antes de continuar. Con sesión, la raíz te lleva a `/offers`.

### 12. Detener la aplicación

Vuelve a la terminal donde ejecutaste `npm run dev` y pulsa `Ctrl+C`.

### 13. Repetir el seed y comprobar que no duplica registros

Vuelve a ejecutar:

```bash
npm run db:seed
```

Los mensajes mostrarán el mismo número de registros verificados que la primera vez (por ejemplo, 3 prioridades, 14 perfiles profesionales, 14 personas autorizadas, 3 reglas de notificación, etc.) y el contador de numeración seguirá mostrando su valor actual. Ejecutarlo varias veces nunca duplica datos ni reinicia el contador. Repite también `npm run auth:bootstrap-admin`: verás que confirma que la cuenta ya existe, sin tocarla.

## Prueba manual de aceptación

Guía numerada para el Product Owner. Continúa después de la guía de arranque anterior, con la aplicación en marcha en [http://localhost:3000](http://localhost:3000) y sesión iniciada como administrador. No necesitas tocar PostgreSQL en ningún momento, ni usar datos reales: todos los nombres que escribas pueden ser inventados.

### 0. Comprobar que el acceso anónimo está bloqueado

Cierra sesión (botón **Cerrar sesión**, arriba a la derecha) y visita directamente `http://localhost:3000/offers` o `http://localhost:3000/admin/users` sin haber iniciado sesión.

> **Resultado esperado**: en ambos casos se te lleva a `/login` con el aviso `Tu sesión ha caducado o no es válida`. Vuelve a iniciar sesión antes de continuar.

### 1. Crear un cliente con código

Entra en **Administración > Clientes**. Escribe un código (por ejemplo, `CLI001`) y un nombre inventado (por ejemplo, `Cliente de prueba 1`) y pulsa **Crear cliente**.

> **Resultado esperado**: el cliente aparece en la tabla de abajo con su código, la etiqueta verde `Activo` y con `0` ofertas. Si dejas el código vacío, el alta se rechaza. Si repites el mismo código o el mismo nombre (aunque cambies mayúsculas o espacios), verás el error correspondiente de duplicado.

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

### 12. Crear un usuario normal y comprobar sus permisos

Entra en **Administración > Usuarios** y crea uno vinculado a una de las personas que creaste antes (por ejemplo, la persona comercial), con rol `Usuario` y una contraseña temporal. Abre una ventana de navegación privada, entra con ese usuario y cambia la contraseña cuando te lo pida.

> **Resultado esperado**: con ese usuario no ves el menú **Administración**. Si escribes directamente la URL `/admin/clients`, se te deniega el acceso. En **Todas las ofertas** solo ves las ofertas donde esa persona es comercial o PM, o las que ese usuario ha creado; no ves el resto.

### 13. Pedido de Navision obligatorio en «Aceptado»

Abre una oferta y pulsa **Modificar**. Cambia el estado a `Aceptado` sin rellenar **Pedido de Navision** y guarda.

> **Resultado esperado**: el guardado se rechaza con el mensaje junto al campo. Rellena un pedido cualquiera (por ejemplo, `NAV-0001`) y guarda: esta vez se acepta.

### 14. Bandeja «Pendiente de revisión»

Cambia el estado de una oferta a `A valorar PM` (con un PM asignado) y de otra a `Entregado a comercial` (con un comercial asignado). Entra en **Pendiente de revisión**.

> **Resultado esperado**: ambas ofertas aparecen en la bandeja, cada una con su tipo. Abre la de `A valorar PM` y usa el bloque **Revisar**: si intentas guardar sin cambiar el estado, se rechaza con el mensaje correspondiente; si eliges otro estado, la revisión se completa y la oferta desaparece de la bandeja.

### 15. Comentarios con autor y fecha automáticos

Abre cualquier oferta y añade un comentario en el bloque **Comentarios internos**.

> **Resultado esperado**: el comentario aparece con tu nombre y la fecha y hora actuales, sin que hayas podido escribirlos tú.

### 16. Adjuntar y descargar un documento

En la misma ficha, adjunta un PDF pequeño (o cualquier imagen `.png`/`.jpg`). Después intenta adjuntar un archivo `.exe` o uno mayor de 25 MB.

> **Resultado esperado**: el PDF se sube y aparece en la lista, con enlace de descarga que funciona. El `.exe` y el archivo demasiado grande se rechazan con un mensaje claro.

### 17. Archivar y recuperar una oferta

Abre una oferta y pulsa **Archivar**, confirmando el aviso. Entra después en **Ofertas archivadas** desde el menú.

> **Resultado esperado**: la oferta desaparece de **Todas las ofertas** pero aparece en **Ofertas archivadas**, con el mismo número y los mismos datos. Ábrela y pulsa **Recuperar**: vuelve a aparecer en el listado ordinario.

### 18. Notificaciones internas

Con dos usuarios distintos (uno comercial, otro PM de la misma oferta), crea una oferta con el usuario comercial asignándole ese PM. Entra con el usuario PM y mira el contador de **Notificaciones** en la cabecera.

> **Resultado esperado**: el PM tiene una notificación nueva sobre la oferta creada; el comercial que la creó no se notifica a sí mismo. Al abrirla se marca como leída.

### 19. Regla de notificación «Interna + email»

Entra en **Administración > Reglas de notificación** y crea una regla nueva con canal `Interna + email`.

> **Resultado esperado**: la regla se crea y muestra el aviso de que el envío por email está pendiente de configuración. No se produce ningún intento de envío real.

### 20. Exportar a Excel

En **Todas las ofertas**, aplica algún filtro y pulsa **Exportar a Excel**.

> **Resultado esperado**: se descarga un archivo `ofertas-AAAA-MM-DD.xlsx` con tres hojas (`Ofertas`, `Jornadas`, `Historial`) que contienen únicamente las ofertas que cumplen el filtro aplicado.

### 21. Administración del contador

Entra en **Administración > Contador de ofertas** con una cuenta `ADMIN`. Intenta fijar un valor menor que el actual.

> **Resultado esperado**: la operación se rechaza. Un valor mayor sí se acepta, con una confirmación que muestra el valor anterior y el nuevo.

## Qué no incluye esta entrega

Para evitar confusiones durante la prueba, estas cosas **no** existen todavía, de forma deliberada:

- SSO, Azure AD, OAuth, LDAP ni recuperación de contraseña por email: la autenticación es local y provisional (`DEC-019`).
- Envío real de correo: el canal «Interna + email» de las reglas de notificación no envía ni simula ningún email.
- Restauración de una versión antigua de una oferta a partir del historial.
- Borrado físico de ofertas, comentarios, adjuntos, auditoría o versiones desde la interfaz: solo archivo lógico y desactivación de maestros.
- Migración del histórico desde el Excel o SQL Server legado.
- Despliegue, Docker o infraestructura de producción.

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
| `npm run db:seed` | Carga (de forma idempotente) los maestros de referencia, las personas autorizadas y las reglas de notificación iniciales. |
| `npm run auth:bootstrap-admin` | Crea (de forma idempotente) la cuenta de administrador inicial. |

## Historial de entregas

Ver [`CHANGELOG.md`](CHANGELOG.md).
