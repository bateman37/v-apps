# Estado del proyecto

## Última entrega

**Primer flujo operativo del Gestor de Ofertas y branding Vincle** (prompt [`prompts/0003-flujo-operativo-ofertas-branding-vincle.md`](../prompts/0003-flujo-operativo-ofertas-branding-vincle.md)).

Una persona no técnica puede ya arrancar la aplicación en local y completar el recorrido entero sin tocar PostgreSQL: crear un cliente y las personas, crear una oferta, recibir su número automático, encontrarla en el listado, abrirla y modificarla.

## Estado de implementación

### Implementado

- **Identidad visual de Vincle**: tokens semánticos centralizados con el azul `#1F18C0`, el negro corporativo y el mostaza `#DBBA12` como acento (~10 %), pila tipográfica preparada para Gilroy con alternativa de respaldo, y requisitos de accesibilidad. Ver [`design/BRAND_UI.md`](design/BRAND_UI.md).
- **Administración operativa**: clientes (`/admin/clients`), personas (`/admin/people`) y los ocho catálogos (`/admin/master-data`), con alta, edición y activación/desactivación. Sin borrado físico en ningún caso.
- **Modelo transaccional**: `Client`, `Person`, `Offer`, `OfferProfileDays`, `OfferStatusHistory`, `SystemCounter` y `AuditLog`, con migración acumulativa y no destructiva.
- **Numeración global** `VI`+`AAAA`+`MM`+`-`+contador, atómica y segura ante altas concurrentes, inmutable al modificar.
- **Flujo de ofertas**: listado con búsqueda, filtros combinables, ordenación y paginación resueltos en PostgreSQL; alta (`/offers/new`), consulta (`/offers/[id]`) y modificación (`/offers/[id]/edit`) compartiendo componente y reglas.
- **Jornadas por perfil** derivadas, nunca almacenadas como total, y jornadas comerciales como campo separado.
- **Histórico de estados** sin eventos duplicados y **auditoría mínima** de ofertas, clientes, personas y catálogos.
- **Importe cero válido** (`DEC-020`), con importe negativo rechazado.

### Aprobado pero todavía no implementado

- `DEC-012`: pantalla protegida de ajuste del contador de numeración. Sin autenticación no podría considerarse protegida.
- Inicialización del contador con el último valor del Excel legado, necesaria antes del corte real.
- `DEC-016`: `deletedAt` existe y el listado ya excluye los registros eliminados, pero no se expone borrado lógico desde la interfaz.
- `DEC-018`: migración del histórico desde SQL Server.
- `DEC-032`: exportación a Excel.

### Pendiente de decisión

`DEC-051` (flujo y transiciones entre estados), `DEC-052` (estados que exigen pedido de Navision), `DEC-053` (correos automáticos), `DEC-054` (mes del piloto de migración), `DEC-055` (roles y permisos), `DEC-056` (mecanismo de autenticación), `DEC-057` (infraestructura y despliegue), `DEC-058` (edición de históricos importados), `DEC-059` (modelo de implantaciones) y `DEC-060` (tarifas, costes y márgenes). Ninguna se ha resuelto en esta entrega.

`DEC-050` ha dejado de estar pendiente: el Product Owner la resolvió expresamente y se ha sustituido por `DEC-020`.

### Limitaciones por ausencia de autenticación (`DEC-019`)

- La aplicación es **únicamente apta para desarrollo local**. No debe exponerse en red ni usarse con datos reales.
- Las pantallas de Administración no tienen ninguna restricción real de acceso.
- La auditoría y el histórico de estados registran siempre `actorId = null`: se sabe qué cambió y cuándo, pero no quién.

## Próximo objetivo

A decidir por el Product Owner tras validar esta entrega. Candidatos naturales, por orden de dependencia:

1. Autenticación y autorización (`DEC-056` y `DEC-055`), que desbloquean la pantalla protegida del contador (`DEC-012`) y la atribución real de la auditoría.
2. Flujo de estados (`DEC-051`) y estados que exigen pedido de Navision (`DEC-052`).
3. Piloto de migración del histórico (`DEC-054`, `DEC-018`).

## Historial

Ver [`../CHANGELOG.md`](../CHANGELOG.md) para el registro completo de entregas.
