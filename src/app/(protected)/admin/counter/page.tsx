import { increaseCounterAction, initializeCounterAction } from "@/modules/admin/counter/actions";
import { getCounterStatus } from "@/modules/admin/counter/data";
import { CounterScreen } from "@/modules/admin/counter/counter-screen";
import { requireAdmin } from "@/modules/auth/session";

export default async function CounterPage() {
  await requireAdmin();
  const status = await getCounterStatus();

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-[var(--color-text)]">
        Contador de ofertas
      </h1>
      <p className="v-hint mb-6">
        Administración protegida del contador global de numeración (DEC-010 a DEC-012).
        No es un CRUD ordinario: nunca puede reducirse ni reiniciarse.
      </p>
      <CounterScreen
        status={status}
        initializeAction={initializeCounterAction}
        increaseAction={increaseCounterAction}
      />
    </div>
  );
}
