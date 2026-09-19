# Seguridad y datos sensibles

## Origen de esta política

El Excel legado del Gestor de Ofertas contiene parámetros técnicos y credenciales embebidas (conexiones, usuarios, servidores). **Ninguno de esos valores se ha copiado ni se copiará** a este repositorio, a la documentación, ni a ningún prompt conservado en [`../../prompts/`](../../prompts/README.md).

## Reglas de seguridad

1. Nunca se guardan secretos en Git: contraseñas, cadenas de conexión, tokens, claves de API o credenciales de ningún tipo.
2. La configuración sensible se gestiona mediante variables de entorno o el sistema de secretos que se apruebe para cada entorno, nunca embebida en el código o en archivos versionados.
3. Cuando comience la implementación, el repositorio proporcionará únicamente un `.env.example` con las claves necesarias y sin valores reales.
4. No se incluyen datos reales de clientes en fixtures, datos de prueba o ejemplos de documentación. Se usan datos sintéticos o anonimizados.
5. Se aplica el principio de mínimo privilegio en el acceso a datos y funcionalidades.
6. Se auditan como mínimo: altas y modificaciones de ofertas, cambios de estado, ajustes del contador de numeración, e importaciones de datos históricos (ver `AuditLog` en [`DATA_MODEL.md`](DATA_MODEL.md)).
7. Se mantienen entornos separados de desarrollo, pruebas y producción, sin compartir datos ni credenciales entre ellos.
8. Antes de poner la nueva plataforma en producción, se deben revisar y rotar las credenciales heredadas del sistema legado (Excel/SQL Server).

## Aplicación en esta entrega

`.env` está excluido del repositorio, `.env.example` solo contiene una cadena de conexión sintética, y no se han incluido credenciales ni datos reales de clientes o empleados. La carga inicial (`prisma/seed.ts`) no crea ningún cliente, persona ni oferta de ejemplo.

### Errores sin información sensible (DEV-003)

Ningún error de PostgreSQL se muestra tal cual en la interfaz. `src/lib/db/errors.ts` traduce los errores conocidos de Prisma a mensajes en español (registro duplicado, referencia inexistente, base de datos no disponible) y devuelve un mensaje genérico para el resto. El detalle técnico —que podría contener la cadena de conexión, el SQL ejecutado o una traza— se registra únicamente en la consola del servidor de desarrollo.

### Auditoría implementada (DEV-003)

`AuditLog` registra, dentro de la misma transacción que el dato auditado:

- Alta y modificación de ofertas, y cambio de estado como evento propio.
- Alta, modificación y activación/desactivación de clientes, personas y registros de los ocho catálogos.

Cada entrada guarda el tipo de entidad, el identificador, la acción, la fecha y una representación estructurada de los campos que cambian (`{ campo: { antes, despues } }`). Solo se guardan valores de negocio: nunca credenciales, cadenas de conexión ni detalles técnicos del motor.

**Limitación conocida de atribución**: mientras no exista autenticación, `actorId` es siempre `null`, tanto en `AuditLog` como en `OfferStatusHistory`. No se inventa ningún usuario `admin`, `system` ni identidad temporal, de modo que en esta fase se sabe **qué** cambió y **cuándo**, pero no **quién** lo cambió. Quedan pendientes de auditar los ajustes del contador de numeración y las importaciones, porque todavía no existen.

### Administración sin autorización real (DEV-003)

Las pantallas `/admin/clients`, `/admin/people` y `/admin/master-data` permiten modificar los maestros y **no tienen ninguna restricción de acceso**: cualquiera que abra la aplicación puede usarlas. Cada una muestra un aviso explícito. La restricción real a administradores depende de `DEC-055` y `DEC-056`, ambas pendientes. No se ha creado ningún administrador temporal ni ningún bypass de autenticación.

### Autenticación pospuesta (decisión temporal aprobada)

El Product Owner ha decidido posponer la autenticación (ver `DEC-019` en [`../decisions/DECISIONS.md`](../decisions/DECISIONS.md)). Mientras esta decisión siga vigente:

- La aplicación no implementa login, usuarios, contraseñas, sesiones ni roles.
- No existe ningún usuario administrador temporal ni bypass de autenticación.
- La interfaz muestra de forma visible el aviso `Entorno local · autenticación pendiente`.
- **La aplicación es únicamente apta para desarrollo local.** No debe exponerse en una red accesible ni usarse en producción, ni conectarse a datos reales de clientes o empleados, hasta que exista un mecanismo definitivo de autenticación y autorización (decisión pendiente `DEC-056`).

## Relación con la migración de datos

Las reglas específicas sobre cómo tratar los datos históricos del Excel/SQL Server durante la migración —sin exponer sus credenciales ni sus datos técnicos— están detalladas en [`../offers/MIGRATION.md`](../offers/MIGRATION.md).
