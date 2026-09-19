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

### Auditoría implementada

`AuditLog` registra, dentro de la misma transacción que el dato auditado: alta y modificación de ofertas, cambios de estado, revisiones, archivo y recuperación, comentarios, alta y retirada de adjuntos, gestión de usuarios, reglas de notificación y ajustes del contador, además de lo ya existente desde DEV-003 (clientes, personas y catálogos).

Cada entrada guarda el tipo de entidad, el identificador, la acción, la fecha, el actor (desde DEV-004) y una representación estructurada de los campos que cambian (`{ campo: { antes, despues } }`). Solo se guardan valores de negocio: nunca credenciales, contraseñas, hashes, tokens de sesión, cookies, contenido binario ni rutas físicas del servidor.

**Registros anteriores al login**: los eventos creados antes de DEV-004 conservan `actorId = null` y se muestran como «Usuario no disponible (registro anterior al login)». No se reescribe el pasado ni se inventa un actor.

### Autenticación local provisional (DEV-004)

El Product Owner ha aprobado una autenticación local provisional, no el mecanismo corporativo definitivo (ver `DEC-019` y `DEC-056` en [`../decisions/DECISIONS.md`](../decisions/DECISIONS.md)):

- **Contraseñas**: hash con `scrypt` (parámetros de coste embebidos en el propio hash, sal aleatoria de 16 bytes, comparación en tiempo constante). Nunca se guarda la contraseña en claro, ni se envía el hash al cliente, ni se registra en auditoría o logs.
- **Sesión**: token aleatorio de 256 bits; solo se persiste su hash SHA-256. Viaja en una cookie `HttpOnly`, `SameSite=Lax` y `Secure` en producción. Cerrar sesión borra la fila; un usuario desactivado pierde sus sesiones de inmediato.
- **Autorización**: cada página protegida llama a `requireUser()`/`requireAdmin()`, y cada Server Action vuelve a comprobar la sesión y el permiso — nunca se confía en que la interfaz oculte un botón. `canAccessOffer` aplica el mismo criterio (DEC-055) en el listado, la ficha, las mutaciones, los adjuntos y la exportación.
- **Administrador inicial**: `scripts/bootstrap-admin.ts` crea la cuenta a partir de variables de entorno (`ADMIN_BOOTSTRAP_USERNAME`/`ADMIN_BOOTSTRAP_PASSWORD`), nunca embebidas en el código; es idempotente y nunca restablece una contraseña ya establecida. La primera contraseña obliga a cambiarla en el primer acceso.
- **Contraseñas temporales**: solo se muestran una vez, en el resultado inmediato de la acción que las genera (`/admin/users`); no se guardan para poder volver a mostrarlas.
- **Mensajes de login**: siempre el mismo mensaje genérico, exista o no la cuenta, con un coste de verificación equivalente en ambos casos, para no revelar qué usuarios existen.

**La aplicación sigue siendo únicamente apta para desarrollo local**, ahora con el aviso `Entorno local · autenticación local provisional`. No debe exponerse en una red accesible ni usarse con datos reales de clientes o empleados hasta que exista un mecanismo de autenticación corporativo definitivo (`DEC-056`, pendiente) y una infraestructura de despliegue aprobada (`DEC-057`, pendiente).

### Adjuntos de oferta (DEV-004)

- El directorio de almacenamiento se configura por variable de entorno (`ATTACHMENTS_STORAGE_PATH`), vive fuera de `public/` y nunca se expone al cliente.
- El nombre físico es un identificador aleatorio, nunca el nombre original: evita colisiones, nombres reservados y cualquier intento de recorrido de rutas a partir de un nombre hostil.
- Se valida en servidor tamaño (máximo 25 MB), extensión y, cuando es fiable, el tipo MIME; nunca se confía solo en lo que declara el navegador.
- La descarga pasa siempre por una ruta autenticada y autorizada (`canAccessOffer`) que hace streaming del contenido, con cabeceras `Content-Disposition`, `X-Content-Type-Options: nosniff` y `Cache-Control: private, no-store`; nunca se sirve como archivo estático.
- Si la base de datos falla después de escribir el fichero, el fichero se elimina para no dejar un binario huérfano sin metadatos que lo referencien.

## Relación con la migración de datos

Las reglas específicas sobre cómo tratar los datos históricos del Excel/SQL Server durante la migración —sin exponer sus credenciales ni sus datos técnicos— están detalladas en [`../offers/MIGRATION.md`](../offers/MIGRATION.md).
