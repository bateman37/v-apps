# V-APPS — DEV-005: hotfix de usabilidad del Gestor de Ofertas y notificaciones

## Rol

Actúa como desarrollador full-stack senior responsable de corregir y simplificar la experiencia entregada en DEV-004, sin ampliar el producto con módulos nuevos ni rehacer la arquitectura.

Repositorio:

`https://github.com/bateman37/v-apps`

La Pull Request de DEV-004 ya está fusionada en `main`. Esta entrega nace de las primeras pruebas funcionales reales del Product Owner y combina:

- un error bloqueante al adjuntar archivos;
- simplificaciones funcionales expresamente decididas;
- mejoras acotadas de filtros, navegación y formularios;
- una reorganización de la Administración para que personas y accesos se gestionen desde un único lugar.

Debe tratarse como un hotfix funcional sobre DEV-004, no como una nueva épica.

---

## Lectura obligatoria antes de modificar archivos

Lee completos, como mínimo:

- `AGENTS.md`.
- `CLAUDE.md`.
- `README.md`.
- `CHANGELOG.md`.
- `docs/PROJECT_STATUS.md`.
- `docs/INDEX.md`.
- `docs/decisions/DECISIONS.md`.
- `docs/architecture/DATA_MODEL.md`.
- `docs/architecture/SECURITY.md`.
- `docs/shared/MASTER_DATA.md`.
- Todos los documentos de `docs/offers/`.
- `prompts/0004-cierre-gestor-ofertas-autenticacion-notificaciones.md`.
- `prisma/schema.prisma` y las migraciones existentes.
- El código actual relacionado con ofertas, filtros, adjuntos, personas, usuarios, navegación, notificaciones y reglas de notificación.

Comprueba que partes de `main` actualizado y que DEV-004 está presente. Si el entorno ya proporciona una rama, úsala. En caso contrario, crea una rama desde `main`, por ejemplo:

`fix/dev-005-offers-usability-hotfix`

No trabajes sobre `main`, no hagas push directo a `main` y no fusiones la Pull Request.

---

## Conservación obligatoria del prompt

Guarda una copia fiel de este encargo en:

`prompts/0005-hotfix-usabilidad-ofertas-notificaciones.md`

Inclúyela en la misma rama y Pull Request que el código. No edites retroactivamente los prompts anteriores.

---

## Objetivo verificable

Al terminar:

1. Los clientes se elegirán únicamente por nombre fuera del maestro de clientes.
2. `Idioma` desaparecerá de la experiencia actual de ofertas y Administración.
3. Desaparecerá el texto de ayuda innecesario bajo `Observaciones`, sin eliminar el historial de comentarios.
4. Se podrán adjuntar y descargar archivos sin el error de React ni `Failed to fetch`.
5. Desaparecerá el concepto funcional de oferta archivada; todas las ofertas seguirán localizables por sus estados, incluido `Anulado`.
6. El listado filtrará por fecha `Desde`/`Hasta` y permitirá seleccionar varios estados.
7. Personas y cuentas de acceso se administrarán desde una sola pantalla, manteniendo modelos separados y seguros internamente.
8. Los constructores de reglas mostrarán solo una fila vacía y añadirán la siguiente progresivamente.
9. Los usuarios no administradores aterrizarán en su panel de notificaciones.
10. `Panel de notificaciones` aparecerá en el menú antes del Gestor de Ofertas.

---

# 1. Cliente: mostrar solo el nombre fuera de su maestro

El código de cliente sigue siendo obligatorio, único y útil como dato maestro. No debe eliminarse de `Client`, de `/admin/clients` ni de la exportación cuando corresponda.

Sin embargo, para el PM o el comercial que selecciona o consulta una oferta, el código no aporta valor visual.

## Cambios requeridos

- En `Nueva oferta` y `Modificar oferta`, cada opción del selector de cliente debe mostrar únicamente el nombre.
- Elimina prefijos como `124 · EXTERNALIA` y muestra `EXTERNALIA`.
- En filtros, condiciones de notificación, bandeja de revisión, ficha de oferta y demás pantallas operativas, muestra únicamente el nombre del cliente.
- Se puede conservar un sufijo funcional como `(inactivo)` cuando sea imprescindible para distinguir el estado de un maestro histórico, pero nunca antepongas el código.
- En Administración > Clientes sí deben seguir mostrándose y editándose `Código` y `Nombre`.
- La búsqueda general puede seguir encontrando una oferta por código de cliente si ya lo hace o si resulta natural mantenerlo, pero no es obligatorio mostrar ese código en la etiqueta.
- La exportación puede conservar `Cod. Cliente` porque es un dato de explotación, no un selector operativo.
- No cambies relaciones ni IDs: es una modificación de presentación, no de integridad referencial.

Para clientes heredados sin código, conserva el tratamiento seguro de DEV-004. No inventes valores.

---

# 2. Retirar `Idioma` de la aplicación actual

`Idioma` procedía del Excel histórico y del modelo inicial, pero el Product Owner confirma que no entiende su uso actual y que no es necesario en el Gestor de Ofertas.

## Cambios requeridos

- Elimina `Idioma` de:
  - alta de oferta;
  - edición de oferta;
  - ficha de oferta;
  - Administración > Maestros de oferta;
  - filtros, comparadores o textos actuales donde aparezca;
  - nuevas instantáneas funcionales de versiones;
  - exportación Excel de ofertas;
  - documentación funcional y guía de pruebas.
- No añadas un sustituto.
- No inventes un uso futuro.

## Compatibilidad de datos

Este hotfix no debe ejecutar una migración destructiva para borrar inmediatamente la tabla `languages` ni la columna nullable `language_id`:

- déjalas temporalmente como compatibilidad técnica/deprecada si eliminarlas compromete migraciones existentes o datos locales;
- ninguna escritura nueva debe informar `languageId`;
- el código funcional no debe consultar el catálogo para construir formularios nuevos;
- documenta que queda deprecado y pendiente de limpieza física futura, una vez confirmada la ausencia de datos relevantes;
- las versiones o auditorías históricas ya existentes no deben corromperse aunque contengan ese campo.

No borres datos históricos de forma silenciosa.

---

# 3. Observaciones: retirar únicamente el comentario de ayuda

En el formulario aparece bajo `Observaciones` este texto:

`Dato funcional de la oferta, versionado con ella. Para anotaciones con autor y fecha, usa el historial de comentarios de la ficha.`

Elimínalo. No aporta valor al usuario y recarga la pantalla.

Importante:

- conserva el campo `Observaciones`;
- conserva su versionado;
- conserva el historial de comentarios con autor, día y hora en la ficha;
- conserva el formulario para añadir comentarios;
- no confundas esta petición con eliminar la funcionalidad de comentarios.

---

# 4. Hotfix bloqueante de adjuntos

## Error reproducido

Al intentar adjuntar un archivo, React/Next.js muestra:

`Cannot specify a encType or method for a form that specifies a function as the action. React provides those automatically. They will get overridden.`

La traza señala `src/modules/offers/attachment-controls.tsx`, donde el formulario combina una función en `action={formAction}` con `encType="multipart/form-data"`. Después aparece también `Runtime TypeError: Failed to fetch`.

## Corrección requerida

- En un formulario cuya `action` es una Server Action, no declares manualmente `encType` ni `method`; React los proporciona.
- Elimina la combinación incompatible sin sustituirla por un envío manual innecesario.
- Mantén `FormData`, el campo `File`, `useActionState` y la protección de autorización en servidor.
- Revisa el límite real de cuerpo de Server Actions en la versión exacta de Next.js utilizada por el repositorio.
- Configura el límite admitido por Next.js con margen suficiente para que un archivo válido de 25 MB más el overhead multipart pueda llegar a la validación de la aplicación.
- La regla funcional continúa siendo un máximo estricto de `25 MB` por archivo; el margen del transporte no amplía el límite funcional.
- Conserva la lista de extensiones aprobadas, la validación de MIME, la ruta local no pública, el nombre físico aleatorio y la compensación ante errores.
- Si el directorio no existe, créalo como ya estaba previsto.
- Si el directorio no es escribible, muestra un error seguro en español; no dejes la aplicación en una pantalla de error de desarrollo.
- Después de una subida correcta, actualiza la lista de adjuntos y muestra confirmación.
- Verifica que la descarga autenticada sigue funcionando.
- Verifica que un usuario sin permiso sobre la oferta no puede subir ni descargar.

## Validación manual obligatoria

Prueba al menos:

1. PDF pequeño válido.
2. Imagen válida.
3. Archivo de una extensión no permitida.
4. Archivo superior a 25 MB.
5. Descarga del archivo válido.
6. Recarga de la ficha y persistencia del adjunto.

No des por cerrado el fallo solo porque compile: reproduce el flujo real en navegador.

---

# 5. Eliminar el concepto funcional de ofertas archivadas

El Product Owner decide retirar la funcionalidad de archivo lógico de ofertas.

La regla simplificada pasa a ser:

- si una oferta se cancela, su estado es `Anulado`;
- si no está anulada, conserva el estado de negocio que corresponda;
- todas las ofertas deben poder buscarse siempre;
- no existe una bandeja separada de archivadas;
- no añadas un booleano nuevo `activa/inactiva`: el estado de oferta es la fuente de verdad funcional.

## Cambios de interfaz y comportamiento

- Elimina `Ofertas archivadas` del menú.
- Elimina los botones `Archivar` y `Recuperar`.
- Elimina avisos visuales y modos de solo lectura vinculados a estar archivada.
- Elimina `scope=archivadas` y cualquier separación entre listados activos/archivados.
- El listado ordinario debe consultar todas las ofertas accesibles, independientemente del antiguo `deletedAt`.
- Todas las ofertas, incluido `Anulado`, deben ser buscables y filtrables.
- Elimina `Archivada` de las condiciones disponibles en reglas de notificación.
- Elimina la columna `Archivada` de las nuevas exportaciones.
- No generes nuevos eventos de archivo/recuperación.

## Datos existentes y compatibilidad

- Añade una migración segura que recupere automáticamente cualquier oferta archivada durante DEV-004, limpiando `deletedAt` y `archivedById` para que vuelva al listado ordinario.
- Conserva las auditorías históricas de archivo/recuperación que ya pudieran existir; son historia y no deben falsificarse ni borrarse.
- Puedes conservar temporalmente las columnas técnicas de archivo sin uso para evitar una migración destructiva, pero ninguna función nueva debe depender de ellas.
- Si existe alguna regla de notificación creada por el usuario que utilice la condición `ARCHIVED`, no la amplíes silenciosamente eliminando la condición. Desactívala de forma segura o márcala claramente como incompatible para que el administrador la revise. Documenta el criterio aplicado.
- Actualiza o sustituye expresamente la decisión `DEC-016`: ya no representa la decisión vigente del producto.

---

# 6. Filtros del listado: fechas desde/hasta y estados multiselección

## 6.1 Fecha

En `Todas las ofertas` elimina los filtros separados `Año` y `Mes`.

Sustitúyelos por:

- `Fecha desde`.
- `Fecha hasta`.

Reglas:

- Ambos son opcionales.
- Sin fechas informadas, se muestran ofertas de cualquier fecha.
- Solo `Desde`: fecha de oferta mayor o igual.
- Solo `Hasta`: fecha de oferta menor o igual.
- Ambos: rango inclusivo.
- Si `Desde` es posterior a `Hasta`, muestra un error comprensible y no ejecutes un filtro incoherente.
- Usa la fecha funcional de la oferta (`offerDate`), no `createdAt`.
- Interpreta y compara fechas de forma consistente, sin errores de zona horaria.
- Los valores deben persistir en la URL, paginación, ordenación y exportación.
- `Limpiar filtros` debe devolver ambos campos a vacío.
- Los antiguos parámetros `year` y `month` pueden ignorarse; no mantengas dos sistemas visibles.

La hoja Excel `Ofertas` puede conservar sus columnas derivadas `Año` y `Mes`; esta petición afecta a los filtros de búsqueda, no obliga a eliminarlas de la exportación.

## 6.2 Estados multiselección

Sustituye el selector único de `Estado` por una selección múltiple accesible.

Comportamiento:

- Por defecto no hay ningún estado marcado de forma restrictiva: se muestran todos.
- El usuario puede seleccionar dos o más estados y la oferta cumple si su estado pertenece al conjunto seleccionado.
- `Anulado` es una opción normal y combinable con las demás.
- Si no se selecciona ninguno, equivale a `Todos`.
- Muestra de forma clara cuántos estados están seleccionados.
- Permite desmarcarlos todos sin recargar la página.
- Evita un `<select multiple>` poco comprensible si obliga al usuario a usar Ctrl. Implementa un control compacto y accesible con casillas, por ejemplo un desplegable basado en `<details>` o un componente sencillo equivalente, sin añadir una librería pesada.
- Teclado, foco, etiquetas y lectores de pantalla deben funcionar.
- Conserva los estados en URL mediante parámetros repetibles o una representación inequívoca y documentada.
- Deduplica y valida IDs en servidor.
- Actualiza parser, tipos, consulta Prisma, serialización de URL, paginación, enlaces de ordenación y exportación.

## 6.3 Estado inicial del listado

Al entrar sin parámetros, el listado debe empezar con **todo** lo que el usuario tiene permiso para consultar:

- todas las fechas;
- todos los estados, incluido `Anulado`;
- todos los clientes, comerciales, PM, tipos y orígenes;
- sin búsqueda de texto.

Los permisos ADMIN/USER de DEV-004 se mantienen: `todo` significa todo dentro del ámbito autorizado de ese usuario.

---

# 7. Unificar Personas y Usuarios en una sola pantalla de Administración

## Decisión de diseño

No fusiones las tablas `Person` y `User`.

Son conceptos diferentes y deben seguir separados internamente:

- `Person` representa a una persona operativa que puede ser comercial y/o Project Manager.
- `User` representa sus credenciales, rol, estado de acceso y política de contraseña.

Fusionarlos en base de datos mezclaría datos de negocio con seguridad y obligaría a que toda persona tuviera acceso. No hagas esa modificación.

La mejora aprobada es **unificarlos en la experiencia de Administración**.

## Pantalla unificada

- Sustituye las entradas separadas `Personas` y `Usuarios` por una única entrada:

  `Personas y accesos`

- Usa una única ruta principal, preferentemente `/admin/people` para no romper el maestro existente.
- La ruta antigua `/admin/users` debe redirigir a la nueva pantalla o sección, conservando compatibilidad con marcadores.
- La pantalla debe presentar una sola lista de personas y, para cada persona, mostrar claramente:
  - nombre;
  - habilitación Comercial;
  - habilitación Project Manager;
  - estado de la persona;
  - número de ofertas, si ya se mostraba;
  - estado de acceso: `Sin acceso`, `Activo` o `Inactivo`;
  - nombre de usuario, si existe;
  - rol `Usuario` o `Administrador`, si existe;
  - cambio de contraseña pendiente.

## Acciones desde la ficha/fila de la persona

- Crear persona.
- Editar nombre y habilitaciones.
- Activar/desactivar persona.
- Si no tiene cuenta: `Crear acceso`, indicando usuario, rol y contraseña temporal.
- Si tiene cuenta: activar/desactivar acceso, cambiar rol y generar contraseña temporal.

No obligues al administrador a volver a seleccionar una persona en otro formulario: la acción de acceso debe partir de la propia fila o ficha.

Mantén independientes y claramente etiquetados `Estado de la persona` y `Estado del acceso`. No introduzcas efectos automáticos nuevos entre ambos sin una decisión funcional expresa. Conserva las reglas de seguridad ya implementadas, incluidas la revocación de sesiones al desactivar un usuario o regenerar su contraseña.

La pantalla y todas sus acciones continúan siendo solo para `ADMIN`, con autorización en servidor.

---

# 8. Reglas de notificación: filas progresivas

Actualmente el formulario muestra cuatro filas vacías en cada bloque, lo que recarga la pantalla y da apariencia de formulario inacabado.

Aplica el mismo comportamiento progresivo a:

- `Cumplir TODAS las condiciones`.
- `Cumplir CUALQUIERA de las condiciones`.
- `Destinatarios`.

## Comportamiento requerido

- Cada bloque empieza mostrando una sola fila vacía `— Sin usar —`.
- Cuando el usuario selecciona y completa esa fila, aparece una segunda fila vacía.
- Cuando completa la segunda, aparece la tercera.
- Cuando completa la tercera, aparece la cuarta.
- El máximo de esta entrega sigue siendo cuatro filas por bloque; no cambies el contrato de backend a un constructor ilimitado.
- Debe existir como máximo una fila completamente vacía visible al final de cada bloque.
- Si el usuario limpia una fila, compacta o retira las filas vacías posteriores sin perder condiciones válidas.
- Al volver del servidor con un error, conserva todos los valores y el número necesario de filas visibles.
- No envíes filas vacías como condiciones o acciones reales.
- Mantén la semántica existente de `TODAS`, `CUALQUIERA`, operadores, destinatarios y canales.
- Retira `Archivada` del catálogo de condiciones de acuerdo con el bloque 5.
- Mantén `Solo interna` e `Interna + email`; el email sigue sin enviarse ni simularse.

No añadas drag and drop, grupos anidados ni un motor de reglas más complejo.

---

# 9. Panel de notificaciones como entrada principal del usuario

## Navegación

Añade antes de la sección `Gestor de Ofertas` una sección o entrada principal claramente visible:

`Panel de notificaciones`

Debe enlazar a `/notificaciones`.

- Mantén el contador de no leídas de la cabecera.
- Puedes mostrar también el contador en el menú si se integra de forma simple y accesible, pero no es obligatorio.
- La entrada debe estar disponible para `ADMIN` y `USER`.
- No dupliques dos enlaces laterales con nombres distintos al mismo destino.

## Página inicial según rol

- Tras iniciar sesión como `USER`, la primera pantalla debe ser `/notificaciones`.
- Al visitar `/` con una sesión `USER`, redirige a `/notificaciones`.
- Después de completar el cambio obligatorio de contraseña como `USER`, redirige a `/notificaciones`.
- Un `ADMIN` puede conservar `/offers` como destino inicial para no alterar su flujo de administración.
- Revisa todos los puntos de redirección: login, raíz y cambio de contraseña. No dejes comportamientos contradictorios.

La pantalla de notificaciones existente se conserva; este bloque cambia su prioridad y acceso en la navegación, no su modelo de datos.

---

# 10. Exportación y coherencia transversal

La exportación debe usar exactamente los nuevos filtros:

- `Fecha desde`.
- `Fecha hasta`.
- conjunto multiselección de estados.
- resto de filtros existentes.
- permisos del usuario.

Además:

- elimina `Idioma` y `Archivada` de nuevas exportaciones;
- conserva `Cod. Cliente` en Excel;
- puede conservar `Año` y `Mes` como columnas derivadas del Excel, aunque ya no sean filtros de pantalla;
- conserva las tres hojas `Ofertas`, `Jornadas` e `Historial`;
- conserva eventos históricos de archivo/recuperación en `Historial` si ya existen, porque forman parte de la auditoría antigua;
- no exportes datos de ofertas fuera del ámbito autorizado.

Revisa también estadísticas, totales, ordenación y paginación para que todos utilicen el mismo `where` y no diverjan de la exportación.

---

# 11. Migración y compatibilidad

La entrega debe funcionar tanto en una base nueva como en una base local que ya tenga DEV-004 y datos de prueba.

Requisitos:

- No borres ofertas, usuarios, personas, comentarios, versiones, adjuntos, auditorías ni notificaciones.
- Recupera las ofertas antiguamente archivadas para que vuelvan al listado común.
- Mantén IDs y números de oferta.
- No reinicies el contador.
- No reinicies contraseñas ni sesiones salvo cuando una acción de seguridad existente lo exige.
- No borres físicamente `Language`/`languageId` ni columnas de archivo si hacerlo convierte el hotfix en una migración destructiva; déjalos deprecados y sin uso funcional.
- Trata de forma segura reglas antiguas con la condición `ARCHIVED` y documenta el resultado.
- El seed debe seguir siendo idempotente.

Revisa manualmente el SQL de cualquier migración antes de aplicarla.

---

# 12. Pruebas automatizadas: mínimas y dirigidas

El Product Owner realizará las pruebas funcionales manualmente. No amplíes innecesariamente la suite ni añadas E2E pesados.

Añade o adapta únicamente pruebas focalizadas para los cambios con lógica pura:

1. Parser/serializador de filtros con `dateFrom`, `dateTo` y varios IDs de estado.
2. Construcción de la condición Prisma: rango inclusivo y `statusId in [...]`.
3. Estado inicial sin filtros equivalente a todas las fechas y estados.
4. Si existe un helper puro para filas progresivas, prueba solo su comportamiento esencial; no introduzcas una infraestructura de testing de componentes solo para esto.

Para el adjunto, reutiliza las pruebas existentes de validación de tamaño/extensión. El fallo de `encType` debe comprobarse principalmente mediante build y prueba manual real en navegador.

Conserva todas las pruebas anteriores que sigan representando decisiones vigentes. Actualiza o elimina únicamente las que prueben archivo funcional o idioma visible, porque esas decisiones han sido sustituidas expresamente.

---

# 13. Prueba manual de aceptación

Actualiza el README con una guía corta de regresión para el Product Owner. Debe permitir verificar:

1. Iniciar sesión como administrador.
2. Abrir `Nueva oferta` y comprobar que el selector muestra `EXTERNALIA`, no `124 · EXTERNALIA`.
3. Confirmar que el código sigue existiendo en Administración > Clientes.
4. Confirmar que `Idioma` ya no aparece en alta, edición, ficha ni maestros.
5. Confirmar que ha desaparecido el texto de ayuda bajo `Observaciones`, pero siguen funcionando comentarios e historial.
6. Adjuntar un PDF pequeño y descargarlo.
7. Rechazar un archivo no permitido y uno superior a 25 MB con mensaje controlado.
8. Confirmar que ya no existen menú ni acciones de archivado.
9. Confirmar que una oferta `Anulado` sigue apareciendo y puede localizarse.
10. Si había una oferta archivada durante DEV-004, confirmar que vuelve al listado común.
11. Entrar en `Todas las ofertas` sin filtros y confirmar que se muestran todas las fechas y estados autorizados.
12. Filtrar solo por `Desde`, solo por `Hasta` y por un rango completo.
13. Probar el error `Desde posterior a Hasta`.
14. Seleccionar simultáneamente dos estados, uno de ellos `Anulado`.
15. Ordenar, paginar y exportar sin perder el rango ni los estados.
16. Entrar en `Personas y accesos`, crear una persona y crear su acceso desde la misma ficha/fila.
17. Comprobar que `/admin/users` redirige a la pantalla unificada.
18. Abrir una nueva regla y confirmar que cada bloque empieza con una sola fila.
19. Completar sucesivamente filas y comprobar que aparece una nueva hasta un máximo de cuatro.
20. Entrar como `USER` y confirmar que aterriza en `/notificaciones` y que `Panel de notificaciones` está antes del Gestor de Ofertas.
21. Entrar como `ADMIN` y confirmar que conserva sus permisos y acceso a Administración.

No uses datos reales adicionales en la guía.

---

# 14. Validaciones técnicas obligatorias

Ejecuta:

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

- aplica la migración sobre una base nueva;
- aplícala sobre una base DEV-004 con datos de prueba y, si es posible, una oferta archivada;
- ejecuta el seed dos veces;
- prueba manualmente el adjunto desde navegador;
- comprueba que la exportación abre correctamente y contiene las tres hojas;
- prueba las redirecciones con un ADMIN y un USER;
- comprueba que no se han introducido secretos ni rutas locales en logs o commits.

No afirmes que una validación ha pasado si no se ha ejecutado. Si algo no puede probarse en el entorno, indícalo con precisión en la Pull Request.

---

# 15. Documentación y decisiones

Actualiza como mínimo:

- `README.md`.
- `CHANGELOG.md`.
- `docs/PROJECT_STATUS.md`.
- `docs/decisions/DECISIONS.md`.
- `docs/architecture/DATA_MODEL.md` cuando sea necesario explicar campos deprecados.
- `docs/shared/MASTER_DATA.md`.
- `docs/offers/OVERVIEW.md`.
- `docs/offers/FIELDS.md`.
- `docs/offers/STATUSES.md` si contiene referencias a archivo o idioma.
- `CLAUDE.md` si su resumen de estado queda desactualizado.

Registra claramente que:

- `Idioma` queda retirado de la interfaz y de nuevos datos de oferta; la persistencia antigua queda deprecada por compatibilidad.
- `DEC-016` queda sustituida: no existe archivo funcional; `Anulado` es el mecanismo de negocio y todas las ofertas permanecen buscables.
- Personas y usuarios siguen siendo entidades separadas, pero se administran desde una pantalla unificada.
- La página inicial de un usuario normal es Notificaciones.
- Los filtros oficiales pasan a ser rango de fechas y estados multiselección.

No reescribas el historial para fingir que DEV-004 nunca tuvo archivo o idioma. Documenta la sustitución de la decisión y el motivo.

---

# Fuera de alcance

No implementes:

- SSO ni autenticación nueva.
- Envío real de email.
- Nuevos estados de oferta.
- Booleano nuevo de oferta activa/inactiva.
- Borrado físico de ofertas o históricos.
- Fusión de las tablas `Person` y `User`.
- Migración histórica desde Excel o SQL Server.
- ESM, FACT u otros módulos.
- Rediseño general de branding.
- Motor ilimitado de reglas.
- Nuevas categorías de adjuntos.
- Cambios en el límite funcional de 25 MB.
- Reescritura general del Gestor de Ofertas.
- Suites E2E extensas.

Si encuentras una mejora próxima pero no imprescindible para estos puntos, documéntala como pendiente y no la implementes.

---

# Criterios de aceptación finales

La entrega solo está completa si:

- Los selectores operativos muestran solo el nombre del cliente.
- El código de cliente sigue existiendo en su maestro y en la exportación.
- `Idioma` ha desaparecido de toda la experiencia actual sin una migración destructiva.
- Se ha retirado únicamente el hint de Observaciones, no los comentarios.
- Adjuntar un archivo funciona realmente y no aparece el error de `encType` ni `Failed to fetch`.
- El límite de 25 MB se aplica correctamente.
- Ya no existe archivo/recuperación de ofertas en la interfaz ni en consultas nuevas.
- Todas las ofertas accesibles, incluido `Anulado`, aparecen en el listado común.
- Las fechas `Desde`/`Hasta` y los estados múltiples persisten en URL, paginación, ordenación y Excel.
- Personas y accesos se gestionan en una sola pantalla sin fusionar modelos.
- Cada bloque de reglas muestra una única fila vacía progresiva.
- `USER` aterriza en Notificaciones y el enlace está antes del Gestor.
- Los permisos, auditoría, versiones, comentarios, revisiones, Navision, notificaciones y contador de DEV-004 continúan funcionando.
- Lint, typecheck, pruebas mínimas, build y `git diff --check` pasan.
- La documentación refleja las decisiones nuevas.

---

# Entrega y Pull Request

Al finalizar:

1. Revisa el diff completo.
2. Mantén commits pequeños y temáticos.
3. Sube únicamente la rama del hotfix.
4. Crea una Pull Request contra `main`.
5. Déjala abierta y sin fusionar.
6. No modifiques ni fusiones `main`.

La descripción de la Pull Request debe incluir:

- errores y problemas de usabilidad corregidos;
- decisión adoptada para Personas/Usuarios;
- tratamiento de datos previamente archivados;
- tratamiento técnico de `Language` deprecado;
- migraciones creadas;
- validaciones ejecutadas y resultados reales;
- prueba manual exacta del adjunto;
- guía de prueba manual para el Product Owner;
- limitaciones o puntos pendientes.

En la respuesta final indica:

- rama;
- commits principales;
- enlace de la Pull Request;
- migraciones;
- resumen de cambios;
- resultados de validación;
- cualquier desviación real;
- confirmación explícita de que la PR queda abierta y no fusionada.

