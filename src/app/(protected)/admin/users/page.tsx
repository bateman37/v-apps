import { redirect } from "next/navigation";

/**
 * `Personas` y `Usuarios` se unificaron en «Personas y accesos» (hotfix
 * DEV-005, bloque 7). Esta ruta se conserva únicamente para no romper
 * marcadores existentes a `/admin/users`.
 */
export default function AdminUsersPage() {
  redirect("/admin/people");
}
