# V-APPS — DEV-003: primer flujo operativo del Gestor de Ofertas y branding Vincle

## Rol

Actúa como arquitecto y desarrollador full-stack senior responsable de convertir la base técnica actual de Vincle Apps en el primer flujo realmente operativo del Gestor de Ofertas, manteniendo máxima calidad de código, integridad de datos y coherencia documental.

Repositorio:

`https://github.com/bateman37/v-apps`

La Pull Request `#2`, correspondiente a DEV-002, ya está fusionada en `main`. La aplicación dispone de Next.js, React, TypeScript estricto, Prisma, PostgreSQL, Tailwind CSS, layout común, pantalla vacía de ofertas y consulta de maestros.

Esta entrega agrupa deliberadamente tres incrementos funcionales consecutivos porque comparten el mismo modelo y pueden desarrollarse de forma coherente en una única Pull Request:

1. Administración operativa de clientes, personas y catálogos.
2. Núcleo de datos de las ofertas y numeración global segura.
3. Primer flujo completo para listar, crear, consultar y modificar ofertas.

Además, toda la interfaz debe adaptarse transversalmente a la identidad visual oficial de Vincle descrita en este encargo.

No conviertas esta amplitud en una excusa para anticipar ESM, FACT, migraciones históricas, autenticación u otras funcionalidades futuras.

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
- `docs/shared/MASTER_DATA.md`.
- Todos los documentos de `docs/offers/`.
- `docs/decisions/DECISIONS.md`.
- `prompts/README.md`.
- `prisma/schema.prisma`.
- `prisma/seed.ts` y `prisma/seed-data.ts`.
- El código actual de `src/app`, `src/components`, `src/modules` y `src/lib`.

Comprueba primero que `main` contiene DEV-002 y que el árbol de trabajo está limpio. Si la ejecución se realiza en un entorno que ya asigna una rama de trabajo, utiliza esa rama. En caso contrario, crea una rama nueva desde `main` actualizado. No hagas push directo a `main`.

Si este encargo contradice una decisión aprobada en la documentación canónica, detente y explica la contradicción antes de modificarla. No resuelvas unilateralmente ninguna decisión que continúe marcada como `PENDIENTE`, salvo la decisión sobre el importe cero que se cierra expresamente más adelante en este prompt.

---

## Conservación obligatoria del prompt

Guarda una copia fiel de este encargo en:

`prompts/0003-flujo-operativo-ofertas-branding-vincle.md`

Inclúyela en el mismo commit y en la misma Pull Request que el código.

---

## Objetivo verificable de la entrega

Al terminar, una persona no técnica debe poder arrancar la aplicación localmente y completar este recorrido sin tocar directamente PostgreSQL:

1. Crear un cliente desde Administración.
2. Crear una persona habilitada como comercial.
3. Crear otra persona habilitada como Project Manager, o una misma persona con ambos perfiles.
4. Crear o mantener los valores de los catálogos existentes cuando sea necesario.
5. Abrir `Nueva oferta`.
6. Completar los campos obligatorios y, opcionalmente, jornadas por perfil.
7. Guardar la oferta y recibir automáticamente un número con formato `VIaaaamm-contador`.
8. Encontrar la oferta en el listado mediante búsqueda o filtros.
9. Abrirla, consultar su información y modificarla.
10. Comprobar que el número no cambia, que las jornadas se recalculan y que los cambios de estado quedan trazados.

La aplicación seguirá siendo exclusivamente local y sin autenticación, tal como establece `DEC-019`.

---

# A. Adaptación transversal a la identidad visual oficial de Vincle

## Fuente de marca aprobada

El Product Owner ha proporcionado el `Brand Manual` de Vincle, edición mayo de 2024. Para esta aplicación se aplicarán estos valores oficiales:

| Uso | Valor oficial |
|---|---|
| Azul corporativo principal | `#1F18C0` — RGB `31, 24, 192` |
| Negro corporativo | `#000000` — RGB `0, 0, 0` |
| Mostaza secundario | `#DBBA12` — RGB `219, 186, 18` |
| Tipografía principal | Gilroy |

El mostaza es un color de acento y debe mantenerse aproximadamente en un 10 % de la composición, no convertirse en el color dominante de la aplicación.

## Implementación visual requerida

1. Sustituye los colores temporales actuales por tokens semánticos centralizados en CSS.
2. Utiliza el azul `#1F18C0` para acciones principales, navegación activa, enlaces relevantes y foco.
3. Utiliza negro o un neutral casi negro para títulos y texto principal.
4. Utiliza `#DBBA12` únicamente como acento: indicadores, pequeños destacados, cifras o detalles visuales. No lo uses como texto normal sobre blanco si no cumple contraste.
5. Mantén fondos blancos y neutros claros para que la herramienta siga siendo sobria, corporativa y cómoda en jornadas largas de trabajo.
6. Mantén tokens funcionales diferenciados para éxito, aviso y error. Si son colores derivados no oficiales, documéntalos como colores funcionales de interfaz, no como colores de marca.
7. Garantiza contraste WCAG AA, foco visible, navegación por teclado y estados `hover`, `focus`, `disabled` y error distinguibles sin depender únicamente del color.
8. Refina el menú lateral, cabeceras, botones, tarjetas, tablas, formularios, badges, vacíos y avisos con el mismo sistema visual.
9. No conviertas una aplicación corporativa en una landing de marketing: evita degradados decorativos, grandes fondos mostaza, sombras excesivas o animaciones innecesarias.

## Logo y tipografía

- No dibujes, traces, recrees ni alteres el logotipo desde el PDF.
- No descargues logos ni tipografías desde fuentes externas.
- Mientras no exista en el repositorio un archivo oficial de logotipo, conserva `Vincle Apps` como denominación textual.
- Gilroy es la tipografía oficial, pero no se han proporcionado archivos de fuente licenciados. Define una pila preparada para usar `Gilroy` cuando esté disponible localmente y conserva una alternativa web segura ya incluida en el proyecto. No simules que Gilroy está instalada ni incorpores archivos sin licencia.
- Utiliza pesos visuales equivalentes a Gilroy Black para titulares y Semibold/Regular para subtítulos y cuerpo, respetando la jerarquía sin sobredimensionarla para una aplicación interna.

## Documentación de diseño

Crea `docs/design/BRAND_UI.md` y enlázalo desde `docs/INDEX.md`. Debe diferenciar claramente:

- Colores oficiales del manual.
- Tokens y neutros derivados para la interfaz.
- Reglas de proporción del mostaza.
- Uso provisional de la tipografía de respaldo.
- Ausencia actual de un activo oficial de logotipo.
- Requisitos básicos de accesibilidad.

No copies el PDF del manual al repositorio y no incluyas recursos extraídos de él.

---

# BLOQUE 1 — Administración operativa

## 1. Maestro de clientes

Implementa `Client` en Prisma y su administración desde una ruta clara, recomendada:

`/admin/clients`

Campos mínimos:

- `id` interno.
- `name`, obligatorio, sin espacios exteriores y con una longitud razonable.
- `isActive`, obligatorio y `true` por defecto.
- `createdAt`.
- `updatedAt`.

Reglas:

- No inventes todavía códigos corporativos, grupos empresariales, implantaciones, datos fiscales ni identificadores de Business Central.
- Evita duplicados exactos de nombre tras normalizar espacios. Si se opta por una restricción adicional de unicidad, debe ser compatible con PostgreSQL y quedar documentada.
- Un cliente utilizado por ofertas nunca se elimina físicamente.
- El usuario puede crear, editar el nombre y activar o desactivar el cliente.
- Los clientes inactivos no aparecen al crear nuevas ofertas, pero deben seguir visibles en ofertas históricas y en la edición de una oferta que ya los utiliza.
- El listado debe permitir buscar por nombre y filtrar por activo/inactivo.

## 2. Maestro común de personas

Implementa `Person` en Prisma y su administración desde:

`/admin/people`

Campos mínimos:

- `id` interno.
- `name`, obligatorio y sin espacios exteriores.
- `canBeCommercial`, booleano.
- `canBeProjectManager`, booleano.
- `isActive`, obligatorio y `true` por defecto.
- `createdAt`.
- `updatedAt`.

Reglas:

- Comercial y Project Manager no son tablas ni personas separadas.
- Una persona puede tener uno de los indicadores, ambos o ninguno; no inventes más roles de negocio.
- No añadas email, teléfono, departamento, usuario de acceso ni credenciales en esta entrega.
- Una persona referenciada por ofertas nunca se elimina físicamente.
- Las personas inactivas no aparecen en nuevas selecciones, pero se preservan y se muestran en ofertas existentes.
- El listado debe permitir buscar por nombre y filtrar por habilitación comercial, habilitación PM y estado activo.

## 3. Edición controlada de los ocho catálogos existentes

La pantalla actual `/admin/master-data` deja de ser únicamente de lectura. Debe permitir crear, modificar y activar/desactivar registros de:

- Prioridades.
- Orígenes.
- Tipos de oferta.
- Estados de oferta.
- Segmentaciones.
- Perfiles profesionales.
- Idiomas.
- Motivos de cancelación.

Reglas comunes:

- Nunca se permite borrado físico.
- `code` es obligatorio, estable y único. Una vez creado un registro, su código técnico no se modifica desde la interfaz.
- `name`, `sortOrder` e `isActive` son editables.
- Los códigos deben validarse y normalizarse de forma predecible, sin renombrar los códigos ya aprobados.
- Un registro inactivo sigue apareciendo en Administración e históricos.
- No inventes valores iniciales para idiomas ni motivos de cancelación. Deben seguir vacíos en una instalación nueva hasta que el usuario los cree.
- La interfaz debe confirmar claramente la desactivación y explicar que no se borra el histórico.
- Evita crear ocho implementaciones duplicadas: comparte validación y componentes donde tenga sentido, sin construir un framework genérico innecesario.

## Navegación de Administración

Organiza el menú de Administración de forma comprensible:

- Clientes.
- Personas.
- Maestros de oferta.

El aviso `Entorno local · autenticación pendiente` debe continuar visible. Como todavía no existe autorización, documenta que estas pantallas solo son utilizables en local y que la restricción real a administradores sigue pendiente; no inventes un administrador ni un bypass de autenticación.

---

# BLOQUE 2 — Núcleo de datos de ofertas

## Modelos Prisma requeridos

Implementa como mínimo:

- `Offer`.
- `OfferProfileDays`.
- `OfferStatusHistory`.
- `SystemCounter` o un mecanismo equivalente que cumpla las reglas aprobadas.
- `AuditLog`, con actor nullable mientras no exista autenticación.

Actualiza también las relaciones inversas necesarias en `Client`, `Person` y los catálogos.

## Campos de `Offer`

### Identificación y relaciones obligatorias

- `id` interno.
- `number`, único, inmutable y generado por el sistema.
- `clientId` → `Client`.
- `priorityId` → `Priority`.
- `commercialId` → `Person`.
- `offerDate`.
- `originId` → `Origin`.
- `projectManagerId` → `Person`.
- `description`.
- `offerTypeId` → `OfferType`.
- `totalAmount` con decimal exacto, nunca `float`.
- `statusId` → `OfferStatus`.
- `requesterName`.

### Campos opcionales

- `implantationText`, texto libre nullable. No crees maestro de implantaciones.
- `estimatedCommercialDeliveryDate`.
- `estimatedClientDeliveryDate`.
- `commercialDays`, decimal no negativo y separado de las jornadas por perfil.
- `estimatedPortfolioDate`.
- `segmentationId`.
- `notes`.
- `languageId`.
- `navisionOrder` o nombre técnico equivalente.
- `cancellationReasonId`.

### Control de registro

- `createdAt`.
- `updatedAt`.
- `deletedAt` nullable para eliminación lógica futura.

No añadas campos de ESM, costes, tarifas, margen, contrato, facturación, licencia ni implantación relacional.

## Decisión funcional cerrada en este encargo: importe cero

Para desbloquear el primer flujo funcional, `Importe total = 0` se considera un valor válido, siempre que el campo se haya informado explícitamente.

Por tanto:

- vacío no es válido;
- un valor negativo no es válido;
- `0,00 €` sí es válido;
- utiliza decimal de base de datos con dos posiciones para evitar errores monetarios.

Registra esta decisión como aprobada e implementada en `docs/decisions/DECISIONS.md`, utilizando el siguiente identificador disponible y actualizando la antigua decisión pendiente correspondiente sin dejar dos entradas contradictorias.

## Jornadas por perfil

`OfferProfileDays` debe contener:

- `offerId`.
- `professionalProfileId`.
- `days` como decimal no negativo.
- Restricción única por pareja oferta/perfil.
- Timestamps únicamente si aportan trazabilidad real y se usan.

Reglas:

- Una oferta puede no tener ninguna jornada.
- No guardes `totalProfileDays` en `Offer`.
- Calcula el total desde `OfferProfileDays`.
- No crees registros para campos vacíos ni para valores cero, salvo que exista una razón técnica documentada.
- Las jornadas comerciales siguen siendo un campo separado de la oferta y no se suman silenciosamente al total técnico.

## Histórico de estados

`OfferStatusHistory` debe registrar:

- Oferta.
- Estado anterior nullable para el alta inicial.
- Estado nuevo.
- Fecha y hora.
- Actor nullable mientras no exista autenticación.

Reglas:

- El alta de una oferta crea el primer evento de estado.
- Una modificación solo crea un nuevo evento si el estado realmente cambia.
- No implementes todavía una máquina de estados ni restricciones de transición: `DEC-051` continúa pendiente.
- `navisionOrder` continúa siendo opcional en todos los estados mientras `DEC-052` siga pendiente.
- No envíes correos; `DEC-053` continúa pendiente.

## Auditoría mínima real

Implementa auditoría de:

- Alta y modificación de ofertas.
- Cambio de estado.
- Alta, modificación y activación/desactivación de clientes, personas y catálogos.

El registro debe incluir como mínimo tipo de entidad, identificador, acción, fecha y una representación estructurada razonable de los cambios. El actor queda `null` mientras no exista usuario autenticado; no inventes `admin`, `system` ni una identidad temporal.

Evita guardar secretos o información técnica sensible en la auditoría. Documenta la limitación actual de atribución.

## Numeración global de ofertas

Cumple exactamente las reglas aprobadas:

`VI` + `AAAA` + `MM` + `-` + contador global.

Ejemplo sintético:

`VI202609-00001`

Requisitos:

- Contador global; nunca se reinicia por mes o año.
- El año y mes proceden del momento real de creación, no de `offerDate` introducida por el usuario.
- Mínimo cinco dígitos; puede crecer a seis o más.
- Se asigna únicamente dentro del primer guardado exitoso.
- Abrir o cancelar el formulario no consume números.
- Una modificación nunca cambia el número.
- Un número anulado o eliminado lógicamente nunca se reutiliza.
- La obtención del contador y el alta de la oferta deben ejecutarse dentro de una transacción.
- El incremento debe ser atómico a nivel de PostgreSQL y seguro ante dos altas concurrentes.
- Si el alta falla y la transacción revierte, no debe quedar una oferta parcial.
- Existe una restricción única de base de datos sobre `number`.

El seed debe crear de forma idempotente el contador técnico de ofertas con valor inicial `0` únicamente si todavía no existe. Volver a ejecutar el seed jamás puede rebajar, reiniciar ni sobrescribir un contador existente.

No implementes en esta entrega la pantalla administrativa para ajustar el contador de producción: sin autenticación no puede considerarse protegida. Documenta que la inicialización con el último contador legado sigue pendiente para el corte real.

---

# BLOQUE 3 — Primer flujo operativo de ofertas

## Listado `/offers`

Sustituye el estado vacío temporal por un listado real leído desde PostgreSQL.

Debe incluir:

- Botón funcional `Nueva oferta`.
- Tabla responsive y usable en escritorio.
- Columnas mínimas: número, fecha, cliente, descripción resumida, comercial, PM, estado, importe, total de jornadas por perfil y acción para abrir.
- Formato monetario español en euros y fechas comprensibles.
- Estado vacío honesto cuando no hay ofertas, con acceso directo para crear la primera.
- Exclusión por defecto de registros con `deletedAt` informado.

## Búsqueda, filtros, orden y paginación

Implementa mediante parámetros de URL para que el estado sea reproducible:

- Búsqueda por número, descripción, cliente o solicitante.
- Año.
- Mes.
- Cliente.
- Comercial.
- PM.
- Estado.
- Tipo de oferta.
- Origen.
- Botón para limpiar filtros.
- Ordenación al menos por número, fecha, cliente, estado e importe.
- Paginación, con un tamaño razonable como 25 registros.

Reglas:

- Los filtros deben combinarse, no excluirse entre sí.
- La paginación y ordenación conservan los filtros activos.
- Evita cargar todas las ofertas en el navegador para filtrarlas en cliente.
- Haz las consultas en servidor con Prisma y selecciona únicamente los campos necesarios.
- Controla parámetros inválidos sin romper la pantalla.

Muestra recuento de resultados y, si puede obtenerse sin una arquitectura desproporcionada, suma del importe y de jornadas sobre el conjunto filtrado completo, no solo sobre la página. Si esta agregación introduce complejidad o consultas frágiles, prioriza recuento, listado y filtros correctos y documenta los totales como siguiente mejora; no implementes una solución incorrecta.

## Alta `/offers/new`

Activa la entrada de navegación `Nueva oferta` y crea un formulario real.

Antes del primer guardado muestra:

`Se asignará al guardar`

Organiza el formulario en secciones claras:

### Identificación

- Cliente.
- Implantación, texto libre opcional.
- Prioridad.
- Origen.
- Comercial.
- Project Manager.
- Fecha de la oferta.

### Descripción y clasificación

- Descripción.
- Tipo de oferta.
- Segmentación opcional.
- Nombre del solicitante.
- Idioma opcional.
- Observaciones opcionales.

### Planificación

- Fecha estimada de entrega comercial.
- Fecha estimada de entrega al cliente.
- Fecha estimada de cartera.

### Estimación por perfil

- Un campo opcional y numérico para cada perfil profesional activo.
- Total calculado y visible en el formulario.
- Jornadas comerciales en un campo separado.

### Situación comercial

- Importe total.
- Estado.
- Motivo de cancelación cuando aplique.
- Pedido/identificador de Navision opcional.

## Validaciones del alta

Son obligatorios para guardar:

- Cliente.
- Prioridad.
- Comercial.
- Fecha de la oferta.
- Origen.
- PM.
- Descripción.
- Tipo de oferta.
- Importe total, admitiendo cero y rechazando negativos.
- Estado.
- Nombre del solicitante.

Además:

- La persona comercial debe estar habilitada como comercial.
- La persona PM debe estar habilitada como Project Manager.
- Si el estado tiene código estable `CANCELLED`, el motivo de cancelación es obligatorio.
- Para cualquier otro estado, no conserves silenciosamente un motivo de cancelación antiguo.
- Si se selecciona `CANCELLED` y no existen motivos activos, muestra un mensaje claro con enlace o indicación para crearlos en Administración; no inventes un motivo.
- Jornadas y jornadas comerciales no pueden ser negativas.
- Las relaciones enviadas deben existir y ser válidas; no confíes únicamente en la validación del navegador.
- Las validaciones de servidor son la autoridad. Refleja los errores junto al campo y conserva los valores escritos cuando sea razonable.
- Evita dobles envíos accidentales.

## Consulta y modificación

Crea una ruta de consulta, recomendada:

`/offers/[id]`

Y una ruta de modificación, recomendada:

`/offers/[id]/edit`

Requisitos:

- La consulta presenta todos los datos relevantes, jornadas por perfil, total calculado y pequeño histórico de estados.
- La modificación reutiliza el mismo componente y las mismas reglas del formulario de alta.
- El número se muestra pero jamás es editable.
- `createdAt` no cambia.
- Las jornadas se sincronizan transaccionalmente: altas, cambios y eliminación de valores vacíos/cero sin duplicados.
- Si el estado cambia, se crea historial; si no cambia, no se duplica el evento.
- El guardado de oferta, jornadas, histórico y auditoría debe ser consistente y transaccional.
- Tras guardar, muestra confirmación accesible y redirige a una pantalla lógica sin perder el contexto.
- Gestiona identificadores inexistentes con la respuesta 404 de Next.js, no con una pantalla rota.

No implementes borrado de ofertas desde la interfaz en esta entrega. Mantén `deletedAt` preparado para la regla aprobada de eliminación lógica futura.

---

## Arquitectura y calidad técnica

Mantén el monolito modular existente y sus fronteras:

- Rutas y composición en `src/app`.
- Componentes compartidos reales en `src/components`.
- Dominio y casos de uso de ofertas en `src/modules/offers`.
- Administración de clientes, personas y catálogos en módulos propios o una organización equivalente clara.
- Prisma singleton y utilidades técnicas en `src/lib/db`.

Requisitos:

- Next.js App Router y Server Components por defecto.
- Componentes de cliente solo donde exista interacción que realmente lo requiera.
- Mutaciones mediante Server Actions o una solución coherente con el proyecto; no crees una API REST paralela sin necesidad.
- Validación compartida entre alta y edición. Puedes añadir una dependencia pequeña y mantenida de validación si reduce errores y queda justificada; no añadas una gran librería de formularios o componentes sin necesidad.
- TypeScript estricto, sin `any` evasivo.
- Errores de PostgreSQL transformados en mensajes útiles sin filtrar cadenas de conexión, SQL ni trazas sensibles.
- Consultas sin N+1 y con selecciones acotadas.
- Operaciones críticas dentro de transacciones.
- Fechas y decimales serializados explícitamente; no dependas de conversiones implícitas frágiles.
- Índices útiles para claves foráneas, número de oferta, fechas y filtros frecuentes, sin sobreindexar indiscriminadamente.
- Migración Prisma normal, acumulativa y no destructiva. No edites la migración ya fusionada de DEV-002.
- No uses `prisma db push` como sustituto de la migración versionada.
- Conserva Prisma en la línea `6.x` durante esta entrega salvo incompatibilidad real documentada. No hagas una actualización mayor de stack mezclada con funcionalidad.

## Integridad y concurrencia

Presta especial atención a:

- Dos usuarios creando una oferta simultáneamente.
- Reintentos o dobles clics.
- Catálogos desactivados mientras una oferta existente los referencia.
- Edición de jornadas sin dejar duplicados o datos huérfanos.
- Fallos a mitad de un guardado.
- Números de oferta únicos e inmutables.
- Importes y jornadas representados con decimales exactos.

No ocultes una limitación de concurrencia con comentarios o validación solo en interfaz: apóyate en transacciones y restricciones de PostgreSQL.

---

## Datos iniciales y privacidad

- No añadas clientes, personas ni ofertas ficticias al seed permanente.
- Mantén idempotentes los maestros existentes.
- No inventes idiomas ni motivos de cancelación.
- No uses nombres reales de clientes o empleados en pruebas, documentación, capturas o fixtures.
- Si necesitas datos durante la validación, utiliza datos inequívocamente sintéticos en una base temporal y elimínalos al finalizar cuando sea seguro hacerlo.
- No copies credenciales del Excel ni del SQL Server legado.
- `.env` continúa fuera de Git.

---

## Manejo de decisiones todavía pendientes

Esta entrega no autoriza resolver:

- Flujo o transiciones entre estados.
- Estados que exigen pedido de Navision.
- Correos automáticos.
- Mes del piloto de migración.
- Política final de edición de históricos importados.
- Modelo futuro de implantaciones.
- Roles, permisos o proveedor de autenticación.
- Infraestructura o despliegue.
- Reglas de ESM, tarifas, costes o márgenes.

Mantén esas decisiones como `PENDIENTE`. No diseñes soluciones especulativas.

---

## Fuera de alcance explícito

No implementes:

- Login, sesiones, usuarios, roles ni Microsoft Entra ID.
- Despliegue, Docker, CI/CD o infraestructura cloud.
- Migración desde SQL Server o Excel.
- Importación o exportación Excel.
- Emails o notificaciones externas.
- Adjuntos o documentos de oferta.
- ESM, FACT, Budget, Revenue Control o License Manager.
- Tarifas, costes, márgenes o facturación.
- Maestro de implantaciones.
- Eliminación física de ningún dato.
- Ajuste manual del contador desde interfaz.
- Datos reales.
- Una suite E2E extensa o un nuevo framework de pruebas de navegador.

---

## Pruebas automatizadas mínimas y focalizadas

El Product Owner realizará las pruebas funcionales manuales. No consumas tiempo ni contexto creando una batería masiva.

Añade únicamente pruebas automatizadas pequeñas y de alto valor para reglas con riesgo real, preferiblemente alrededor de:

1. Formateo del número de oferta y crecimiento más allá de cinco dígitos.
2. Validación de campos obligatorios, importe cero válido e importes/jornadas negativos inválidos.
3. Motivo de cancelación obligatorio para `CANCELLED`.
4. Cálculo de total de jornadas desde el detalle.
5. Una comprobación de la operación atómica del contador o una prueba de integración muy acotada que demuestre que dos altas no generan el mismo número.

No pruebes detalles triviales de maquetación. No dupliques casos equivalentes. No introduzcas Playwright/Cypress en esta entrega.

## Validaciones técnicas obligatorias

Ejecuta como mínimo:

```bash
npm ci
npm run db:generate
npm run db:migrate
npm run db:seed
npm run db:seed
npm run lint
npm run typecheck
npm run test
npm run build
git diff --check
```

Además, valida sobre una base PostgreSQL limpia y separada:

- Migración desde cero.
- Seed repetido sin duplicar catálogos ni reiniciar el contador.
- Alta de cliente y personas sintéticas.
- Alta de una oferta mínima.
- Alta de una oferta con jornadas.
- Modificación y cambio de estado.
- Búsqueda y filtros básicos.
- Comprobación de que el número no cambia al editar.
- Comprobación acotada de concurrencia del contador.

No informes simplemente “funciona”: incluye resultados concretos y cualquier limitación real.

---

## Prueba manual para el Product Owner

Actualiza `README.md` con una guía breve y numerada, comprensible para una persona no técnica, que continúe después del arranque local ya documentado.

La guía debe permitir probar:

1. Crear cliente.
2. Crear persona comercial.
3. Crear persona PM.
4. Crear un motivo de cancelación sintético si se quiere probar `Anulado`.
5. Crear una oferta con importe `0,00 €` y sin jornadas.
6. Crear otra oferta con jornadas en varios perfiles.
7. Comprobar numeración consecutiva.
8. Buscar y filtrar.
9. Modificar descripción, importe y jornadas.
10. Cambiar de estado y comprobar el histórico.
11. Desactivar un maestro y comprobar que no desaparece de la oferta histórica.

Indica qué resultado concreto debe observarse en cada punto. No incluyas credenciales ni datos reales.

---

## Documentación obligatoria

Actualiza de forma coherente:

- `README.md`.
- `CHANGELOG.md`.
- `docs/INDEX.md`.
- `docs/PROJECT_STATUS.md`.
- `docs/architecture/DATA_MODEL.md`.
- `docs/architecture/SECURITY.md`.
- `docs/shared/MASTER_DATA.md`.
- Los documentos afectados de `docs/offers/`.
- `docs/decisions/DECISIONS.md`.
- `CLAUDE.md`, porque actualmente conserva una descripción obsoleta que afirma que el repositorio todavía no contiene código.
- El nuevo `docs/design/BRAND_UI.md`.

La documentación debe distinguir claramente:

- Lo implementado.
- Lo aprobado pero pendiente de implementar.
- Lo todavía pendiente de decisión.
- Las limitaciones causadas por la ausencia de autenticación.

No marques como resuelta una decisión que este encargo mantiene pendiente.

---

## Criterios de aceptación

La entrega solo se considera completa si:

- [ ] El prompt está guardado en `prompts/0003-flujo-operativo-ofertas-branding-vincle.md`.
- [ ] La interfaz utiliza el azul `#1F18C0`, negro `#000000` y mostaza `#DBBA12` según las reglas de marca.
- [ ] Existe documentación de tokens y uso visual.
- [ ] No se han añadido logo ni fuente sin activos/licencia.
- [ ] Clientes y personas se administran desde la interfaz.
- [ ] Los ocho catálogos se pueden crear, editar y activar/desactivar sin borrado físico.
- [ ] Existe el modelo completo incluido en este alcance y una migración acumulativa.
- [ ] El seed no crea datos ficticios ni reinicia el contador.
- [ ] Se puede crear una oferta con todos los campos obligatorios.
- [ ] `0,00 €` es válido y un importe negativo no lo es.
- [ ] Se puede guardar una oferta sin jornadas.
- [ ] Se pueden guardar y modificar jornadas por perfil sin duplicados.
- [ ] El total de jornadas se deriva, no se almacena.
- [ ] La numeración cumple el formato y es segura ante concurrencia.
- [ ] El número no cambia al editar.
- [ ] El listado, búsqueda, filtros, ordenación y paginación funcionan con PostgreSQL.
- [ ] Alta y edición reutilizan reglas y componentes.
- [ ] El histórico de estados no duplica eventos sin cambio real.
- [ ] La auditoría registra cambios con actor nullable y sin inventar usuarios.
- [ ] Los errores no revelan información sensible.
- [ ] No se ha implementado ningún elemento declarado fuera de alcance.
- [ ] La documentación y la guía de prueba manual están actualizadas.
- [ ] Lint, typecheck, pruebas focalizadas, build y `git diff --check` finalizan correctamente.
- [ ] Se ha creado una Pull Request contra `main`.
- [ ] La Pull Request permanece abierta y sin fusionar.

---

## Commits y Pull Request

Organiza los commits de forma comprensible. Puedes utilizar varios commits coherentes dentro de la misma rama y PR, por ejemplo:

1. Branding y sistema visual.
2. Administración de maestros.
3. Modelo y migración de ofertas.
4. Flujo de alta/listado/edición.
5. Pruebas y documentación.

No es obligatorio seguir exactamente esa división si otra resulta más limpia, pero evita un historial caótico de correcciones triviales.

Crea una Pull Request contra `main` con un título equivalente a:

`feat: add first operational offers workflow and Vincle branding`

La descripción debe incluir:

- Resumen funcional.
- Modelos y migraciones añadidos.
- Decisión sobre importe cero.
- Aplicación de la identidad visual.
- Validaciones ejecutadas y resultados.
- Guía corta de prueba manual.
- Decisiones que continúan pendientes.
- Limitación explícita: aplicación local sin autenticación.

## Regla final no negociable

**Crea la Pull Request y déjala abierta. No la fusiones bajo ninguna circunstancia. El Product Owner realizará las pruebas manuales y decidirá si se fusiona.**

En tu respuesta final, proporciona el enlace a la PR, el listado resumido de cambios, las migraciones creadas, los resultados de las validaciones y cualquier bloqueo o decisión que continúe pendiente.
