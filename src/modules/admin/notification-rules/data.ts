import { prisma } from "@/lib/db/prisma";
import { TRIGGER_LABELS, type NotificationTrigger } from "@/modules/notifications/rules";

/** Lecturas de la administración de reglas de notificación (bloque 9.4). */

export type RuleConditionRow = {
  id: string;
  group: "ALL" | "ANY";
  field: "STATUS" | "PROJECT_MANAGER" | "COMMERCIAL" | "CREATOR" | "CLIENT" | "ARCHIVED";
  operator: "IS" | "IS_NOT";
  statusId: string | null;
  personId: string | null;
  clientId: string | null;
  booleanValue: boolean | null;
};

export type RuleActionRow = {
  id: string;
  kind: "PROJECT_MANAGER" | "COMMERCIAL" | "CREATOR" | "ALL_ADMINS" | "SPECIFIC_PERSON";
  personId: string | null;
  personName: string | null;
};

export type NotificationRuleRow = {
  id: string;
  key: string | null;
  name: string;
  description: string | null;
  isActive: boolean;
  trigger: NotificationTrigger;
  triggerLabel: string;
  channel: "INTERNAL" | "INTERNAL_AND_EMAIL";
  conditions: RuleConditionRow[];
  actions: RuleActionRow[];
};

export async function getNotificationRules(): Promise<NotificationRuleRow[]> {
  const rules = await prisma.notificationRule.findMany({
    include: {
      conditions: true,
      actions: { include: { person: { select: { name: true } } } },
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return rules.map((rule) => ({
    id: rule.id,
    key: rule.key,
    name: rule.name,
    description: rule.description,
    isActive: rule.isActive,
    trigger: rule.trigger,
    triggerLabel: TRIGGER_LABELS[rule.trigger],
    channel: rule.channel,
    conditions: rule.conditions.map((condition) => ({
      id: condition.id,
      group: condition.group,
      field: condition.field,
      operator: condition.operator,
      statusId: condition.statusId,
      personId: condition.personId,
      clientId: condition.clientId,
      booleanValue: condition.booleanValue,
    })),
    actions: rule.actions.map((action) => ({
      id: action.id,
      kind: action.kind,
      personId: action.personId,
      personName: action.person?.name ?? null,
    })),
  }));
}

export type RuleFormOptions = {
  statuses: Array<{ id: string; name: string }>;
  clients: Array<{ id: string; name: string }>;
  people: Array<{ id: string; name: string }>;
};

/** Solo personas con usuario activo pueden ser destinatario "persona concreta". */
export async function getRuleFormOptions(): Promise<RuleFormOptions> {
  const [statuses, clients, people] = await Promise.all([
    prisma.offerStatus.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.client.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.person.findMany({
      where: { isActive: true, user: { isActive: true } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);
  return { statuses, clients, people };
}
