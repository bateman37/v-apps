import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { getNotifications } from "@/modules/notifications/data";
import { NotificationsScreen } from "@/modules/notifications/notifications-screen";
import { requireUser } from "@/modules/auth/session";

export const metadata: Metadata = {
  title: "Notificaciones · Vincle Apps",
};

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const user = await requireUser();
  const notifications = await getNotifications(user);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Notificaciones"
        subtitle="Historial propio. No se elimina ninguna automáticamente."
      />
      <NotificationsScreen notifications={notifications} />
    </div>
  );
}
