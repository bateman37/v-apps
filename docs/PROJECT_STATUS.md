# Estado del proyecto

## Última entrega

**Cierre funcional del Gestor de Ofertas, autenticación local y notificaciones** (prompt [`prompts/0004-cierre-gestor-ofertas-autenticacion-notificaciones.md`](../prompts/0004-cierre-gestor-ofertas-autenticacion-notificaciones.md)).

Una persona no técnica puede ya crear un administrador, iniciar sesión, crear una oferta sin perder datos ante un error, consultar quién y cuándo cambió qué, comentar y adjuntar documentación, archivar y recuperar una oferta, revisar las pendientes de su bandeja, recibir notificaciones internas y exportar el listado a Excel.

## Estado de implementación

### Implementado

- **Autenticación local provisional** (`DEC-019`, `DEC-055`): login, sesión por cookie `HttpOnly`, cambio de contraseña obligatorio en el primer acceso, roles `ADMIN`/`USER` con permisos comprobados en servidor, y administración de usuarios (`/admin/users`).
- **Código de cliente** (`DEC-021`) obligatorio y único, con clientes heredados de DEV-003 marcados «Código pendiente».
- **Auditoría atribuible** en toda mutación relevante, y **versiones inmutables** de oferta con comparación de campos y jornadas.
- **Comentarios internos** y **adjuntos locales** (25 MB máximo, formatos cerrados, descarga autenticada), sin exponer nunca la ruta física en disco.
- **Archivo lógico y recuperación** de ofertas (`DEC-016`), con vista «Ofertas archivadas» que comparte filtros y exportación con el listado ordinario.
- **Bandeja «Pendiente de revisión»**, flujo de estados (`DEC-051`) y pedido de Navision obligatorio en `Aceptado` (`DEC-052`).
- **Centro de notificaciones internas** y administración de reglas de notificación (`DEC-053`, parcial: sin envío de email real).
- **Exportación a Excel** del listado, en tres hojas, con los mismos filtros y permisos (`DEC-032`).
- **Administración protegida del contador** de numeración (`DEC-012`).
- Todo lo ya implementado en DEV-002 y DEV-003: identidad visual, administración de maestros, modelo transaccional de ofertas, numeración global, listado con búsqueda/filtros/orden/paginación, jornadas por perfil, importe cero válido (`DEC-020`).

### Aprobado pero todavía no implementado

- Inicialización del contador con el último valor del Excel legado, necesaria antes del corte real (parte de `DEC-012`).
- `DEC-018`/`DEC-054`: migración del histórico desde SQL Server.
- Pantalla dedicada de comparación de versiones más allá del histórico de estados ya visible en la ficha (la consulta ya existe: `getOfferVersionSnapshots`).

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
