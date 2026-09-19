"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { toSafeErrorMessage } from "@/lib/db/errors";
import { normalizeSpaces } from "@/lib/text";
import { readString } from "@/lib/validation";
import { recordAudit } from "@/modules/audit/audit";
import {
  adminError,
  adminSuccess,
  type AdminActionState,
} from "@/modules/admin/action-state";
import { requireAdmin } from "@/modules/auth/session";
import type { NotificationTrigger } from "@/modules/notifications/rules";

const MAX_ROWS = 4;
const NAME_MAX_LENGTH = 150;
const DESCRIPTION_MAX_LENGTH = 500;

const TRIGGERS: NotificationTrigger[] = [
  "OFFER_CREATED",
  "OFFER_STATUS_CHANGED",
  "OFFER_COMMENT_ADDED",
  "OFFER_ATTACHMENT_ADDED",
  "OFFER_PENDING_PM_REVIEW",
  "OFFER_PENDING_SALES_REVIEW",
];

const CONDITION_FIELDS = [
  "STATUS",
  "PROJECT_MANAGER",
  "COMMERCIAL",
  "CREATOR",
  "CLIENT",
] as const;
const CONDITION_OPERATORS = ["IS", "IS_NOT"] as const;
const RECIPIENT_KINDS = [
  "PROJECT_MANAGER",
  "COMMERCIAL",
  "CREATOR",
  "ALL_ADMINS",
  "SPECIFIC_PERSON",
] as const;

type ConditionField = (typeof CONDITION_FIELDS)[number];
type ConditionOperator = (typeof CONDITION_OPERATORS)[number];
type RecipientKind = (typeof RECIPIENT_KINDS)[number];

type ParsedCondition = {
  group: "ALL" | "ANY";
  field: ConditionField;
  operator: ConditionOperator;
  statusId: string | null;
  personId: string | null;
  clientId: string | null;
  booleanValue: boolean | null;
};

type ParsedAction = { kind: RecipientKind; personId: string | null };

function isConditionField(value: string): value is ConditionField {
  return (CONDITION_FIELDS as readonly string[]).includes(value);
}
function isOperator(value: string): value is ConditionOperator {
  return (CONDITION_OPERATORS as readonly string[]).includes(value);
}
function isRecipientKind(value: string): value is RecipientKind {
  return (RECIPIENT_KINDS as readonly string[]).includes(value);
}
function isTrigger(value: string): value is NotificationTrigger {
  return (TRIGGERS as readonly string[]).includes(value);
}

/**
 * Extrae las condiciones de un grupo (`ALL` o `ANY`) a partir de filas
 * indexadas del formulario. Una fila sin campo elegido se ignora: un bloque
 * vacío no invalida por sí solo la regla.
 */
function parseConditions(
  formData: FormData,
  group: "ALL" | "ANY",
  errors: Record<string, string>,
): ParsedCondition[] {
  const prefix = group === "ALL" ? "condition_all" : "condition_any";
  const result: ParsedCondition[] = [];

  for (let index = 0; index < MAX_ROWS; index += 1) {
    const fieldRaw = readString(formData, `${prefix}_${index}_field`);
    if (fieldRaw === "") {
      continue;
    }
    if (!isConditionField(fieldRaw)) {
      errors[`${prefix}_${index}`] = "Campo de condición no válido.";
      continue;
    }
    const operatorRaw = readString(formData, `${prefix}_${index}_operator`);
    const operator = isOperator(operatorRaw) ? operatorRaw : "IS";
    const value = readString(formData, `${prefix}_${index}_value`);

    const condition: ParsedCondition = {
      group,
      field: fieldRaw,
      operator,
      statusId: null,
      personId: null,
      clientId: null,
      booleanValue: null,
    };

    if (fieldRaw === "STATUS") {
      condition.statusId = value || null;
    } else if (fieldRaw === "CLIENT") {
      condition.clientId = value || null;
    } else {
      // PROJECT_MANAGER, COMMERCIAL, CREATOR: se comparan por persona.
      condition.personId = value || null;
    }

    if (!value) {
      errors[`${prefix}_${index}`] = "Selecciona un valor para esta condición.";
      continue;
    }

    result.push(condition);
  }

  return result;
}

function parseActions(
  formData: FormData,
  errors: Record<string, string>,
): ParsedAction[] {
  const result: ParsedAction[] = [];

  for (let index = 0; index < MAX_ROWS; index += 1) {
    const kindRaw = readString(formData, `action_${index}_kind`);
    if (kindRaw === "") {
      continue;
    }
    if (!isRecipientKind(kindRaw)) {
      errors[`action_${index}`] = "Destinatario no válido.";
      continue;
    }
    const personId = readString(formData, `action_${index}_personId`) || null;
    if (kindRaw === "SPECIFIC_PERSON" && !personId) {
      errors[`action_${index}`] = "Selecciona la persona destinataria.";
      continue;
    }
    result.push({ kind: kindRaw, personId: kindRaw === "SPECIFIC_PERSON" ? personId : null });
  }

  return result;
}

async function saveRule(
  formData: FormData,
  existingId: string | null,
): Promise<AdminActionState> {
  const admin = await requireAdmin();

  const name = normalizeSpaces(readString(formData, "name"));
  const description = normalizeSpaces(readString(formData, "description"));
  const triggerRaw = readString(formData, "trigger");
  const channelRaw = readString(formData, "channel");

  const errors: Record<string, string> = {};
  if (name === "") {
    errors.name = "El nombre es obligatorio.";
  } else if (name.length > NAME_MAX_LENGTH) {
    errors.name = `El nombre no puede superar ${NAME_MAX_LENGTH} caracteres.`;
  }
  if (description.length > DESCRIPTION_MAX_LENGTH) {
    errors.description = `La descripción no puede superar ${DESCRIPTION_MAX_LENGTH} caracteres.`;
  }
  if (!isTrigger(triggerRaw)) {
    errors.trigger = "Selecciona un disparador válido.";
  }
  const channel = channelRaw === "INTERNAL_AND_EMAIL" ? "INTERNAL_AND_EMAIL" : "INTERNAL";

  const allConditions = parseConditions(formData, "ALL", errors);
  const anyConditions = parseConditions(formData, "ANY", errors);
  const actions = parseActions(formData, errors);

  if (actions.length === 0) {
    errors._form = "La regla necesita al menos un destinatario.";
  }

  if (Object.keys(errors).length > 0) {
    return adminError(errors, existingId);
  }

  const conditions = [...allConditions, ...anyConditions];

  try {
    const result = await prisma.$transaction(async (tx) => {
      if (existingId) {
        await tx.notificationRuleCondition.deleteMany({ where: { ruleId: existingId } });
        await tx.notificationRuleAction.deleteMany({ where: { ruleId: existingId } });
        const rule = await tx.notificationRule.update({
          where: { id: existingId },
          data: {
            name,
            description: description || null,
            trigger: triggerRaw as NotificationTrigger,
            channel,
            conditions: { create: conditions },
            actions: { create: actions },
          },
          select: { id: true, name: true },
        });
        await recordAudit(tx, {
          entityType: "NotificationRule",
          entityId: rule.id,
          action: "UPDATE",
          actorId: admin.id,
          changes: { name, trigger: triggerRaw, channel },
        });
        return rule;
      }

      const rule = await tx.notificationRule.create({
        data: {
          name,
          description: description || null,
          trigger: triggerRaw as NotificationTrigger,
          channel,
          isActive: true,
          conditions: { create: conditions },
          actions: { create: actions },
        },
        select: { id: true, name: true },
      });
      await recordAudit(tx, {
        entityType: "NotificationRule",
        entityId: rule.id,
        action: "CREATE",
        actorId: admin.id,
        changes: { name, trigger: triggerRaw, channel },
      });
      return rule;
    });

    revalidatePath("/admin/notification-rules");
    return adminSuccess(
      existingId ? `Regla «${result.name}» actualizada.` : `Regla «${result.name}» creada.`,
      result.id,
    );
  } catch (error) {
    return adminError({ _form: toSafeErrorMessage(error) }, existingId);
  }
}

export async function createNotificationRuleAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  return saveRule(formData, null);
}

export async function updateNotificationRuleAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const id = readString(formData, "id");
  if (!id) {
    return adminError({ _form: "No se ha podido identificar la regla." });
  }
  return saveRule(formData, id);
}

export async function setNotificationRuleActiveAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const admin = await requireAdmin();
  const id = readString(formData, "id");
  const isActive = readString(formData, "isActive") === "true";

  if (!id) {
    return adminError({ _form: "No se ha podido identificar la regla." });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const current = await tx.notificationRule.findUnique({
        where: { id },
        select: { name: true, isActive: true },
      });
      if (!current) {
        return null;
      }
      if (current.isActive === isActive) {
        return { name: current.name, changed: false as const };
      }
      await tx.notificationRule.update({ where: { id }, data: { isActive } });
      await recordAudit(tx, {
        entityType: "NotificationRule",
        entityId: id,
        action: isActive ? "ACTIVATE" : "DEACTIVATE",
        actorId: admin.id,
        changes: { isActive: { antes: current.isActive, despues: isActive } },
      });
      return { name: current.name, changed: true as const };
    });

    if (result === null) {
      return adminError({ _form: "La regla ya no existe." }, id);
    }

    revalidatePath("/admin/notification-rules");
    return adminSuccess(
      isActive ? `Regla «${result.name}» activada.` : `Regla «${result.name}» desactivada.`,
      id,
    );
  } catch (error) {
    return adminError({ _form: toSafeErrorMessage(error) }, id);
  }
}
