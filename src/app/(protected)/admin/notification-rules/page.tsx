import {
  createNotificationRuleAction,
  setNotificationRuleActiveAction,
} from "@/modules/admin/notification-rules/actions";
import {
  getNotificationRules,
  getRuleFormOptions,
} from "@/modules/admin/notification-rules/data";
import { NotificationRulesScreen } from "@/modules/admin/notification-rules/notification-rules-screen";
import { requireAdmin } from "@/modules/auth/session";

export default async function NotificationRulesPage() {
  await requireAdmin();
  const [rules, options] = await Promise.all([
    getNotificationRules(),
    getRuleFormOptions(),
  ]);

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-[var(--color-text)]">
        Reglas de notificación
      </h1>
      <p className="v-hint mb-6">
        Motor limitado (bloque 9): eventos, condiciones y destinatarios de una lista
        cerrada. El canal «Interna + email» conserva la intención de canal, pero en esta
        versión no se configura ni se envía ningún correo.
      </p>
      <NotificationRulesScreen
        rules={rules}
        options={options}
        createAction={createNotificationRuleAction}
        setActiveAction={setNotificationRuleActiveAction}
      />
    </div>
  );
}
