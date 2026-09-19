import { redirect } from "next/navigation";
import { isAdmin } from "@/modules/auth/identity";
import { getCurrentUser } from "@/modules/auth/session";

/**
 * Página inicial según rol (hotfix DEV-005, bloque 9): un `USER` aterriza en
 * su panel de notificaciones; un `ADMIN` conserva `/offers` para no alterar
 * su flujo habitual de administración.
 */
export default async function RootPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  redirect(isAdmin(user) ? "/offers" : "/notificaciones");
}
