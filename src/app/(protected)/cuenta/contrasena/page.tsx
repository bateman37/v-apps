import { ChangePasswordForm } from "@/modules/auth/change-password-form";
import { requireUser } from "@/modules/auth/session";

export default async function ChangePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ motivo?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const isInitial = params.motivo === "inicial";

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-1 text-xl font-bold text-[var(--color-text)]">
        Cambiar contraseña
      </h1>
      <p className="v-hint mb-6">
        {isInitial
          ? `Es tu primer acceso, ${user.personName}: debes establecer una contraseña propia antes de continuar.`
          : "Cambia tu contraseña cuando quieras. Se cerrarán las demás sesiones abiertas de tu cuenta."}
      </p>
      <div className="v-card px-6 py-6">
        <ChangePasswordForm />
      </div>
    </div>
  );
}
