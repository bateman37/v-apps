# V-APPS — DEV-004: cierre funcional del Gestor de Ofertas, autenticación local y notificaciones

## Rol

Actúa como arquitecto y desarrollador full-stack senior responsable de cerrar funcionalmente el primer módulo de Vincle Apps, el Gestor de Ofertas, manteniendo máxima calidad de código, seguridad, trazabilidad, integridad de datos y coherencia documental.

Repositorio:

`https://github.com/bateman37/v-apps`

La Pull Request `#3`, correspondiente a DEV-003, ya está fusionada en `main`. La aplicación dispone de Next.js, React, TypeScript estricto, Prisma 6, PostgreSQL, Tailwind CSS, la identidad visual oficial de Vincle, administración de maestros y el primer flujo operativo de listado, alta, consulta y modificación de ofertas.

Esta es deliberadamente una entrega grande. Agrupa piezas que dependen entre sí y que deben quedar coherentes en una única Pull Request:

1. Corrección del error detectado al reintentar guardar una oferta.
2. Código de cliente y precarga idempotente de comerciales y Project Managers.
3. Autenticación local provisional y autorización por roles.
4. Auditoría atribuible, versiones reales, comentarios y adjuntos de oferta.
5. Archivo lógico, recuperación y consulta de ofertas archivadas.
6. Bandeja de revisiones pendientes y reglas aprobadas de estado/Navision.
7. Centro de notificaciones internas y reglas configurables por Administración.
8. Exportación del listado de ofertas a Excel.
9. Administración protegida del contador de ofertas.

No conviertas la amplitud de la entrega en permiso para anticipar ESM, FACT, migración histórica, infraestructura, SSO ni integraciones externas.

---

## Lectura obligatoria antes de modificar archivos

Lee completos, como mínimo:

- `AGENTS.md`.
- `CLAUDE.md`.
- `README.md`.
- `CHANGELOG.md`.
- `docs/INDEX.md`.
- `docs/PROJECT_STATUS.md`.
- `docs/product/SCOPE.md`.
- `docs/product/ROADMAP.md`.
- `docs/architecture/ARCHITECTURE.md`.
- `docs/architecture/DATA_MODEL.md`.
- `docs/architecture/SECURITY.md`.
- `docs/design/BRAND_UI.md`.
- `docs/shared/MASTER_DATA.md`.
- Todos los documentos de `docs/offers/`.
- `docs/decisions/DECISIONS.md`.
- `prompts/README.md`.
- `prisma/schema.prisma`, `prisma/seed.ts` y `prisma/seed-data.ts`.
- Todo el código actual de `src/app`, `src/components`, `src/modules` y `src/lib` relacionado con layout, administración, ofertas y auditoría.
- Las migraciones Prisma y las pruebas existentes.

Comprueba primero que `main` contiene DEV-003 y que el árbol de trabajo está limpio. Si el entorno ya asigna una rama de trabajo, utiliza esa rama. En caso contrario, parte de `main` actualizado mediante fast-forward y crea una rama específica, por ejemplo:

`feat/dev-004-close-offers-module`

No hagas push directo a `main`.

Este encargo resuelve expresamente varias decisiones que hasta DEV-003 aparecían como pendientes. Actualiza su estado en la documentación en lugar de tratarlas como contradicciones. Si encuentras cualquier otra contradicción real con una decisión aprobada que este prompt no resuelva expresamente, detente y explícasela al Product Owner antes de modificarla.

---

## Conservación obligatoria del prompt

Guarda una copia fiel de este encargo en:

`prompts/0004-cierre-gestor-ofertas-autenticacion-notificaciones.md`

Inclúyela en el mismo commit y en la misma Pull Request que el código. No edites retroactivamente los prompts anteriores.

---

## Objetivo verificable

Al terminar, una persona no técnica debe poder:

1. Configurar un administrador inicial sin guardar ninguna contraseña en Git.
2. Iniciar y cerrar sesión.
3. Crear usuarios vinculados al maestro común de personas.
4. Crear una oferta sin perder lo ya introducido si se produce un error de validación o de base de datos.
5. Consultar quién creó o modificó una oferta, cuándo lo hizo y qué cambió.
6. Consultar y comparar versiones inmutables de los datos de la oferta.
7. Añadir comentarios y adjuntar documentación de forma trazable.
8. Archivar una oferta, consultarla en la vista de archivadas y recuperarla.
9. Ver en `Pendiente de revisión` las ofertas que le corresponden como PM o comercial y revisarlas cambiando su estado.
10. Recibir y consultar notificaciones internas.
11. Configurar reglas de notificación desde Administración, escogiendo `Solo interna` o `Interna + email`, sin que todavía se envíe ningún correo.
12. Exportar a `.xlsx` el resultado completo de los filtros del listado en tres hojas ordenadas.
13. Administrar de forma protegida el contador técnico de ofertas.

---

# 0. Principios no negociables de la entrega

## 0.1 Integridad y compatibilidad

- Conserva el comportamiento correcto ya entregado en DEV-003.
- Las migraciones deben ser aplicables sobre una base de datos que ya contiene datos de DEV-003 y también sobre una base nueva.
- No borres, reinicies ni renumeres ofertas, contadores, auditorías ni históricos existentes.
- No hagas migraciones destructivas ni `reset` de base de datos como parte del flujo normal.
- Mantén Prisma en la línea 6.x salvo que exista una causa técnica imprescindible y documentada; no migres a Prisma 7 por iniciativa propia.
- Usa transacciones para las operaciones que deban persistir juntas.
- Mantén TypeScript en modo estricto y la separación modular existente.

## 0.2 Seguridad y datos

- Nunca guardes contraseñas en texto plano.
- Nunca incluyas contraseñas, secretos, tokens, cadenas de conexión ni credenciales de ejemplo reales en código, prompts, documentación, logs, commits o Pull Requests.
- No registres contraseñas, cookies, tokens de sesión ni rutas físicas internas en `AuditLog`.
- Los adjuntos no pueden quedar bajo `public/` ni servirse mediante una URL de fichero predecible.
- Todas las comprobaciones de acceso deben ejecutarse en servidor; ocultar un botón en la interfaz no es autorización.
- No uses datos del antiguo libro Excel como secretos o configuración. En particular, no copies al repositorio hojas técnicas, macros, conexiones, usuarios, contraseñas ni parámetros SMTP.

## 0.3 Excepción expresa y limitada para el maestro de personas

El Product Owner autoriza expresamente en esta entrega la precarga de los nombres de comerciales y Project Managers indicados más adelante como datos maestros operativos. Esta excepción se limita a esos nombres y habilitaciones.

No añadas emails, teléfonos, nombres de usuario, contraseñas, departamentos ni ningún otro dato personal. Documenta esta autorización limitada sin debilitar la regla general de seguridad del repositorio.

## 0.4 Interfaz

- Mantén los tokens y la identidad visual definidos en `docs/design/BRAND_UI.md`.
- Conserva el azul `#1F18C0` como color principal, el negro para texto y el mostaza `#DBBA12` únicamente como acento limitado.
- Mantén contraste WCAG AA, foco visible, navegación por teclado y mensajes en español comprensibles.
- Diseña para escritorio corporativo, pero evita desbordamientos y bloqueos en anchos menores razonables.

---

# BLOQUE 1 — Corrección prioritaria del guardado de ofertas

## 1.1 Error observado

Se ha reproducido esta secuencia:

1. El usuario rellena todos los campos obligatorios.
2. El primer guardado alcanza la asignación del número, pero falla porque no existe el contador `offer_number` cuando no se ha ejecutado correctamente el seed.
3. Al volver el formulario con el error, varios `select` parecen conservar visualmente su contenido de forma inconsistente o lo pierden.
4. El siguiente intento falla con `El estado es obligatorio`, aunque el estado se había elegido antes del primer error.

La primera petición llegó hasta el contador, por lo que el estado sí estaba presente inicialmente. El problema que debe corregirse es la restauración incoherente del estado completo del formulario después de un error del servidor.

## 1.2 Corrección requerida

- Revisa el contrato entre `OfferForm`, `OfferFormState`, la validación y las server actions.
- Tras cualquier error de validación, conflicto, base de datos o infraestructura, conserva y vuelve a mostrar todos los valores enviados:
  - todos los campos de texto;
  - importes y decimales;
  - fechas;
  - todos los desplegables;
  - motivo de cancelación;
  - estado;
  - cliente, comercial y PM;
  - jornadas por perfil.
- No mezcles `defaultValue` no controlados con un estado controlado parcial si eso permite que la interfaz y el `FormData` diverjan.
- El usuario debe poder corregir el problema y reenviar sin rellenar de nuevo el formulario.
- Mantén el foco o lleva el foco al resumen de errores de forma accesible.
- Los errores técnicos deben seguir degradando a mensajes seguros en español, sin detalles de conexión.

## 1.3 Contador ausente

- `npm run db:seed` debe seguir creando idempotentemente `offer_number` sin reiniciar nunca su valor.
- La documentación de arranque debe dejar claro el orden correcto: migración, seed, bootstrap del administrador y arranque.
- La nueva pantalla protegida del contador, descrita más adelante, debe mostrar un estado claro si el contador falta y permitir inicializarlo explícitamente con confirmación.
- No inicialices ni rebajes silenciosamente un contador durante el alta de una oferta.

Añade una prueba de regresión pequeña y directa para demostrar que, después de una respuesta de error, el estado y el resto de valores relevantes vuelven al formulario y el segundo envío contiene los valores correctos.

---

# BLOQUE 2 — Maestro de clientes y precarga de personas

## 2.1 Cliente: código de cliente

El maestro de clientes tendrá únicamente, en esta fase, los datos ya existentes más:

- `code`: código de cliente.
- `name`: cliente.

No existe `grupo de cliente`. No añadas ni conserves ningún campo, filtro o concepto de grupo de cliente.

Reglas del código:

- Obligatorio al crear un cliente nuevo.
- Obligatorio al guardar la edición de un cliente.
- Único en base de datos.
- Se recortan únicamente los espacios exteriores.
- Se conserva exactamente la capitalización escrita por el usuario; no lo conviertas automáticamente a mayúsculas.
- No inventes un formato, prefijo o secuencia.
- Los clientes existentes de DEV-003 deben migrarse sin inventar códigos: añade el campo de forma compatible, permitiendo temporalmente `null` en base de datos.
- En Administración, los clientes antiguos sin código deben mostrarse con un aviso `Código pendiente` y no pueden guardarse de nuevo sin informarlo.
- Un cliente activo sin código no debe poder elegirse para una oferta nueva.
- Una oferta histórica que ya apunte a un cliente sin código debe seguir siendo consultable y editable sin perder la relación; no bloquees una modificación no relacionada ni inventes un código.
- La búsqueda de clientes debe encontrar por nombre o código.

Usa una restricción única compatible con el carácter temporalmente nullable del campo. Documenta por qué la obligatoriedad funcional es más estricta que la nulabilidad transitoria de la migración.

## 2.2 Precarga idempotente de personas

Amplía el seed para comprobar o crear idempotentemente estas personas y habilitaciones:

### Comerciales

1. África Amilibia Puig
2. Beatriz Esteve
3. David Diez
4. Hector Recio
5. Juan Manuel Recio
6. Miriam Recio
7. Silvia Capdevila

### Project Managers

1. David Oliva Viver
2. Dennis Barragan
3. Felix Carapaica
4. Fernando Carrera
5. Josep Miro
6. Juan José Cibrián
7. Sergio López

Reglas:

- No dupliques personas si el seed se ejecuta varias veces.
- Si una misma persona ya existe, actualiza únicamente las habilitaciones aprobadas que correspondan sin crear otro registro.
- No desactives otras personas creadas por el usuario.
- No borres habilitaciones adicionales que el usuario haya añadido a una persona, salvo que sean claramente un dato de seed todavía no modificado; prioriza no destruir cambios locales.
- No asignes emails ni usuarios automáticamente a todas estas personas.
- La cuenta de administrador inicial se vinculará a `Dennis Barragan`, como se define en el bloque de autenticación.

---

# BLOQUE 3 — Autenticación local provisional y autorización

## 3.1 Alcance de autenticación

Implementa un login local con usuario y contraseña. No implementes SSO, OAuth, LDAP, Azure AD, recuperación por email ni integración con ningún proveedor externo.

Esta autenticación es provisional para poder probar y atribuir acciones. La decisión sobre autenticación corporativa definitiva continúa fuera de alcance.

## 3.2 Modelo mínimo

Implementa un modelo coherente equivalente a:

- `User`:
  - identificador interno;
  - `username` único y normalizado de forma documentada;
  - hash de contraseña;
  - rol `ADMIN` o `USER`;
  - `isActive`;
  - relación uno a uno obligatoria con `Person`;
  - `mustChangePassword`;
  - fechas de creación y actualización.
- `Session`:
  - token aleatorio suficientemente fuerte, almacenando en base de datos únicamente su hash si se persiste;
  - usuario;
  - fecha de creación y expiración;
  - revocación o eliminación al cerrar sesión.

Puedes ajustar nombres técnicos al estilo del repositorio, pero no rebajes estas garantías.

## 3.3 Contraseñas y sesiones

- Usa un algoritmo maduro de hash de contraseñas adecuado para contraseñas, como Argon2id, bcrypt o scrypt con sal y parámetros seguros. No diseñes criptografía propia.
- Usa comparación segura y mensajes de login genéricos que no revelen si existe el usuario.
- La cookie de sesión debe ser `HttpOnly`, `SameSite=Lax`, `Secure` en producción y tener una caducidad razonable.
- Protege las mutaciones contra peticiones de otro origen y valida la sesión en cada server action o endpoint sensible.
- Un usuario inactivo no puede iniciar sesión y sus sesiones existentes deben dejar de ser válidas.
- Nunca envíes el hash al cliente.
- No guardes contraseñas en auditoría ni logs.

## 3.4 Administrador inicial

El primer administrador será una cuenta vinculada a la persona `Dennis Barragan`.

- Añade variables documentadas a `.env.example`, únicamente con marcadores seguros, para:
  - usuario inicial;
  - contraseña inicial;
  - secreto de sesión si el diseño lo requiere;
  - ruta de almacenamiento de adjuntos.
- No incluyas una contraseña real ni una contraseña por defecto funcional.
- Proporciona un comando explícito, por ejemplo `npm run auth:bootstrap-admin`, que:
  - exige las variables necesarias;
  - comprueba que la persona existe tras el seed;
  - crea la cuenta `ADMIN` solo si no existe;
  - almacena únicamente el hash;
  - es idempotente;
  - nunca restablece silenciosamente la contraseña de una cuenta ya creada;
  - no imprime la contraseña.
- La primera contraseña debe obligar a cambiarla al iniciar sesión por primera vez.

No mezcles la contraseña en el seed de datos maestros ni hagas que las pruebas dependan de una credencial real.

## 3.5 Administración de usuarios

Crea una pantalla solo para administradores, por ejemplo `/admin/users`, desde la que se pueda:

- crear una cuenta vinculándola a una persona que todavía no tenga usuario;
- indicar `username`, rol y contraseña temporal;
- activar o desactivar la cuenta;
- cambiar el rol;
- generar una nueva contraseña temporal de forma explícita;
- obligar al cambio de contraseña en el siguiente acceso.

No muestres hashes ni contraseñas existentes. La contraseña temporal solo puede conocerse durante la acción explícita que la establece; no la guardes para poder volver a mostrarla.

## 3.6 Permisos aprobados

### Administrador

Puede:

- ver y modificar todas las ofertas;
- ver todas las revisiones pendientes;
- archivar y recuperar cualquier oferta;
- administrar clientes, personas, catálogos y usuarios;
- administrar el contador;
- administrar reglas de notificación;
- consultar la auditoría y las versiones de cualquier oferta.

### Usuario

Puede:

- crear ofertas;
- ver una oferta si es su creador, su comercial asignado o su Project Manager asignado;
- modificar esa oferta bajo el mismo criterio;
- comentar y adjuntar documentación a una oferta a la que tiene acceso;
- archivar o recuperar una oferta que puede modificar;
- ver únicamente sus revisiones y notificaciones;
- exportar únicamente las ofertas que puede consultar.

No puede acceder a Administración.

Aplica este alcance en todas las consultas, exportaciones, descargas, mutaciones y rutas directas. Para recursos no autorizados, devuelve una respuesta segura equivalente a no encontrado o acceso denegado, sin filtrar datos.

Las ofertas antiguas sin creador autenticado siguen existiendo. Solo un administrador puede verlas mientras no estén asignadas al usuario por comercial o PM.

## 3.7 Navegación y experiencia

- Añade pantalla de login y cierre de sesión.
- Muestra en el layout común la persona autenticada y su rol.
- Sustituye el aviso `autenticación pendiente` por un aviso honesto de `Autenticación local provisional`.
- La raíz debe llevar al login cuando no hay sesión y al módulo de ofertas cuando sí la hay.
- Una sesión expirada debe volver al login con un mensaje claro, sin perder seguridad.
- Incluye una pantalla de cambio de contraseña propia.

---

# BLOQUE 4 — Auditoría atribuible y versiones reales

## 4.1 Auditoría técnica con actor

Evoluciona `AuditLog` para relacionar, cuando corresponda, cada acción con el usuario autenticado y mostrar su nombre de persona.

- Conserva los registros anteriores con actor `null` y muéstralos como `Usuario no disponible (registro anterior al login)` o texto equivalente.
- Registra, como mínimo, alta y edición de ofertas, archivo, recuperación, comentarios, alta o retirada lógica de adjuntos, cambios de estado, revisiones, cambios en maestros, gestión de usuarios, reglas de notificación y ajustes del contador.
- Los cambios deben ser estructurados y seguros: campo, valor anterior y valor nuevo cuando proceda.
- No incluyas secretos, contraseñas, tokens, contenido binario ni rutas físicas.
- La auditoría es append-only desde la aplicación.

## 4.2 Versiones funcionales de oferta

La auditoría técnica no sustituye el historial de versiones. Implementa un modelo `OfferVersion` o equivalente con:

- oferta;
- número de versión entero, empezando en 1 y único dentro de la oferta;
- fecha y hora;
- autor autenticado, nullable únicamente para datos históricos previos;
- instantánea inmutable de todos los campos funcionales de la oferta;
- instantánea completa de las jornadas por perfil.

La instantánea debe ser legible aunque en el futuro cambie el nombre de un maestro. Incluye IDs para trazabilidad y los códigos/nombres presentables necesarios para reconstruir la versión sin depender exclusivamente del valor actual del catálogo.

Reglas:

- `v1` se crea al dar de alta una oferta.
- Cada guardado posterior que cambie algún campo funcional o alguna jornada crea exactamente una nueva versión consecutiva.
- Un guardado sin cambios no crea una versión vacía.
- Los cambios de estado realizados desde la revisión también crean versión.
- Añadir un comentario, marcar una notificación como leída o descargar un adjunto no crea versión de la oferta.
- Archivar o recuperar queda en auditoría, pero no necesita crear una versión funcional si no cambian los datos de la oferta.
- La versión y los cambios de la oferta deben persistirse en la misma transacción.
- Evita carreras que puedan duplicar el número de versión.
- Las versiones nunca se editan ni eliminan.

## 4.3 Interfaz de auditoría y versiones

En la ficha de una oferta añade un botón visible `Auditoría e historial`.

La vista debe permitir:

- ver una línea temporal con autor, día, hora y acción;
- identificar cambios de estado;
- ver comentarios y eventos de adjuntos dentro de la trazabilidad;
- abrir una versión concreta;
- comparar dos versiones mostrando solo los campos y jornadas que cambiaron.

No implementes restauración de versiones en esta entrega.

---

# BLOQUE 5 — Observaciones y comentarios internos

Mantén el campo grande de `Observaciones` de la oferta como dato funcional versionado.

Junto a él, en la ficha de la oferta, presenta un historial de comentarios u observaciones añadidas con:

- texto;
- autor obtenido siempre de la sesión;
- fecha y hora automáticas;
- orden cronológico claro, preferentemente el más reciente primero con opción accesible de lectura.

Añade a un lado un formulario sencillo `Añadir comentario`.

Reglas:

- El usuario nunca elige ni escribe el autor ni la fecha.
- El comentario no puede estar vacío tras recortar espacios.
- Define una longitud máxima razonable y documéntala.
- Los comentarios son internos y append-only: no se editan ni borran desde la interfaz en esta fase.
- El comentario se guarda en una entidad propia; no concatena texto dentro de `Offer.notes`.
- El alta del comentario crea auditoría y puede disparar reglas de notificación.
- Respeta los permisos de lectura de la oferta.

En escritorio, utiliza una composición de dos columnas equilibrada para `Observaciones` e `Historial de comentarios`; en anchos menores debe apilarse sin perder legibilidad.

---

# BLOQUE 6 — Adjuntos de oferta en almacenamiento local

## 6.1 Alcance

Implementa adjuntos únicamente asociados a una oferta. No añadas categorías, versiones de documento, envío al cliente, firma, OCR ni almacenamiento en la nube.

## 6.2 Tipos y tamaño

Tamaño máximo:

- `25 MB` por archivo.

Extensiones permitidas:

- PDF: `.pdf`.
- Word: `.doc`, `.docx`.
- Excel: `.xls`, `.xlsx`, `.xlsm`.
- PowerPoint: `.ppt`, `.pptx`.
- Imágenes: `.png`, `.jpg`, `.jpeg`.
- Mensajes de Outlook: `.msg`.

No permitas ejecutables, scripts, comprimidos u otras extensiones.

Valida en servidor tamaño, extensión y tipo MIME cuando sea fiable. No confíes únicamente en el nombre enviado por el navegador. Para formatos cuyo MIME varía, aplica una política explícita, conservadora y probada sin bloquear de forma arbitraria el `.msg` aprobado.

## 6.3 Almacenamiento y metadatos

- La ruta raíz se configura por variable de entorno.
- El directorio real queda fuera de `public/` y fuera de Git.
- Añade al `.gitignore` únicamente el directorio local por defecto que corresponda.
- Guarda en base de datos metadatos como oferta, nombre original, nombre interno o clave de almacenamiento, MIME, tamaño, autor y fechas.
- Usa un identificador aleatorio para el nombre físico; no uses directamente el nombre original.
- Conserva solo una clave relativa segura en la base de datos, nunca una ruta absoluta.
- Impide path traversal, nombres reservados y colisiones.
- Si falla la base de datos después de escribir el fichero, limpia el fichero temporal; si falla el fichero, no dejes metadatos válidos apuntando a algo inexistente.
- Las descargas deben pasar por una ruta autenticada y autorizada que haga streaming con cabeceras seguras.
- No expongas la ruta local al cliente.

Permite subir, listar y descargar. Permite retirar lógicamente un adjunto al administrador o a su autor; deja trazabilidad y evita que vuelva a descargarse. No es necesario purgar físicamente el binario desde la interfaz en esta entrega.

La interfaz debe mostrar nombre, tamaño, tipo, autor, fecha y estado, con mensajes claros de progreso/error compatibles con las posibilidades reales del stack.

---

# BLOQUE 7 — Archivo lógico y recuperación

`Anulado` y `Archivada` no son lo mismo:

- `Anulado` es un estado de negocio y la oferta sigue apareciendo en el listado ordinario y en sus históricos.
- `Archivada` significa eliminación lógica mediante `deletedAt` o mecanismo equivalente; se oculta del listado ordinario, pero nunca se borra físicamente.

Implementa:

- acción `Archivar` con confirmación explícita;
- registro de fecha y usuario que archiva;
- vista o filtro claro `Ofertas archivadas`;
- búsqueda, filtros, consulta y exportación dentro de archivadas;
- acción `Recuperar` con confirmación;
- registro de fecha y usuario que recupera;
- auditoría de ambas acciones.

Reglas:

- No existe borrado físico de ofertas.
- Archivar no cambia automáticamente el estado de negocio.
- Recuperar restaura la oferta al listado normal con el mismo número y datos.
- Una oferta archivada se consulta en modo seguro; para modificar datos funcionales primero debe recuperarse.
- Los comentarios, versiones, histórico, auditoría y adjuntos permanecen asociados.
- Las notificaciones que ya existían se conservan.

---

# BLOQUE 8 — Revisión pendiente, flujo de estados y pedido Navision

## 8.1 Nueva entrada de navegación

Añade `Pendiente de revisión` inmediatamente debajo de `Nueva oferta` en el menú del Gestor de Ofertas.

La bandeja se deriva del estado actual y de las asignaciones; no inventes un circuito paralelo de solicitudes de aprobación.

## 8.2 Asignación de revisiones

- Una oferta en estado técnico `TO_BE_ASSESSED_PM` (`A valorar PM`) aparece pendiente para su Project Manager asignado.
- Una oferta en estado técnico `DELIVERED_TO_SALES` (`Entregado a comercial`) aparece pendiente para su comercial asignado.
- Una persona habilitada como PM y comercial ve la unión, sin duplicados.
- Un administrador ve todas las pendientes y puede filtrar por tipo, PM, comercial, cliente y antigüedad.
- Un usuario normal solo ve las suyas.
- Las ofertas archivadas no aparecen en la bandeja activa.

Muestra, como mínimo: número, cliente, descripción resumida, estado, comercial, PM, fecha de entrada o última modificación relevante y tiempo pendiente.

## 8.3 Acción de revisar

Desde la bandeja o ficha debe existir una acción clara `Revisar`.

- Para completar la revisión es obligatorio seleccionar un estado diferente del estado que generó la pendiente.
- Después de una revisión correcta, la oferta no puede permanecer en `A valorar PM` ni en `Entregado a comercial`, según corresponda.
- Puede añadirse un comentario interno en la misma operación.
- El cambio de estado, el comentario opcional, el histórico de estado, la auditoría, la versión y las notificaciones deben quedar coherentes y transaccionales en todo lo que sea de base de datos.
- Si otra persona cambió antes la oferta y ya no está pendiente, no sobrescribas silenciosamente: informa del conflicto y refresca los datos.

No implementes en esta entrega un objeto separado con resultados `Aprobado`, `Rechazado` o `Solicitar cambios`. La revisión se resuelve mediante el nuevo estado elegido y queda acreditada por usuario, fecha, histórico, auditoría y versión.

## 8.4 Flujo general de estados

Decisión aprobada para esta fase:

- De forma general, una oferta puede pasar de cualquier estado activo a cualquier otro estado activo.
- No hay estados terminales ni bloqueos globales de edición.
- La única restricción adicional de revisión es la del apartado anterior: completar una revisión exige salir del estado que la generó.

No construyas un motor configurable de transiciones ni añadas estados nuevos.

## 8.5 Pedido de Navision

Decisión aprobada:

- `navisionOrder` es obligatorio cuando el estado técnico seleccionado es `ACCEPTED` (`Aceptado`).
- La validación se aplica en servidor tanto al alta como a la edición y a la revisión.
- Si se abandona posteriormente `Aceptado`, no borres automáticamente el pedido ya informado.
- No inventes formato, longitud corporativa ni validación contra Navision; exige únicamente un texto no vacío, recortado y con longitud máxima razonable.

Mantén la regla ya existente del motivo de cancelación para `CANCELLED`.

---

# BLOQUE 9 — Centro de notificaciones y reglas configurables

## 9.1 Centro global de notificaciones

Añade al layout común, por encima de cualquier módulo, un acceso persistente a `Notificaciones` con contador de no leídas.

Debe permitir:

- ver historial de notificaciones propias;
- distinguir leídas y no leídas sin depender solo del color;
- marcar una como leída al abrirla;
- marcar todas como leídas;
- navegar de forma segura a la oferta cuando el usuario conserva permiso;
- mostrar título, mensaje breve, fecha y hora, origen y estado.

No elimines automáticamente notificaciones antiguas en esta entrega.

## 9.2 Eventos soportados

El motor limitado de esta fase puede evaluar únicamente estos disparadores:

- oferta creada;
- estado de oferta cambiado;
- comentario añadido;
- adjunto añadido;
- oferta pendiente de revisión para PM;
- oferta pendiente de revisión para comercial.

No construyas un lenguaje de programación, expresiones arbitrarias ni un motor genérico para futuros módulos.

## 9.3 Reglas iniciales obligatorias

Crea idempotentemente reglas iniciales activas para cubrir estos comportamientos:

1. Al crear una oferta, notificar internamente al comercial y al PM asignados, excepto al propio actor.
2. Cuando una oferta queda en `A valorar PM`, notificar internamente al PM asignado.
3. Cuando una oferta queda en `Entregado a comercial`, notificar internamente al comercial asignado.

Si comercial, PM y actor son la misma persona, evita duplicados y no notifiques al actor por su propia acción. Si dos reglas generan exactamente la misma notificación dentro del mismo evento, aplica una clave de idempotencia o mecanismo equivalente para no duplicarla accidentalmente.

## 9.4 Administración de reglas al estilo de disparadores

Crea una pantalla solo para administradores, por ejemplo `/admin/notification-rules`, inspirada funcionalmente en la claridad de los disparadores de Zendesk, sin copiar su diseño ni crear más potencia de la necesaria.

Cada regla tendrá:

- nombre obligatorio;
- descripción opcional;
- activa/inactiva;
- un disparador de la lista cerrada;
- bloque `Cumplir TODAS las condiciones`;
- bloque `Cumplir CUALQUIERA de las condiciones`;
- una o más acciones de destinatario;
- canal.

Condiciones permitidas en esta fase:

- estado;
- Project Manager;
- comercial;
- creador;
- cliente;
- archivada/no archivada.

Usa operadores cerrados y sencillos, como `es` y `no es`, con valores validados. Semántica:

- todas las condiciones del bloque `TODAS` deben cumplirse;
- si el bloque `CUALQUIERA` tiene condiciones, al menos una debe cumplirse;
- un bloque vacío no invalida por sí solo la regla.

Destinatarios permitidos:

- Project Manager asignado;
- comercial asignado;
- creador de la oferta;
- todos los administradores activos;
- una persona concreta que tenga usuario activo.

No permitas scripts, SQL, plantillas libres de correo ni destinatarios introducidos como dirección externa.

## 9.5 Canal interno o interno + email

Cada regla permitirá seleccionar exactamente:

- `Solo interna`.
- `Interna + email`.

En esta entrega el email **no se configura ni se envía**.

Cuando una regla sea `Interna + email`:

- crea la notificación interna con normalidad;
- conserva en la regla la intención de canal seleccionada;
- muestra en Administración un aviso honesto: `El envío por email está pendiente de configuración; en esta versión solo se genera la notificación interna.`;
- no conectes SMTP, Microsoft 365, Gmail ni otro proveedor;
- no intentes entregar el correo;
- no registres el correo como enviado ni como fallido;
- no crees una dirección de email ficticia para las personas.

No copies ni reutilices ninguna configuración de correo que pudiera existir en el Excel legado.

## 9.6 Consistencia

- Genera notificaciones después de una mutación válida y dentro de una estrategia que no deje notificaciones de cambios revertidos.
- Valida reglas y destinatarios en servidor.
- Una regla inactiva no se ejecuta.
- Una referencia a usuario inactivo no genera una notificación accesible.
- Audita alta, edición, activación y desactivación de reglas, sin guardar información sensible.

---

# BLOQUE 10 — Exportación a Excel

## 10.1 Comportamiento

Añade `Exportar a Excel` al listado de ofertas.

- Exporta todas las filas que cumplen los filtros y permisos actuales, no solo la página visible.
- Respeta búsqueda, filtros y ámbito normal/archivado.
- Conserva un orden determinista coherente con la ordenación elegida.
- Genera un fichero `.xlsx`, nunca `.xlsm` y nunca con macros.
- Usa nombres de hoja válidos, anchos razonables, cabeceras inmovilizadas, autofiltro, formatos de fecha, moneda y decimal, y una fila de cabecera visualmente sobria.
- No incluyas credenciales, rutas locales, IDs de sesión ni hojas técnicas.
- Para conjuntos vacíos, genera las hojas y cabeceras con una indicación clara de que no hay resultados o devuelve un mensaje funcional; elige una opción y documéntala.
- El nombre del fichero debe ser estable y reconocible, por ejemplo `ofertas-AAAA-MM-DD.xlsx`.

## 10.2 Tres hojas obligatorias

### Hoja `Ofertas`

Una fila por oferta. Mantén, para los campos homologables, el orden de lectura del Excel legado y después añade los campos actuales. Orden exacto:

1. `Año`
2. `Mes`
3. `Fecha`
4. `Cod. Cliente`
5. `Cliente`
6. `Tipo Oferta`
7. `Cod. Oferta`
8. `Fecha entrega comercial`
9. `Fecha entrega cliente`
10. `Descripción`
11. `Pedido Navision`
12. `Project Manager`
13. `Comercial`
14. `Total jornadas`
15. `Jornadas Comercial`
16. `Importe`
17. `Estado`
18. `Origen`
19. `J.PM`
20. `J.AN`
21. `J.DIL`
22. `J.DE`
23. `J.IN`
24. `J.DI`
25. `J.PR-BE`
26. `J.PR-FE`
27. `J.PR-REM`
28. `J.KN`
29. `J.IT`
30. `J.UX`
31. `J.TL`
32. `J.PLATF`
33. `Solicitante`
34. `Motivo Cancelado`
35. `Fecha Estimada Cartera`
36. `Idioma`
37. `Implantación`
38. `Prioridad`
39. `Segmentación`
40. `Observaciones`
41. `Archivada`
42. `Creada el`
43. `Actualizada el`

`Total jornadas` se calcula a partir de las jornadas por perfil; no dupliques una fuente de verdad en base de datos. `Año` y `Mes` derivan de la fecha de oferta. No añadas `Prospect`, código de PM ni código de comercial porque el modelo actual no contiene esos datos aprobados.

### Hoja `Jornadas`

Una fila por combinación oferta–perfil con estas columnas:

1. `Cod. Oferta`
2. `Cod. Cliente`
3. `Cliente`
4. `Código perfil`
5. `Perfil profesional`
6. `Jornadas`

Incluye únicamente las jornadas existentes; no generes filas de cero para perfiles ausentes.

### Hoja `Historial`

Una fila por evento histórico exportable de las ofertas incluidas, con:

1. `Cod. Oferta`
2. `Tipo de evento`
3. `Versión`
4. `Fecha y hora`
5. `Autor`
6. `Acción`
7. `Campos modificados`
8. `Estado anterior`
9. `Estado nuevo`
10. `Comentario o detalle`

Integra de forma comprensible versiones, cambios de estado, comentarios y eventos auditables de adjuntos, archivo y recuperación. No vuelques JSON técnico sin procesar ni secretos. Evita duplicar visualmente un mismo evento si sus datos proceden de varias tablas relacionadas.

## 10.3 Rendimiento y permisos

- La exportación debe ejecutar una consulta acotada y eficiente, evitando N+1.
- No cargues el libro completo en memoria del navegador.
- Autoriza de nuevo en servidor y aplica el mismo ámbito que al listado.
- Si estableces un límite de seguridad por volumen, debe ser razonable, visible, documentado y no puede truncar datos silenciosamente.

---

# BLOQUE 11 — Administración protegida del contador

Implementa la decisión ya aprobada de administrar `offer_number` desde un área protegida, no como CRUD ordinario.

Solo `ADMIN` puede:

- ver si el contador existe y su valor actual;
- inicializarlo explícitamente si falta;
- aumentar su valor mediante confirmación reforzada;
- ver el último número ya utilizado como referencia.

Reglas:

- Nunca puede reducirse.
- Nunca puede quedar por debajo del máximo ya utilizado.
- Nunca se reinicia por año o mes.
- El ajuste debe ser atómico y seguro ante concurrencia.
- Muestra con claridad que el valor es el último contador consumido, no el próximo número completo.
- Exige una confirmación explícita que muestre valor anterior y nuevo.
- Audita actor, fecha, valor anterior y valor nuevo.
- No implementes todavía la carga automática desde el Excel o SQL Server legado.

---

# BLOQUE 12 — Modelo de datos y migraciones

Diseña los cambios conforme al modelo real del repositorio. Como mínimo, el resultado debe cubrir conceptualmente:

- código nullable y único de `Client` durante la transición;
- usuarios, roles y sesiones;
- creador autenticado de nuevas ofertas, preservando compatibilidad con ofertas anteriores;
- actor relacionado en auditorías e históricos donde proceda;
- versiones de oferta;
- comentarios;
- metadatos de adjuntos y retirada lógica;
- usuario de archivo/recuperación;
- notificaciones;
- reglas, condiciones y acciones de notificación, con un diseño limitado pero mantenible.

No es obligatorio usar exactamente estos nombres de tablas, pero sí conservar las reglas funcionales.

Requisitos:

- Índices para consultas por usuario, oferta, no leídas, estado de archivo y fechas.
- Restricciones únicas para usuario, relación usuario–persona, versión dentro de oferta, código de cliente y claves de idempotencia necesarias.
- Relaciones `onDelete` conservadoras; no debe existir cascada capaz de borrar histórico funcional.
- Fechas en UTC en base de datos y presentación consistente en la zona horaria documentada por la aplicación.
- Las migraciones deben tener nombres descriptivos y SQL revisado.
- Las instantáneas JSON deben validarse al crear y al leer; no uses `any` sin control.

Si alguna operación de fichero no puede formar parte de una transacción PostgreSQL, diseña compensación y estados explícitos para evitar metadatos engañosos.

---

# BLOQUE 13 — Pruebas automatizadas mínimas

Mantén las pruebas pequeñas, deterministas y directamente relacionadas con el riesgo de la entrega. No construyas una suite E2E extensa.

Incluye como mínimo cobertura focalizada de:

1. Hash y verificación de contraseña, sesión inválida/expirada y autorización ADMIN/USER.
2. Regresión de conservación de todos los valores relevantes del formulario después de un error.
3. Código de cliente obligatorio en altas/ediciones nuevas y unicidad.
4. `ACCEPTED` exige pedido de Navision y otros estados no lo exigen.
5. Cálculo de la bandeja de revisión y obligación de cambiar de estado al completar la revisión.
6. Creación consecutiva de versiones y ausencia de versión en un guardado sin cambios.
7. Archivo/recuperación sin borrado físico.
8. Validación de tamaño/extensión y prevención de rutas inseguras en adjuntos.
9. Evaluación `TODAS`/`CUALQUIERA`, destinatarios, idempotencia y canal `Interna + email` sin intento de envío.
10. Exportación: nombres de las tres hojas, cabeceras principales, filtros aplicados y ausencia de datos no autorizados.
11. Seed repetido sin duplicar personas, reglas iniciales ni reiniciar el contador.

Reutiliza helpers puros para que la mayoría de estas pruebas no necesiten una base de datos real. Conserva las pruebas de DEV-003.

---

# BLOQUE 14 — Validación técnica obligatoria

Antes de entregar, ejecuta y corrige cualquier fallo de:

```bash
npm ci
npm run db:generate
npm run lint
npm run typecheck
npm test
npm run build
git diff --check
```

Además:

1. Aplica todas las migraciones sobre una base PostgreSQL nueva.
2. Ejecuta el seed dos veces y demuestra que es idempotente.
3. Ejecuta el bootstrap de administrador dos veces y demuestra que no duplica ni restablece la contraseña.
4. Prueba la migración sobre una base que represente el esquema DEV-003 con datos existentes, sin resetearla.
5. Comprueba manualmente login, permisos, alta/editado de oferta, revisión, auditoría, versiones, comentarios, adjuntos, archivo/recuperación, notificaciones y exportación.
6. Comprueba degradación segura si PostgreSQL no está disponible.
7. Comprueba mensajes seguros si falta el directorio de adjuntos o no tiene permisos.
8. Comprueba que ninguna salida contiene secretos ni rutas internas.

No afirmes que algo pasó si no se ejecutó. Si una validación no puede realizarse en el entorno, explica exactamente cuál y por qué.

---

# BLOQUE 15 — Guía manual de aceptación para el Product Owner

Actualiza el README con una guía desde cero, pensada para Windows/PowerShell cuando corresponda, que incluya:

1. Crear o actualizar la base PostgreSQL independiente de `v-apps`.
2. Copiar `.env.example` a `.env` y completar marcadores seguros.
3. Instalar dependencias.
4. Generar Prisma.
5. Aplicar migraciones.
6. Ejecutar el seed.
7. Ejecutar el bootstrap del administrador.
8. Arrancar la aplicación.
9. Iniciar sesión y cambiar la contraseña temporal.

Después, documenta una prueba manual numerada que permita verificar:

1. Acceso anónimo bloqueado.
2. Creación de un usuario normal vinculado a una persona.
3. Diferencia real entre permisos de administrador y usuario.
4. Cliente con código obligatorio y cliente legado con `Código pendiente`.
5. Personas precargadas sin duplicación tras repetir el seed.
6. Creación de oferta y conservación de campos después de provocar un error controlado.
7. Pedido Navision obligatorio al elegir `Aceptado`.
8. Aparición en la bandeja de PM con `A valorar PM`.
9. Imposibilidad de completar esa revisión sin cambiar de estado.
10. Aparición en la bandeja comercial con `Entregado a comercial`.
11. Autor, fecha y hora en comentarios.
12. Carga y descarga de un PDF permitido y rechazo de un archivo prohibido o superior a 25 MB.
13. Creación y comparación de versiones.
14. Consulta de auditoría con actores.
15. Archivo, vista de archivadas y recuperación.
16. Notificación interna de nueva oferta y de revisión pendiente.
17. Creación de una regla `Interna + email`, verificando que aparece el aviso y que no se intenta enviar correo.
18. Exportación con filtros y validación de las hojas `Ofertas`, `Jornadas` e `Historial`.
19. Administración segura del contador, incluyendo rechazo de una reducción.
20. Cierre de sesión e invalidez de la sesión anterior.

Usa datos sintéticos para la prueba, salvo los nombres maestros expresamente autorizados en este prompt.

---

# BLOQUE 16 — Documentación y decisiones

Actualiza, como mínimo, cuando corresponda:

- `README.md`.
- `CHANGELOG.md`.
- `docs/PROJECT_STATUS.md`.
- `docs/INDEX.md` si se añaden documentos.
- `docs/architecture/ARCHITECTURE.md`.
- `docs/architecture/DATA_MODEL.md`.
- `docs/architecture/SECURITY.md`.
- `docs/shared/MASTER_DATA.md`.
- Los documentos funcionales de `docs/offers/`.
- `docs/decisions/DECISIONS.md`.

Registra con IDs nuevos o actualiza decisiones existentes sin duplicarlas. Este encargo resuelve expresamente:

- `DEC-012`: administración protegida del contador.
- `DEC-016`: archivo lógico visible y recuperación.
- `DEC-032`: exportación a Excel, ahora implementada.
- `DEC-051`: cualquier estado activo puede pasar a cualquier otro; la finalización de una revisión exige salir del estado que la generó.
- `DEC-052`: `ACCEPTED` obliga a informar pedido Navision.
- `DEC-053`: notificaciones internas configurables; el canal `Interna + email` se puede seleccionar, pero la entrega por email queda pendiente y no hace nada todavía.
- `DEC-055`: roles iniciales `ADMIN` y `USER` con los permisos definidos aquí.
- `DEC-019`: deja de ser cierto que no existe autenticación; sustitúyelo por la autenticación local provisional implementada.

`DEC-056` no debe presentarse como autenticación corporativa definitiva: el SSO o proveedor final continúa pendiente. Explica con precisión la diferencia entre el mecanismo local provisional y la decisión futura.

Mantén pendientes, sin resolver ni inventar:

- mes del piloto de migración;
- infraestructura y despliegue;
- política de edición del histórico importado;
- modelo definitivo de implantaciones;
- ESM, tarifas, costes y márgenes;
- proveedor corporativo definitivo de autenticación;
- configuración y proveedor real de email.

El repositorio debe quedar autosuficiente para que una sesión futura comprenda modelo, seguridad, decisiones, comandos, limitaciones y siguiente objetivo sin leer esta conversación.

---

# Fuera de alcance explícito

No implementes:

- SSO, Azure AD, OAuth, LDAP ni recuperación por email.
- Envío real de correo, SMTP, Microsoft Graph, Gmail, Outlook ni colas de email.
- Notificaciones push, Teams o Slack.
- Despliegue, Docker, CI/CD nuevo o infraestructura cloud.
- Importación del Excel o migración desde SQL Server.
- ESM, FACT, Budget Comercial, Revenue Control, License Manager u otros módulos.
- Maestro relacional de implantaciones.
- Tarifas, costes, márgenes, facturación o contratos.
- Motor genérico de workflow o estados terminales.
- Firma, OCR, antivirus externo, almacenamiento cloud o versionado de adjuntos.
- Aprobaciones formales separadas con resultados `Aprobado/Rechazado/Solicitar cambios`.
- Restauración de una versión antigua.
- Grupo de cliente.
- Códigos inventados para comercial o PM.
- Emails u otros datos personales para las personas precargadas.
- Borrado físico de ofertas, comentarios, auditoría, versiones o adjuntos desde la interfaz.

Si descubres que una mejora razonable cae en esta lista, documéntala como posterior; no la implementes.

---

# Organización recomendada del trabajo

Para reducir riesgo, realiza commits pequeños y coherentes, por ejemplo:

1. Migraciones, código de cliente, seed de personas y corrección del formulario.
2. Autenticación, sesiones, usuarios y autorización.
3. Auditoría atribuible, versiones, comentarios y archivo lógico.
4. Bandeja de revisiones y reglas de estado/Navision.
5. Adjuntos locales seguros.
6. Notificaciones y reglas configurables.
7. Exportación Excel y contador protegido.
8. Pruebas, documentación y pulido de accesibilidad.

Puedes variar el orden si existe una razón técnica, pero no sacrifiques una migración revisable ni agrupes toda la entrega en un único commit opaco.

---

# Criterios de aceptación finales

La entrega solo está completa si:

- El error de pérdida del estado del formulario está corregido y probado.
- El código de cliente funciona sin inventar valores para registros anteriores.
- El seed autorizado de personas es idempotente.
- Existe login local seguro, bootstrap sin secretos y autorización real en servidor.
- Un usuario solo accede a las ofertas permitidas.
- Auditoría y versiones muestran actor, fecha, cambios y jornadas correctamente.
- Los comentarios capturan automáticamente autor, día y hora.
- Los adjuntos permitidos funcionan con límite de 25 MB y almacenamiento no público.
- Archivar y recuperar nunca borra el histórico.
- Las dos bandejas lógicas de revisión funcionan según estado y asignación.
- Completar una revisión obliga a cambiar de estado.
- Cualquier otra transición entre estados activos sigue permitida.
- `Aceptado` exige pedido Navision.
- El centro global de notificaciones y el contador de no leídas funcionan.
- Administración puede crear reglas con `TODAS`, `CUALQUIERA`, destinatarios y canal.
- `Interna + email` solo genera la notificación interna y no intenta ni simula un envío.
- La exportación contiene las tres hojas, aplica filtros/permisos y conserva el orden acordado.
- El contador se administra únicamente como `ADMIN` y nunca puede reducirse.
- Migraciones, seed y bootstrap funcionan de forma idempotente.
- Lint, typecheck, pruebas, build y `git diff --check` pasan.
- La documentación refleja el estado real y no promete email, SSO o producción.
- No se han introducido secretos ni datos no autorizados.

---

# Entrega y Pull Request

Al finalizar:

1. Revisa el diff completo y el historial de commits.
2. Sube únicamente la rama de la entrega.
3. Crea una Pull Request contra `main`.
4. Deja la Pull Request abierta y sin fusionar.
5. No hagas merge bajo ninguna circunstancia.

La descripción de la Pull Request debe incluir:

- objetivo;
- resumen por bloques;
- migraciones y compatibilidad con datos DEV-003;
- modelo de seguridad y permisos;
- decisiones cerradas y decisiones que continúan pendientes;
- comandos ejecutados y resultados reales;
- guía breve de configuración local nueva;
- pasos de prueba manual;
- limitaciones conocidas, especialmente que el email, SSO, despliegue y migración histórica siguen fuera de alcance.

En tu respuesta final al Product Owner indica:

- rama utilizada;
- commits principales;
- enlace de la Pull Request;
- resumen de lo implementado;
- migraciones creadas;
- validaciones ejecutadas y resultados;
- cualquier desviación o bloqueo real;
- confirmación explícita de que la Pull Request queda abierta y no fusionada.
