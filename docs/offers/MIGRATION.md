# Gestor de Ofertas — migración desde SQL Server

La migración se realiza en dos etapas.

## Piloto inicial

- Importar un único mes completo y cerrado.
- El mes exacto está **pendiente de decidir** (ver [`../decisions/DECISIONS.md`](../decisions/DECISIONS.md)).
- Validar clientes, personas, estados, tipos, jornadas, importes, fechas y códigos.
- Verificar listado, filtros y consulta de las ofertas migradas.
- Generar un informe de incidencias.

## Migración completa futura

- La fuente preferida es **SQL Server**, no el Excel visible al usuario.
- Se utiliza un área de staging o un proceso equivalente antes de cargar los datos definitivos.
- Se registra sistema de origen, identificador original, fecha y lote de importación (`ImportBatch`, ver [`../architecture/DATA_MODEL.md`](../architecture/DATA_MODEL.md)).
- El proceso debe ser repetible e idempotente: repetir un lote no debe duplicar ofertas.
- Se reconcilian cantidades, códigos e importes entre origen y destino.
- Los códigos históricos se preservan exactamente, sin normalizarlos.
- No se corrigen silenciosamente datos históricos incorrectos: se mantiene el valor original y se registra la incidencia detectada (`ImportIssue`).
- Los registros históricos importados no se descartan por incumplir las validaciones actuales del formulario (ver [`FIELDS.md`](FIELDS.md)): se conservan y se marcan sus incidencias.

## Incidencias conocidas del histórico

Estas incidencias deben tenerse en cuenta al diseñar la reconciliación e importación, sin resolverlas de forma unilateral:

- Existen al menos dos códigos de oferta duplicados.
- Los códigos antiguos usan letras para representar el mes; los actuales usan números.
- Existen ofertas sin cliente relacionado.
- Hay registros en los que el detalle de jornadas no coincide con el total histórico.
- Hay valores antiguos de jornadas claramente anómalos.
- Existen ofertas anuladas sin motivo de cancelación informado.
- Los idiomas contienen variantes como `ENG`, `ING` y `ESP`, que deberán normalizarse contra el maestro de idiomas sin perder la trazabilidad del valor original.
- La segmentación no aparece correctamente en la tabla visible del Excel, aunque forma parte del sistema de origen (SQL Server).

## Relación con la numeración

En el cierre definitivo del Excel se toma el último contador existente en producción como punto de partida de la numeración en PostgreSQL. Ver el detalle completo en [`BUSINESS_RULES.md`](BUSINESS_RULES.md).

## Seguridad durante la migración

Ningún parámetro técnico o credencial del sistema legado (Excel/SQL Server) se traslada al nuevo sistema como dato de aplicación ni se documenta en este repositorio. Ver [`../architecture/SECURITY.md`](../architecture/SECURITY.md).
