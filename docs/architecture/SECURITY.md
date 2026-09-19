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

La entrega de base técnica del Gestor de Ofertas (DEV-002) introduce el primer código y la primera base de datos real del proyecto. Se han aplicado ya estas reglas: `.env` está excluido del repositorio, `.env.example` solo contiene una cadena de conexión sintética, y no se han incluido credenciales ni datos reales de clientes o empleados.

### Autenticación pospuesta (decisión temporal aprobada)

El Product Owner ha decidido posponer la autenticación (ver `DEC-019` en [`../decisions/DECISIONS.md`](../decisions/DECISIONS.md)). Mientras esta decisión siga vigente:

- La aplicación no implementa login, usuarios, contraseñas, sesiones ni roles.
- No existe ningún usuario administrador temporal ni bypass de autenticación.
- La interfaz muestra de forma visible el aviso `Entorno local · autenticación pendiente`.
- **La aplicación es únicamente apta para desarrollo local.** No debe exponerse en una red accesible ni usarse en producción, ni conectarse a datos reales de clientes o empleados, hasta que exista un mecanismo definitivo de autenticación y autorización (decisión pendiente `DEC-056`).

## Relación con la migración de datos

Las reglas específicas sobre cómo tratar los datos históricos del Excel/SQL Server durante la migración —sin exponer sus credenciales ni sus datos técnicos— están detalladas en [`../offers/MIGRATION.md`](../offers/MIGRATION.md).
