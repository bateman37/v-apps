import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { countUnreadNotifications } from "@/modules/notifications/data";
import { requireUser } from "@/modules/auth/session";

/**
 * Layout de todo lo que exige sesión (Gestor de Ofertas y Administración).
 *
 * `requireUser()` redirige a `/login` si no hay sesión válida, así que
 * ninguna página bajo este grupo de rutas necesita repetir esa comprobación
 * para el caso general. Cada acción de mutación vuelve a comprobar permisos
 * en servidor: ocultar un enlace aquí nunca es la autorización real.
 */
export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireUser();
  const unreadNotifications = await countUnreadNotifications(user.id);

  return (
    <AppShell user={user} unreadNotifications={unreadNotifications}>
      {children}
    </AppShell>
  );
}
