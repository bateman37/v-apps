# Estado del proyecto

## Última entrega

**Hotfix de usabilidad del Gestor de Ofertas y notificaciones** (prompt [`prompts/0005-hotfix-usabilidad-ofertas-notificaciones.md`](../prompts/0005-hotfix-usabilidad-ofertas-notificaciones.md)), sobre el cierre funcional de DEV-004 (prompt [`prompts/0004-cierre-gestor-ofertas-autenticacion-notificaciones.md`](../prompts/0004-cierre-gestor-ofertas-autenticacion-notificaciones.md)).

Corrige un error bloqueante al adjuntar archivos, simplifica el producto (selectores de cliente solo por nombre, sin `Idioma`, sin archivo lógico de ofertas), mejora filtros y navegación (rango de fechas, estados multiselección, filas progresivas en reglas de notificación, panel de notificaciones como entrada principal) y unifica Personas y Usuarios en una sola pantalla de Administración.

## Estado de implementación

### Implementado

- **Autenticación local provisional** (`DEC-019`, `DEC-055`): login, sesión por cookie `HttpOnly`, cambio de contraseña obligatorio en el primer acceso, roles `ADMIN`/`USER` con permisos comprobados en servidor. Un `USER` aterriza en `/notificaciones`; un `ADMIN`, en `/offers` (hotfix DEV-005).
- **«Personas y accesos»** (`DEC-065`, hotfix DEV-005): pantalla única de Administración (`/admin/people`) para el maestro de personas y sus cuentas de acceso, que siguen siendo entidades separadas; `/admin/users` redirige aquí.
- **Código de cliente** (`DEC-021`) obligatorio y único, con clientes heredados de DEV-003 marcados «Código pendiente»; desde el hotfix DEV-005 los selectores operativos muestran solo el nombre (`DEC-062`).
- **Auditoría atribuible** en toda mutación relevante, y **versiones inmutables** de oferta con comparación de campos y jornadas (sin `Idioma` en las instantáneas nuevas, `DEC-063`).
- **Comentarios internos** y **adjuntos locales** (25 MB máximo, formatos cerrados, descarga autenticada), sin exponer nunca la ruta física en disco. El hotfix DEV-005 corrige un error bloqueante que impedía adjuntar (conflicto `encType`/Server Action) y da margen de transporte suficiente para el límite funcional de 25 MB.
- **Sin archivo lógico de ofertas** (`DEC-016b`, hotfix DEV-005, sustituye a `DEC-016`): toda oferta, incluida `Anulado`, es siempre localizable, filtrable y exportable; no hay «Archivar»/«Recuperar» ni vista separada de archivadas.
- **Filtros del listado** (`DEC-064`, hotfix DEV-005): rango de fechas `Desde`/`Hasta` sobre `offerDate` y estados en multiselección, persistentes en URL, paginación, orden y exportación.
- **Bandeja «Pendiente de revisión»**, flujo de estados (`DEC-051`) y pedido de Navision obligatorio en `Aceptado` (`DEC-052`).
- **Centro de notificaciones internas**, ahora entrada principal del menú antes del Gestor de Ofertas, y administración de reglas de notificación con filas progresivas (`DEC-053`, parcial: sin envío de email real).
- **Exportación a Excel** del listado, en tres hojas, con los mismos filtros y permisos (`DEC-032`), sin columnas `Idioma` ni `Archivada`.
- **Administración protegida del contador** de numeración (`DEC-012`).
- Todo lo ya implementado en DEV-002 y DEV-003: identidad visual, administración de maestros (siete catálogos vigentes; `Idioma` deprecado), modelo transaccional de ofertas, numeración global, jornadas por perfil, importe cero válido (`DEC-020`).

### Aprobado pero todavía no implementado

- Inicialización del contador con el último valor del Excel legado, necesaria antes del corte real (parte de `DEC-012`).
- `DEC-018`/`DEC-054`: migración del histórico desde SQL Server.
- Pantalla dedicada de comparación de versiones más allá del histórico de estados ya visible en la ficha (la consulta ya existe: `getOfferVersionSnapshots`).
- Limpieza física de la tabla `Language` y de `Offer.languageId`, y de las columnas técnicas de archivo de oferta (`deletedAt`, `archivedById`, `restoredAt`, `restoredById`), todas deprecadas desde el hotfix DEV-005: pendiente hasta confirmar la ausencia de datos relevantes.

### Pendiente de decisión

`DEC-054` (mes del piloto de migración), `DEC-056` (mecanismo de autenticación corporativo definitivo), `DEC-057` (infraestructura y despliegue), `DEC-058` (edición de históricos importados), `DEC-059` (modelo de implantaciones), `DEC-060` (tarifas, costes y márgenes de ESM) y `DEC-061` (proveedor real de email). Ninguna se ha resuelto en esta entrega.

`DEC-050`, `DEC-055` y `DEC-053` ya no están pendientes: se han resuelto en DEV-003 y DEV-004 respectivamente (ver [`decisions/DECISIONS.md`](decisions/DECISIONS.md)).

### Limitaciones vigentes de la autenticación local (`DEC-019`)

- La aplicación es **únicamente apta para desarrollo local**. No hay SSO ni email real; no debe exponerse en red ni usarse con datos reales.
- La auditoría y el histórico anteriores al login conservan `actorId = null`, mostrados como «Usuario no disponible (registro anterior al login)»: no se reescribe el pasado.

## Próximo objetivo

A decidir por el Product Owner tras validar esta entrega. Candidatos naturales, por orden de dependencia:

1. Piloto de migración del histórico (`DEC-054`, `DEC-018`), una vez decidido el mes de corte.
2. Proveedor de autenticación corporativa definitiva (`DEC-056`) e infraestructura de despliegue (`DEC-057`), antes de considerar la aplicación apta para más que uso local.
3. Proveedor real de email (`DEC-061`) para activar de verdad el canal «Interna + email» de las reglas de notificación.

## Historial

Ver [`../CHANGELOG.md`](../CHANGELOG.md) para el registro completo de entregas.
