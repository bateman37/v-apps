-- DEV-005: hotfix de usabilidad del Gestor de Ofertas.
--
-- Esta migración es de DATOS, no de esquema: no se añade, modifica ni borra
-- ninguna columna ni tabla. `Offer.deletedAt`, `Offer.archivedById`,
-- `Offer.restoredAt`, `Offer.restoredById`, la tabla `languages` y
-- `Offer.languageId` quedan deprecados y sin uso funcional (ver el
-- comentario de `Language` en `schema.prisma` y `docs/decisions/DECISIONS.md`,
-- DEC-016), pero se conservan físicamente para no ejecutar una migración
-- destructiva sobre datos ya existentes.

-- 1) Recupera automáticamente cualquier oferta archivada durante DEV-004: el
--    concepto funcional de "oferta archivada" desaparece, así que toda oferta
--    vuelve al listado ordinario conservando su número y el resto de sus
--    datos. `restoredAt`/`restoredById` no se tocan: si una oferta ya había
--    sido recuperada antes de esta migración, ese hecho histórico se
--    conserva tal cual.
UPDATE "offers"
   SET "deleted_at" = NULL,
       "archived_by_id" = NULL
 WHERE "deleted_at" IS NOT NULL;

-- 2) La condición `ARCHIVED` deja de poder crearse desde Administración >
--    Reglas de notificación. Ninguna regla existente que ya la use se amplía
--    en silencio quitándole esa condición: se desactiva de forma segura para
--    que un administrador la revise y decida cómo continuar, en lugar de
--    reinterpretarla o borrarla. Las condiciones y la propia regla se
--    conservan íntegras.
UPDATE "notification_rules"
   SET "is_active" = false
 WHERE "id" IN (
   SELECT DISTINCT "rule_id"
     FROM "notification_rule_conditions"
    WHERE "field" = 'ARCHIVED'
 )
   AND "is_active" = true;
