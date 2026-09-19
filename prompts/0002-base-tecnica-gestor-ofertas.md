# V-APPS — DEV-002: base técnica ejecutable del Gestor de Ofertas

## Rol

Actúa como arquitecto y desarrollador full-stack senior responsable de realizar la **primera entrega de código** de Vincle Apps con calidad de producción, aunque esta versión solo se utilizará localmente.

Repositorio:

`https://github.com/bateman37/v-apps`

La Pull Request documental `#1` ya ha sido fusionada en `main`. El repositorio contiene la documentación canónica del proyecto, pero todavía no contiene código de aplicación.

Esta entrega debe crear una base técnica pequeña, ejecutable y verificable sobre la que construiremos el Gestor de Ofertas. No intentes implementar todo el módulo en una sola PR.

---

## Lectura obligatoria antes de modificar archivos

Lee completos, como mínimo:

- `AGENTS.md`.
- `CLAUDE.md`.
- `README.md`.
- `docs/INDEX.md`.
- `docs/PROJECT_STATUS.md`.
- `docs/architecture/ARCHITECTURE.md`.
- `docs/architecture/DATA_MODEL.md`.
- `docs/architecture/SECURITY.md`.
- `docs/shared/MASTER_DATA.md`.
- `docs/offers/OVERVIEW.md`.
- `docs/offers/FIELDS.md`.
- `docs/offers/BUSINESS_RULES.md`.
- `docs/offers/STATUSES.md`.
- `docs/decisions/DECISIONS.md`.
- `prompts/README.md`.

Si este encargo contradice una decisión aprobada en esos documentos, detente y explica la contradicción antes de cambiarla. No resuelvas por tu cuenta decisiones funcionales marcadas como pendientes.

---

## Conservación obligatoria del prompt

Guarda una copia fiel de este encargo en:

`prompts/0002-base-tecnica-gestor-ofertas.md`

Debe incluirse en el mismo commit y en la misma Pull Request que el código.

---

## Objetivo de la entrega

Dejar disponible una primera versión local y ejecutable de Vincle Apps que incluya:

1. Proyecto web inicializado con Node.js, TypeScript, React y Next.js.
2. PostgreSQL conectado mediante Prisma.
3. Primera migración con los maestros mínimos necesarios para preparar el Gestor de Ofertas.
4. Carga idempotente de los valores maestros ya aprobados.
5. Layout corporativo común con menú lateral.
6. Pantalla inicial de `Gestor de Ofertas` con estado vacío real.
7. Pantalla de consulta de maestros, únicamente de lectura en esta entrega.
8. Instrucciones claras para que una persona no técnica pueda arrancar y comprobar la aplicación localmente.

Esta PR debe demostrar que la base técnica, la navegación y PostgreSQL funcionan conjuntamente. La creación y modificación de ofertas se implementarán en entregas posteriores.

---

## Decisión nueva aprobada para esta entrega: autenticación pospuesta

El Product Owner ha decidido **posponer la autenticación**.

Consecuencias obligatorias:

- No implementes login, usuarios, contraseñas, sesiones, roles ni integración con Microsoft Entra ID.
- No inventes un usuario administrador temporal.
- No incluyas un bypass de autenticación que pueda confundirse con una solución definitiva.
- La aplicación se considera únicamente apta para desarrollo local.
- No prepares ni ejecutes despliegues.
- No conectes datos reales de clientes ni de empleados.
- Muestra en la interfaz, de forma discreta pero visible, una indicación como `Entorno local · autenticación pendiente`.
- Registra esta decisión como aprobada temporalmente en `docs/decisions/DECISIONS.md`.
- Deja claro en `README.md`, `docs/PROJECT_STATUS.md` y la documentación de seguridad que no debe exponerse la aplicación en una red accesible ni usarse en producción mientras no exista autenticación y autorización.

No diseñes ahora el sistema de autenticación futuro.

---

## Alcance funcional exacto

### 1. Layout común

Crea un layout de aplicación limpio, profesional y preparado para crecer, con:

- Menú lateral fijo en escritorio.
- Cabecera o zona superior de contexto.
- Nombre visible `Vincle Apps`.
- Sección activa `Gestor de Ofertas`.
- Navegación inicial:
  - `Todas las ofertas`.
  - `Nueva oferta`, visible pero deshabilitada o identificada claramente como próxima entrega.
  - `Administración`.
    - `Maestros`.
- Indicador visible `Entorno local · autenticación pendiente`.
- Estado activo de navegación inequívoco.
- Diseño responsive básico para que no se rompa en una ventana estrecha, aunque el uso principal sea de escritorio.
- Navegación mediante teclado y foco visible.

No añadas entradas para ESM, FACT, Budget, License Manager ni otros módulos futuros.

No copies literalmente el diseño de Gamificación. Utiliza el patrón acordado de menú lateral, pero crea una base visual corporativa sobria y reutilizable.

### 2. Ruta inicial

- La raíz `/` debe redirigir a `/offers` o presentar un acceso directo inequívoco a esa pantalla.
- Evita una landing page publicitaria.

### 3. Pantalla `Todas las ofertas`

Ruta recomendada:

`/offers`

Debe contener:

- Título `Gestor de Ofertas`.
- Acción `Nueva oferta`, deshabilitada o marcada como no disponible en esta entrega.
- Contenedor preparado visualmente para el futuro listado.
- Estado vacío claro: todavía no existen ofertas porque el modelo y el alta de ofertas no forman parte de esta PR.
- Explicación breve de que la siguiente entrega incorporará la gestión necesaria para crear ofertas.

No simules ofertas, contadores, importes ni clientes. No utilices datos ficticios para aparentar funcionalidad no implementada.

No crees todavía:

- Tabla `Offer`.
- Formulario de alta.
- Edición de ofertas.
- Filtros.
- Paginación.
- Exportación.
- Numeración de ofertas.
- Histórico de estados.
- Jornadas por perfil asociadas a ofertas.

### 4. Pantalla `Administración > Maestros`

Ruta recomendada:

`/admin/master-data`

En esta entrega será **solo de consulta**. Debe leer los datos reales de PostgreSQL mediante Prisma y mostrar, agrupados de forma comprensible:

- Prioridades.
- Orígenes.
- Tipos de oferta.
- Estados de oferta.
- Segmentaciones.
- Perfiles profesionales.
- Idiomas, aunque inicialmente no tengan valores aprobados.
- Motivos de cancelación, aunque inicialmente no tengan valores aprobados.

Para cada grupo muestra como mínimo:

- Nombre visible.
- Código técnico estable.
- Estado activo/inactivo.
- Orden cuando aplique.
- Número de registros del grupo.

La pantalla debe gestionar correctamente:

- Grupos sin registros.
- Error de conexión a la base de datos, con mensaje útil sin revelar la cadena de conexión ni detalles sensibles.
- Carga normal sin depender de JavaScript en cliente cuando no sea necesario.

No implementes alta, edición, borrado ni activación/desactivación desde la interfaz. Tampoco añadas botones que parezcan funcionales si no lo son.

---

## Stack técnico

Utiliza:

- Node.js en una versión LTS soportada por las dependencias seleccionadas.
- TypeScript en modo estricto.
- Next.js con App Router.
- React.
- PostgreSQL.
- Prisma ORM.
- npm como gestor de paquetes.
- ESLint.
- Un sistema de estilos mantenible; Tailwind CSS es válido si queda correctamente integrado y no se introduce una librería de componentes innecesaria.

Reglas:

- Utiliza versiones estables y compatibles entre sí.
- Fija las versiones exactas mediante `package-lock.json`.
- Añade `.nvmrc` o un mecanismo equivalente para documentar la versión principal de Node utilizada.
- No uses Docker.
- No añadas una API separada ni microservicios.
- No añadas Redux u otro gestor global sin necesidad.
- No añadas una librería visual grande para resolver esta interfaz pequeña.
- No añadas telemetría propia ni servicios externos.

---

## Organización del código

Mantén la arquitectura de monolito modular descrita en la documentación.

Utiliza una estructura clara equivalente a:

```text
src/
  app/
  components/
    layout/
    ui/
  modules/
    offers/
    master-data/
  lib/
    db/
prisma/
  schema.prisma
  seed.ts
```

Puedes ajustar nombres menores si la versión de las herramientas lo aconseja, pero conserva estas fronteras:

- `app`: rutas y composición de páginas.
- `components`: componentes realmente compartidos.
- `modules/offers`: código específico del Gestor de Ofertas.
- `modules/master-data`: acceso y presentación de maestros.
- `lib/db`: cliente Prisma y utilidades estrictamente técnicas.

Evita crear capas, repositorios genéricos, patrones abstractos o carpetas vacías sin uso real.

---

## Modelo de datos incluido en esta entrega

Implementa únicamente los maestros necesarios para la pantalla de consulta y para preparar las siguientes entregas.

### Entidades de catálogo

Modela:

- `Priority`.
- `Origin`.
- `OfferType`.
- `OfferStatus`.
- `Segmentation`.
- `ProfessionalProfile`.
- `Language`.
- `CancellationReason`.

Todos deben disponer, como mínimo, de:

- Identificador interno.
- Código técnico estable y único.
- Nombre visible.
- Estado activo.
- Orden de visualización.
- Fecha de creación.
- Fecha de última actualización.

Requisitos:

- Utiliza nombres de modelos y campos técnicos en inglés.
- Los nombres visibles se mantienen en español según la documentación.
- El código técnico no debe depender del texto visible para futuras modificaciones de etiqueta.
- Los registros se podrán desactivar en el futuro y no se eliminarán físicamente cuando estén usados.
- No implementes todavía relaciones con ofertas.

### Entidades deliberadamente fuera de esta entrega

No crees todavía:

- `Offer`.
- `OfferProfileDays`.
- `OfferStatusHistory`.
- `SystemCounter`.
- `AuditLog`.
- `ImportBatch`.
- `ImportIssue`.
- `User`.
- `Role`.
- Maestro de implantaciones.

Tampoco crees todavía `Client` ni `Person`: sus campos mínimos y su administración se cerrarán en la siguiente entrega antes de implementar el formulario de oferta.

---

## Valores maestros iniciales

Implementa una carga inicial idempotente. Ejecutarla varias veces no debe duplicar registros ni cambiar identificadores de manera innecesaria.

### Prioridades

En este orden:

1. Alta.
2. Media.
3. Baja.

### Orígenes

En este orden:

1. Comercial.
2. PM.
3. CS.

### Tipos de oferta

En este orden:

1. Bolsa de horas.
2. Cambio de alcance.
3. Proyecto.

### Estados de oferta

En este orden:

1. A valorar PM.
2. Entregado a comercial.
3. Enviado.
4. Oferta 90 %.
5. Aceptado.
6. Desarrollo.
7. Entregado.
8. Facturado.
9. Anulado.
10. En revisión.

No implementes transiciones, requisitos de estado, porcentajes comerciales ni automatismos. Esas reglas siguen pendientes.

### Segmentaciones

En este orden:

1. Acción: Top desarrollos.
2. Evolutivos grandes (>10 k€).
3. Evolutivos pequeños (<10 k€).
4. Nueva división.
5. Nuevo módulo.
6. Nuevo país.
7. Proyecto VFS.
8. Proyecto VSW.
9. Upgrade VSW.
10. Vertical PBI.

### Perfiles profesionales

Conserva exactamente estos códigos funcionales:

| Código | Nombre visible |
|---|---|
| PM | Project Manager |
| AN | Analista |
| DIL | Data Insights Leader |
| DE | Data Engineer |
| IN | Consultor Insights |
| DI | Desarrollador Insights |
| PR-BE | Programador Backend |
| PR-FE | Programador Frontend |
| PR-REM | Programador Remoto |
| KN | Knowledge |
| IT | IT |
| UX | UX/UI |
| TL | Tech Lead |
| PLATF | Plataforma |

### Idiomas y motivos de cancelación

No existen valores aprobados todavía.

- Crea sus tablas.
- No inventes valores.
- La pantalla debe mostrarlas correctamente como listas vacías.

### Códigos técnicos

Define códigos legibles, estables y consistentes para los catálogos que no traen un código funcional explícito. Pueden estar en inglés y en mayúsculas con guion bajo, por ejemplo `HIGH`, `COMMERCIAL` o `PROJECT`.

Estos códigos son identificadores técnicos, no nuevas reglas de negocio. Documenta el mapeo código–nombre en el seed o en una ubicación única y evita duplicarlo innecesariamente.

---

## Prisma y PostgreSQL

Requisitos obligatorios:

- Configura Prisma siguiendo la forma recomendada por la versión estable instalada.
- Crea una migración inicial con nombre descriptivo.
- Implementa un cliente Prisma reutilizable que evite conexiones duplicadas durante hot reload en desarrollo.
- Incluye un seed idempotente.
- No incluyas credenciales reales.
- Añade `.env` a `.gitignore`.
- Proporciona `.env.example` únicamente con una cadena de ejemplo sintética y claramente reemplazable.
- No registres ni muestres `DATABASE_URL` en consola o interfaz.
- No conectes con el SQL Server histórico.
- No implementes todavía migración de datos.

Incluye scripts npm equivalentes a:

- `dev`.
- `build`.
- `start`.
- `lint`.
- `typecheck`.
- `test`.
- `db:generate`.
- `db:migrate`.
- `db:seed`.

Adapta los comandos a las versiones instaladas y documéntalos.

---

## Diseño visual y experiencia de uso

La interfaz debe sentirse como el inicio de una aplicación corporativa real, no como la pantalla por defecto de Next.js.

Criterios:

- Jerarquía visual clara.
- Espaciado consistente.
- Tipografía legible.
- Contraste suficiente.
- Colores sobrios y reutilizables mediante variables o tokens simples.
- Componentes con estados de foco visibles.
- Etiquetas en español.
- Estados vacío y de error cuidados.
- No uses imágenes generadas, iconos remotos ni recursos con licencias dudosas.
- Si utilizas iconos, usa una dependencia ligera y coherente o iconos locales accesibles.
- No añadas animaciones innecesarias.

No busques cerrar ahora el branding definitivo de Vincle Apps.

---

## Tratamiento de errores

- La pantalla de maestros no debe romper toda la aplicación si PostgreSQL no está disponible.
- Presenta un mensaje en español que indique que no se ha podido conectar con los datos y remita a la configuración local.
- No expongas stack traces, nombres de servidores, usuarios, contraseñas ni cadenas de conexión en la interfaz.
- Conserva el error técnico únicamente para el entorno de desarrollo mediante los mecanismos normales del framework, sin crear un sistema complejo de logging.

---

## Pruebas automatizadas mínimas

El Product Owner realizará las pruebas funcionales manuales. Mantén las pruebas automatizadas deliberadamente acotadas.

Incluye únicamente pruebas de alto valor para esta entrega, por ejemplo:

1. Una prueba sobre la definición de los valores maestros que verifique que los códigos son únicos y que los perfiles profesionales esperados están presentes.
2. Una prueba pequeña de una función pura realmente utilizada, solo si existe una función con lógica que merezca validarse.

No añadas:

- Playwright, Cypress ni otra suite E2E.
- Pruebas visuales.
- Pruebas exhaustivas de componentes puramente presentacionales.
- Decenas de casos redundantes.
- Infraestructura de base de datos exclusiva para tests.

Si para una única prueba adicional hay que introducir una infraestructura desproporcionada, no la añadas.

---

## Guía de arranque y prueba manual

Actualiza `README.md` con instrucciones paso a paso pensadas para una persona no técnica.

Debe explicar como mínimo:

1. Requisitos previos.
2. Cómo clonar o actualizar el repositorio.
3. Cómo instalar dependencias.
4. Cómo crear una base de datos PostgreSQL local separada para `v-apps`.
5. Cómo copiar `.env.example` a `.env` y qué valor debe adaptar, sin publicar ninguna contraseña real.
6. Cómo generar Prisma.
7. Cómo ejecutar la migración.
8. Cómo cargar los maestros.
9. Cómo arrancar la aplicación.
10. Qué URL abrir.
11. Cómo detenerla.
12. Cómo repetir el seed y comprobar que no duplica registros.

Añade también una sección de **prueba manual de aceptación** con pasos exactos:

1. Abrir la aplicación.
2. Confirmar el menú lateral y el aviso de autenticación pendiente.
3. Entrar en `Todas las ofertas` y comprobar el estado vacío.
4. Confirmar que `Nueva oferta` todavía no permite crear una oferta.
5. Entrar en `Administración > Maestros`.
6. Comprobar prioridades, orígenes, tipos, estados, segmentaciones y perfiles.
7. Confirmar que idiomas y motivos de cancelación aparecen vacíos sin error.
8. Ejecutar de nuevo el seed y confirmar que los recuentos no aumentan.

No presupongas conocimientos de Prisma. Explica qué hace cada comando en una frase breve.

---

## Documentación que debe actualizarse

Actualiza de forma coherente, sin duplicar contenido:

- `README.md`.
- `CHANGELOG.md`.
- `docs/PROJECT_STATUS.md`.
- `docs/architecture/ARCHITECTURE.md`, para reflejar la estructura técnica realmente elegida.
- `docs/architecture/DATA_MODEL.md`, indicando qué entidades ya están implementadas y cuáles siguen siendo conceptuales.
- `docs/architecture/SECURITY.md`, reflejando la restricción de uso local sin autenticación.
- `docs/decisions/DECISIONS.md`, registrando la autenticación pospuesta como decisión temporal aprobada.
- `docs/shared/MASTER_DATA.md`, si la implementación concreta requiere documentar códigos o comportamiento del seed.

No marques el Gestor de Ofertas como completado. El estado correcto será: base técnica y maestros de referencia implementados; CRUD de clientes/personas y ofertas todavía pendiente.

---

## Fuera de alcance absoluto

No implementes en esta PR:

- Autenticación o autorización.
- Despliegue o infraestructura.
- Docker.
- Ofertas persistidas.
- Contador de ofertas.
- Alta o edición de ofertas.
- CRUD de clientes o personas.
- CRUD de maestros.
- Jornadas por oferta.
- Importación desde Excel o SQL Server.
- Correos electrónicos.
- Integración con Navision/Business Central.
- ESM.
- FACT.
- Budget Comercial.
- License Manager.
- Tarifas, costes, márgenes o descuentos.
- Implantaciones como maestro.
- Datos reales de clientes o trabajadores.

No dejes archivos vacíos o servicios simulados para estas funcionalidades.

---

## Calidad de implementación

- TypeScript estricto sin `any` evitable.
- Sin errores ni advertencias ignoradas del linter.
- Sin código muerto.
- Sin componentes gigantes cuando exista una separación natural.
- Sin abstracciones prematuras.
- Componentes de servidor por defecto; componentes de cliente solo cuando exista interacción que los requiera.
- Consultas Prisma limitadas a los campos necesarios y ordenadas de forma determinista.
- Accesibilidad básica correcta.
- No ocultes errores con `try/catch` vacíos.
- No silencies comprobaciones con comentarios de desactivación salvo justificación concreta.
- No modifiques decisiones funcionales aprobadas.

---

## Validaciones obligatorias

Antes de crear la Pull Request, ejecuta y corrige cualquier error de:

1. Instalación reproducible desde el lockfile.
2. Generación del cliente Prisma.
3. Migración sobre una base de datos de desarrollo limpia.
4. Seed inicial.
5. Segunda ejecución del seed para comprobar idempotencia.
6. `npm run lint`.
7. `npm run typecheck`.
8. `npm run test`.
9. `npm run build`.
10. `git diff --check`.

Comprueba además manualmente que:

- La aplicación arranca.
- `/offers` se renderiza correctamente.
- `/admin/master-data` lee PostgreSQL.
- No existe ninguna oferta simulada.
- No se han incluido secretos.
- No se han incluido datos reales.
- No se ha implementado funcionalidad fuera de alcance.

No conviertas estas validaciones en una suite automatizada extensa.

---

## Flujo Git y Pull Request

1. Comprueba el estado del repositorio y que la base incluye la PR documental `#1` ya fusionada.
2. Respeta las reglas del entorno de Claude Code:
   - Si el entorno ya te ha asignado una rama de trabajo, continúa en ella y no cambies de rama.
   - Si no existe una rama asignada y tienes permiso para crearla, utiliza un nombre como `feat/offers-foundation`.
3. No hagas push directo a `main`.
4. No reescribas el historial.
5. No uses `force push`.
6. Conserva cambios ajenos si existieran y no los mezcles con esta entrega.
7. Realiza un commit claro.
8. Publica la rama.
9. Crea una Pull Request contra `main` con un título similar a:

   `feat: establish executable offers foundation`

10. La descripción debe incluir:
    - Objetivo.
    - Alcance implementado.
    - Modelo de datos creado.
    - Valores maestros cargados.
    - Decisión temporal sobre autenticación.
    - Instrucciones resumidas de prueba manual.
    - Validaciones ejecutadas y resultados.
    - Elementos fuera de alcance y siguiente paso recomendado.
11. Deja la Pull Request abierta.
12. **No fusiones la Pull Request bajo ninguna circunstancia.**

Si no puedes crear la PR por permisos o autenticación, publica la rama si es posible e informa exactamente del bloqueo. No intentes resolverlo fusionando ni empujando a `main`.

---

## Criterios de aceptación

La entrega estará terminada únicamente si:

- El proyecto se instala de forma reproducible.
- La aplicación arranca localmente.
- PostgreSQL y Prisma funcionan con una migración limpia.
- El seed es idempotente.
- Los maestros aprobados se muestran desde PostgreSQL.
- Idiomas y motivos de cancelación se muestran vacíos sin inventar valores.
- Existe un layout reutilizable con menú lateral.
- `Todas las ofertas` muestra un estado vacío honesto.
- `Nueva oferta` no aparenta funcionar todavía.
- La ausencia temporal de autenticación está claramente señalada y documentada.
- No existen datos reales, secretos ni credenciales versionadas.
- Las pruebas automatizadas son mínimas y relevantes.
- La guía manual permite al Product Owner probar la entrega paso a paso.
- La documentación refleja el estado real de implementación.
- Este prompt está guardado en `prompts/0002-base-tecnica-gestor-ofertas.md`.
- Se ha creado una Pull Request abierta contra `main`.
- Claude Code no ha fusionado la Pull Request.

---

## Respuesta final esperada

Al terminar, responde con:

1. Resumen breve de lo implementado.
2. Lista de archivos principales creados o modificados.
3. Versiones principales utilizadas.
4. Modelo y maestros implementados.
5. Comandos de validación ejecutados y resultado.
6. Pasos exactos que debe realizar el Product Owner para su prueba manual.
7. URL de la Pull Request.
8. Confirmación explícita: `PR creada y dejada sin fusionar`.
9. Bloqueos o decisiones pendientes, si existen.

No propongas implementar el formulario de oferta dentro de esta misma PR.
