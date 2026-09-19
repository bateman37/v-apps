# V-APPS — DOC-001: cimentación documental del proyecto

## Rol

Actúa como arquitecto de software, analista funcional senior y responsable de documentación técnica del proyecto **Vincle Apps (`v-apps`)**.

Trabaja en el repositorio:

`https://github.com/bateman37/v-apps`

El repositorio se encuentra prácticamente vacío: actualmente solo contiene un `README.md` inicial con el título `v-apps`.

Esta primera entrega es **exclusivamente documental**. Debe dejar el repositorio preparado para que futuras sesiones de Claude Code puedan entender el producto, sus reglas, sus decisiones y la forma de trabajo sin depender del historial de esta conversación.

---

## Objetivo de esta entrega

Crear la cimentación documental de una plataforma web interna llamada provisionalmente **Vincle Apps**.

La plataforma sustituirá progresivamente varias aplicaciones y ficheros Excel corporativos, compartiendo navegación, autenticación, datos maestros, seguridad, auditoría e integraciones.

El primer módulo que se diseñará e implementará después de esta entrega será el **Gestor de Ofertas**.

En esta entrega debes:

1. Documentar la visión global de la plataforma.
2. Documentar el alcance funcional conocido del Gestor de Ofertas.
3. Registrar las decisiones que ya están aprobadas.
4. Separar claramente las decisiones pendientes.
5. Proponer una arquitectura inicial coherente y evolutiva.
6. Dejar fijadas las reglas permanentes de trabajo para Claude Code y otros agentes.
7. Crear un índice documental sencillo y mantenible.
8. Guardar una copia de este encargo dentro del repositorio.
9. Crear una Pull Request y dejarla abierta, sin fusionarla.

---

## Restricción absoluta de alcance

No implementes todavía la aplicación.

En concreto, en esta PR:

- No inicialices Next.js, React, Node.js, Prisma ni PostgreSQL.
- No crees `package.json`.
- No añadas dependencias.
- No crees migraciones.
- No implementes autenticación.
- No desarrolles pantallas ni componentes.
- No escribas endpoints ni servicios.
- No crees datos de prueba ejecutables.
- No configures Docker.
- No prepares infraestructura o despliegue.
- No tomes decisiones funcionales no aprobadas.

La entrega termina con documentación. La implementación comenzará en una entrega posterior y separada.

---

## Visión global de Vincle Apps

Vincle Apps será una plataforma corporativa modular con un menú lateral común. Debe poder incorporar progresivamente:

1. **Gestor de Ofertas**
   - Alta, consulta y modificación de ofertas.
   - Estimación inicial de jornadas por perfil.
   - Estado y seguimiento de la oferta.

2. **ESM**
   - Estimaciones de proyectos.
   - Estimación de precios recurrentes.
   - Costes, precios, margen y descuentos.
   - Jornadas comerciales con coste interno cero y valor comercial.

3. **FACT**
   - Registro de jornadas ejecutadas mensualmente.
   - Relación entre jornadas vendidas, ejecutadas, reconocidas y facturadas.
   - Seguimiento del consumo pendiente.

4. **Budget Comercial y Revenue Control**
   - Venta y recurrencia por cliente.
   - Presupuesto frente a venta y facturación real.
   - Incrementos configurados por cliente.
   - Mantenimiento por usuario en on-premise.
   - Licencias por usuario o licencia activa en SaaS.
   - Customer Service.
   - Infraestructura.
   - Proyectos y otros servicios recurrentes o no recurrentes.

5. **License Manager e integraciones**
   - Consulta mediante API de usuarios y licencias activas.
   - Comparación entre contratado, activo y facturado.
   - Detección de licencias activas no facturadas y otras discrepancias.

6. **Administración común**
   - Usuarios y permisos.
   - Maestros compartidos.
   - Tarifas, cuando se diseñen.
   - Parámetros de sistema.
   - Auditoría.

No desarrolles ni detalles prematuramente los módulos futuros. Deben aparecer en la visión y el roadmap, pero el único dominio que debe documentarse funcionalmente en profundidad ahora es el Gestor de Ofertas.

---

## Decisiones técnicas iniciales aprobadas

Documenta estas decisiones como punto de partida, indicando que la implementación concreta se validará antes de comenzar el código:

- Plataforma web interna.
- Arquitectura inicial de **monolito modular**.
- Node.js y TypeScript.
- Frontend con React/Next.js.
- PostgreSQL como base de datos central.
- Prisma como opción inicial de ORM.
- Repositorio privado de GitHub.
- Sin Docker salvo autorización posterior expresa.
- Configuración y secretos fuera del código y del repositorio.
- Entornos separados de desarrollo, pruebas y producción.
- Reglas de negocio deterministas: la aplicación no necesita IA en producción para calcular jornadas, importes, márgenes o estados.
- Diseño preparado para integrar APIs y procesos de importación en el futuro.

No conviertas esta lista en código ni en configuración ejecutable durante esta entrega.

---

## Primer módulo: Gestor de Ofertas

### Objetivo

Sustituir el Excel actual conectado a SQL Server por un módulo web con PostgreSQL, manteniendo el histórico, mejorando la trazabilidad y preparando la conexión futura con ESM, FACT y el resto de Vincle Apps.

El Excel actual contiene aproximadamente 1.254 ofertas históricas, una tabla de jornadas por perfil, maestros, generación de correos y lógica de validación.

### Navegación inicial prevista

El layout de la plataforma deberá admitir un menú lateral común.

En la primera implementación funcional solo será necesario mostrar:

- Gestor de Ofertas
  - Todas las ofertas
  - Nueva oferta
- Administración
  - Maestros
  - Usuarios y permisos, cuando se diseñen

El menú debe quedar preparado para incorporar otros módulos, pero no deben crearse ahora páginas vacías de ESM, FACT, Budget o License Manager.

### Pantalla principal de ofertas

La futura pantalla principal deberá sustituir la tabla del Excel y permitir:

- Consultar todas las ofertas.
- Crear una nueva oferta.
- Abrir y modificar una oferta existente.
- Buscar y filtrar.
- Ordenar resultados.
- Paginar.
- Aplicar filtros por año, mes, cliente, comercial, PM, estado, tipo de oferta y origen.
- Mostrar totales sobre los resultados filtrados cuando se diseñe esa entrega.
- Mantener eliminación lógica, sin eliminar físicamente el histórico.
- Incorporar exportación a Excel en una fase posterior.

El formulario de alta y el de modificación deben reutilizar el mismo componente cuando se implemente.

---

## Numeración de ofertas

La numeración queda aprobada con esta estructura:

`VI + AAAA + MM + "-" + contador global`

Ejemplo:

`VI202609-01019`

Reglas aprobadas:

- El contador es global y no se reinicia al cambiar de mes o año.
- El año y el mes corresponden al momento de creación de la oferta.
- En el cierre definitivo del Excel se tomará el último contador existente en producción.
- PostgreSQL continuará desde el número siguiente.
- El contador debe ser seguro ante creación concurrente de ofertas.
- Un número asignado nunca se reutiliza, aunque la oferta se anule o elimine lógicamente.
- El número se asignará en el primer guardado, no al abrir el formulario.
- Antes del primer guardado, la interfaz podrá mostrar `Se asignará al guardar`.
- El contador se administrará desde un área protegida de Administración, como parámetro o maestro técnico de contadores accesible solo por administradores; no será un CRUD ordinario.
- Debe poder inicializarse explícitamente con el último contador del Excel en el momento del cierre definitivo, antes de habilitar la creación de ofertas en producción.
- Cualquier ajuste excepcional del contador deberá ser administrativo y quedar auditado.
- El sistema nunca permitirá fijar un contador inferior a uno ya utilizado.
- El contador se mostrará con un mínimo de cinco dígitos, pero podrá crecer a seis o más sin detenerse.

Documenta la necesidad futura de una operación transaccional o secuencia segura, pero no escribas todavía su implementación.

---

## Formulario de oferta

### Campos obligatorios para guardar

Una oferta solo podrá guardarse inicialmente si tiene:

- Cliente.
- Prioridad.
- Comercial.
- Fecha.
- Origen.
- PM.
- Descripción.
- Tipo de oferta.
- Importe total.
- Estado.
- Nombre del solicitante.

### Campos opcionales inicialmente

- Implantación.
- Fecha estimada de entrega comercial.
- Fecha estimada de entrega al cliente.
- Todas las jornadas por perfil.
- Jornadas comerciales.
- Fecha estimada de cartera.
- Segmentación.
- Observaciones.
- Idioma.
- Pedido o identificador de Navision, salvo cuando una futura regla de estado lo exija.
- Motivo de cancelación, salvo cuando el estado sea `Anulado`.

### Implantación

En la primera versión, `Implantación` será únicamente un campo de texto opcional y nullable en la oferta.

No debe existir todavía:

- Maestro de implantaciones.
- Validación de implantación.
- Relación con clientes.
- Selector dependiente del cliente.

Visión futura, todavía pendiente de diseño:

- Un cliente podrá tener una o varias implantaciones.
- Una implantación podrá estar asociada a uno o varios clientes.
- Por tanto, la futura relación será muchos a muchos.
- El texto histórico deberá poder migrarse posteriormente al futuro maestro.

No anticipes ese modelo en la primera implementación.

---

## Maestros conocidos

Los maestros deberán ser administrables únicamente por usuarios autorizados. Los registros ya utilizados deberán poder desactivarse, no borrarse físicamente.

Documenta estos maestros:

- Clientes.
- Personas.
- Perfiles profesionales.
- Prioridades.
- Orígenes.
- Tipos de oferta.
- Estados de oferta.
- Segmentaciones.
- Motivos de cancelación.
- Idiomas.

No diseñes Comercial y PM como dos personas independientes. Debe existir un maestro común de personas y cada persona podrá estar habilitada como comercial, PM o ambas cosas.

### Prioridades actuales

- Alta.
- Media.
- Baja.

### Orígenes actuales

- Comercial.
- PM.
- CS.

### Tipos de oferta actuales

- Bolsa de horas.
- Cambio de alcance.
- Proyecto.

### Estados conocidos

- A valorar PM.
- Entregado a comercial.
- Enviado.
- Oferta 90 %.
- Aceptado.
- Desarrollo.
- Entregado.
- Facturado.
- Anulado.
- En revisión.

El maestro de estados deberá poder evolucionar para incluir orden, estado activo, requisitos, carácter terminal y posible porcentaje comercial. Las transiciones permitidas aún no están definidas y deben quedar marcadas como pendientes.

### Segmentaciones conocidas

- Acción: Top desarrollos.
- Evolutivos grandes (>10 k€).
- Evolutivos pequeños (<10 k€).
- Nueva división.
- Nuevo módulo.
- Nuevo país.
- Proyecto VFS.
- Proyecto VSW.
- Upgrade VSW.
- Vertical PBI.

---

## Jornadas por perfil

Perfiles conocidos:

| Código | Nombre |
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

Decisiones aprobadas:

- Los perfiles serán un maestro.
- Las jornadas no se modelarán como una columna fija por perfil en `offers`.
- Se utilizará una relación oferta–perfil–jornadas.
- Una oferta puede guardarse sin jornadas.
- Cuando existan jornadas, el total debe calcularse desde el detalle por perfiles.
- Las jornadas comerciales son un concepto separado y no deben confundirse con las jornadas por perfil.

No fijes todavía reglas de coste o tarifas. Esas reglas corresponderán a ESM y Administración en fases posteriores.

---

## Modelo conceptual mínimo que debe documentarse

Documenta, sin crear todavía migraciones, estas entidades conceptuales:

- User.
- Role.
- Person.
- Client.
- Offer.
- OfferProfileDays.
- ProfessionalProfile.
- OfferType.
- OfferStatus.
- OfferStatusHistory.
- Priority.
- Origin.
- Segmentation.
- CancellationReason.
- Language.
- SystemCounter o mecanismo equivalente.
- AuditLog.
- ImportBatch.
- ImportIssue.

Explica responsabilidades y relaciones principales. No cierres tipos SQL, índices o nombres físicos definitivos si todavía no son necesarios.

Evita duplicar datos derivados:

- Año y mes pueden derivarse de la fecha, aunque pueden conservarse en importación si son necesarios para reconciliar.
- El total de jornadas debe derivarse de las jornadas por perfil.
- Los nombres visibles deben proceder de sus maestros, preservando snapshots históricos cuando sea necesario.

---

## Migración desde SQL Server

La migración se realizará en dos etapas.

### Piloto inicial

- Importar un único mes completo y cerrado.
- El mes exacto todavía está pendiente de decidir.
- Validar clientes, personas, estados, tipos, jornadas, importes, fechas y códigos.
- Verificar listado, filtros y consulta de ofertas migradas.
- Generar informe de incidencias.

### Migración completa futura

- La fuente preferida será SQL Server, no el Excel visible.
- Utilizar un área de staging o proceso equivalente.
- Registrar sistema de origen, identificador original, fecha y lote de importación.
- Hacer el proceso repetible e idempotente.
- No duplicar ofertas al repetir un lote.
- Reconciliar cantidades, códigos e importes.
- Preservar exactamente los códigos históricos.
- No corregir silenciosamente datos históricos.
- Mantener el valor original y registrar las incidencias detectadas.

Incidencias conocidas del histórico que deben documentarse:

- Existen al menos dos códigos de oferta duplicados.
- Los códigos antiguos utilizan letras para representar el mes y los actuales utilizan números.
- Existen algunas ofertas sin cliente relacionado.
- Hay registros en los que el detalle de jornadas no coincide con el total histórico.
- Hay valores antiguos de jornadas claramente anómalos.
- Existen ofertas anuladas sin motivo informado.
- Los idiomas contienen variantes como `ENG`, `ING` y `ESP`.
- La segmentación no aparece correctamente en la tabla visible del Excel, aunque forma parte del sistema de origen.

Los históricos importados no deben descartarse por incumplir validaciones actuales. Deben conservarse y marcar sus incidencias.

---

## Seguridad y datos sensibles

El Excel legado contiene parámetros técnicos y credenciales embebidas. No copies ningún secreto, contraseña, servidor, usuario, cadena de conexión o correo técnico desde el libro legado a la documentación o al repositorio.

Documenta estas reglas:

- Nunca guardar secretos en Git.
- Utilizar variables de entorno o el sistema de secretos que se apruebe para cada entorno.
- Proporcionar únicamente un `.env.example` sin valores reales cuando comience la implementación.
- No incluir datos reales de clientes en fixtures o pruebas.
- Utilizar datos sintéticos o anonimizados.
- Aplicar mínimo privilegio.
- Auditar altas, modificaciones, cambios de estado, ajustes del contador e importaciones.
- Mantener separación entre desarrollo, pruebas y producción.
- Revisar y rotar las credenciales heredadas antes de poner la nueva plataforma en producción.

---

## Decisiones todavía pendientes

Registra claramente como pendientes, sin resolverlas por tu cuenta:

- Si `Importe total = 0` es válido o debe ser siempre superior a cero.
- Flujo y transiciones permitidas entre estados.
- Estados que obligan a informar el identificador o pedido de Navision.
- Momento y destinatarios de los correos automáticos.
- Mes que se usará para el piloto de migración.
- Roles y permisos concretos de los usuarios no administradores.
- Proveedor o mecanismo definitivo de autenticación.
- Infraestructura y estrategia de despliegue.
- Política de edición de ofertas históricas importadas.
- Modelo definitivo de implantaciones y su relación muchos a muchos con clientes.
- Tarifas, costes, márgenes y reglas de ESM.

Usa etiquetas claras como `APROBADO`, `PENDIENTE`, `PLANIFICADO` e `IMPLEMENTADO` para distinguir el estado de cada decisión cuando sea útil.

---

## Estructura documental que debes crear

Puedes ajustar nombres menores si existe una razón clara, pero mantén una estructura compacta, navegable y sin duplicaciones:

```text
README.md
AGENTS.md
CLAUDE.md
CHANGELOG.md
prompts/
  README.md
  0001-cimentacion-documental.md
docs/
  INDEX.md
  PROJECT_STATUS.md
  product/
    VISION.md
    SCOPE.md
    ROADMAP.md
  architecture/
    ARCHITECTURE.md
    DATA_MODEL.md
    SECURITY.md
  shared/
    MASTER_DATA.md
  offers/
    OVERVIEW.md
    FIELDS.md
    BUSINESS_RULES.md
    STATUSES.md
    MIGRATION.md
  decisions/
    DECISIONS.md
```

### Responsabilidad de cada documento

- `README.md`: entrada breve al proyecto, estado actual, cómo navegar por la documentación y qué no está implementado.
- `AGENTS.md`: reglas canónicas para cualquier agente que trabaje en el repositorio.
- `CLAUDE.md`: instrucciones específicas para Claude Code y referencia obligatoria a `AGENTS.md`.
- `CHANGELOG.md`: historial de entregas, comenzando por esta cimentación documental.
- `prompts/README.md`: convención de nombres y conservación de prompts.
- `prompts/0001-cimentacion-documental.md`: copia fiel y útil de este encargo.
- `docs/INDEX.md`: índice documental y orden recomendado de lectura.
- `docs/PROJECT_STATUS.md`: estado del proyecto, última entrega, siguiente objetivo y decisiones pendientes.
- `VISION.md`: visión de Vincle Apps y módulos futuros.
- `SCOPE.md`: alcance actual y fuera de alcance.
- `ROADMAP.md`: fases de alto nivel sin fechas inventadas.
- `ARCHITECTURE.md`: arquitectura propuesta y principios.
- `DATA_MODEL.md`: modelo conceptual, relaciones y responsabilidades.
- `SECURITY.md`: seguridad, secretos y datos sensibles.
- `MASTER_DATA.md`: maestros compartidos y reglas de activación/desactivación.
- Documentos de `offers/`: especificación funcional del Gestor de Ofertas.
- `DECISIONS.md`: registro de decisiones aprobadas y pendientes, con identificadores estables.

No repitas toda la información en todos los archivos. Cada regla debe tener una ubicación canónica y los demás documentos deben enlazarla.

---

## Reglas permanentes de colaboración que deben quedar incrustadas

Estas reglas son obligatorias y deben aparecer claramente en `AGENTS.md`, `CLAUDE.md`, `prompts/README.md` y, cuando corresponda, en el flujo descrito en `README.md`:

1. El usuario actúa como Product Owner y realiza la validación funcional manual.
2. ChatGPT ayuda a analizar, diseñar y preparar especificaciones y prompts Markdown.
3. Claude Code actúa como programador sobre el repositorio.
4. Todos los encargos entregados a Claude Code deben conservarse como archivos `.md` dentro de `prompts/`.
5. Cada entrega debe partir de `main` actualizado y trabajar en una rama nueva.
6. Cada entrega debe crear una Pull Request.
7. Claude Code nunca debe fusionar la Pull Request.
8. El usuario revisará, probará y fusionará manualmente.
9. No se debe hacer push directo a `main`.
10. Cada entrega debe limitarse estrictamente al alcance solicitado.
11. Claude Code no debe anticipar módulos o funcionalidades futuras.
12. No debe inventar reglas de negocio. Las dudas materiales deben quedar documentadas o preguntarse.
13. La calidad del código y de la documentación debe ser máxima aunque la entrega sea pequeña.
14. Las pruebas automatizadas deben ser mínimas, acotadas y relevantes para la entrega.
15. No deben añadirse suites extensas, pruebas redundantes o validaciones costosas sin petición expresa.
16. El usuario realizará pruebas funcionales manuales de todo lo implantado.
17. Cada entrega futura deberá actualizar la documentación afectada, `CHANGELOG.md` y `docs/PROJECT_STATUS.md`.
18. El repositorio debe contener contexto suficiente para que una sesión futura pueda continuar leyendo únicamente el propio repositorio.
19. La documentación funcional se redactará en español.
20. Los identificadores de código y nombres técnicos podrán estar en inglés cuando corresponda.
21. Nunca se incluirán credenciales, datos sensibles ni datos reales de clientes en prompts, commits, fixtures o documentación.
22. Ante un conflicto entre una instrucción puntual y la documentación canónica, se debe señalar la contradicción antes de modificar una regla aprobada.

Redacta estas reglas de manera operativa, no como una declaración genérica de intenciones.

---

## Calidad documental

- Redacta en español claro y profesional.
- Utiliza Markdown válido.
- Mantén documentos relativamente pequeños y especializados.
- Incluye enlaces relativos entre documentos.
- Evita duplicaciones.
- No uses lenguaje publicitario.
- No inventes fechas, responsables o infraestructura.
- Diferencia hechos confirmados, decisiones aprobadas, propuestas y cuestiones pendientes.
- Usa ejemplos sintéticos, nunca clientes o credenciales reales.
- Asegura que los nombres `Vincle Apps`, `v-apps`, `Gestor de Ofertas`, `ESM` y `FACT` se utilicen consistentemente.

---

## Ejecución Git obligatoria

1. Comprueba el estado del repositorio.
2. Sitúate en `main` y actualízala mediante fast-forward.
3. Crea una rama nueva con un nombre similar a:

   `docs/project-foundation`

4. Realiza exclusivamente los cambios documentales descritos.
5. Revisa el diff completo.
6. Ejecuta validaciones ligeras y pertinentes para Markdown.
7. Comprueba como mínimo:
   - `git diff --check`.
   - Que no haya enlaces relativos evidentemente rotos.
   - Que no se hayan añadido secretos ni valores sensibles.
   - Que no se haya añadido código o configuración ejecutable fuera de alcance.
8. Realiza el commit.
9. Publica la rama.
10. Crea una Pull Request con un título similar a:

    `docs: establish Vincle Apps project foundation`

11. La descripción de la PR debe incluir:
    - Objetivo.
    - Documentos creados.
    - Decisiones registradas.
    - Decisiones pendientes.
    - Validaciones realizadas.
    - Confirmación de que no se ha implementado código.
12. Deja la PR abierta.
13. **No fusiones la PR bajo ninguna circunstancia.**

Si la autenticación o los permisos impiden crear la PR, no improvises ni fusiones. Deja la rama publicada si es posible e informa exactamente del bloqueo y del comando o paso que debe ejecutar el usuario.

---

## Criterios de aceptación

La entrega estará terminada únicamente si:

- Existe una base documental coherente y navegable.
- El repositorio explica qué es Vincle Apps y cuál es su estado actual.
- El Gestor de Ofertas está documentado con el alcance conocido.
- Las decisiones aprobadas y pendientes están claramente separadas.
- La numeración global queda documentada sin ambigüedad.
- Los campos obligatorios y opcionales están documentados.
- Implantación figura como texto opcional en la primera versión y como modelo futuro pendiente.
- Los perfiles y jornadas están modelados conceptualmente de forma extensible.
- La estrategia de migración piloto y completa está documentada.
- Las reglas de seguridad impiden reproducir las credenciales del Excel legado.
- Las reglas permanentes de trabajo con Claude Code están fijadas.
- Este prompt queda guardado en `prompts/0001-cimentacion-documental.md`.
- No se ha generado código de aplicación.
- Se ha creado una PR abierta y no se ha fusionado.

---

## Respuesta final esperada

Al terminar, responde con:

1. Resumen breve de lo realizado.
2. Lista de archivos creados o modificados.
3. Decisiones principales documentadas.
4. Validaciones ejecutadas y resultado.
5. URL de la Pull Request.
6. Confirmación explícita: `PR creada y dejada sin fusionar`.
7. Bloqueos o preguntas pendientes, si existen.

No propongas empezar a implementar código dentro de esta misma PR.
