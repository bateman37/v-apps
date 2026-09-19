import { redirect } from "next/navigation";
import { PublicShell } from "@/components/layout/app-shell";
import { LoginForm } from "@/modules/auth/login-form";
import { isAdmin } from "@/modules/auth/identity";
import { getCurrentUser } from "@/modules/auth/session";

const MOTIVOS: Record<string, string> = {
  sesion: "Tu sesión ha caducado o no es válida. Inicia sesión de nuevo.",
  salida: "Has cerrado sesión correctamente.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ motivo?: string; redirectTo?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) {
    redirect(isAdmin(user) ? "/offers" : "/notificaciones");
  }

  const params = await searchParams;
  const notice = params.motivo ? MOTIVOS[params.motivo] : undefined;
  // Sin `redirectTo` explícito, no se fija aquí un destino por defecto: el
  // rol todavía no se conoce antes de iniciar sesión. `loginAction` decide el
  // destino según el rol una vez autenticado (bloque 9).
  const redirectTo =
    params.redirectTo && params.redirectTo.startsWith("/") ? params.redirectTo : "";

  return (
    <PublicShell>
      <div className="v-card px-6 py-8">
        <p className="text-lg font-extrabold tracking-tight text-[var(--color-primary)]">
          Vincle Apps
        </p>
        <h1 className="mb-1 mt-4 text-xl font-bold text-[var(--color-text)]">
          Iniciar sesión
        </h1>
        <p className="v-hint mb-6">
          Autenticación local provisional. Pide tu usuario y contraseña temporal a un
          administrador si todavía no tienes cuenta.
        </p>

        {notice ? (
          <p
            role="status"
            className="mb-4 rounded-md px-3 py-2 text-sm font-semibold"
            style={{
              backgroundColor: "var(--color-primary-soft)",
              color: "var(--color-primary)",
            }}
          >
            {notice}
          </p>
        ) : null}

        <LoginForm redirectTo={redirectTo} />
      </div>
    </PublicShell>
  );
}
