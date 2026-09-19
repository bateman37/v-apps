"use client";

import { useActionState, useState } from "react";
import { fieldAria, FormField } from "@/components/ui/form-field";
import { INITIAL_ADMIN_ACTION_STATE } from "@/modules/admin/action-state";
import {
  AdminCard,
  AdminFeedback,
  AdminSubmit,
  type AdminAction,
} from "@/modules/admin/components/admin-forms";
import type { CounterStatus } from "@/modules/admin/counter/data";

export function CounterScreen({
  status,
  initializeAction,
  increaseAction,
}: {
  status: CounterStatus;
  initializeAction: AdminAction;
  increaseAction: AdminAction;
}) {
  return (
    <div className="flex flex-col gap-6">
      <AdminCard title="Estado actual">
        <p className="text-sm">
          {status.exists ? (
            <>
              Valor actual del contador:{" "}
              <span className="v-num font-bold">{status.value}</span>. Este es el{" "}
              <strong>último número ya consumido</strong>, no el próximo.
            </>
          ) : (
            "El contador todavía no existe."
          )}
        </p>
        <p className="v-hint mt-1">
          Última oferta creada: {status.lastOfferNumber ?? "ninguna todavía"}.
        </p>
      </AdminCard>

      {!status.exists ? (
        <AdminCard
          title="Inicializar el contador"
          description="Úsalo una única vez, con el último contador del Excel legado en el momento del cierre definitivo. No forma parte de esta entrega la carga automática desde el Excel/SQL Server."
        >
          <InitializeForm action={initializeAction} />
        </AdminCard>
      ) : (
        <AdminCard
          title="Ajustar el contador"
          description="Ajuste excepcional y auditado. Nunca puede reducirse ni quedar por debajo del valor ya consumido."
        >
          <IncreaseForm action={increaseAction} currentValue={status.value ?? 0} />
        </AdminCard>
      )}
    </div>
  );
}

function InitializeForm({ action }: { action: AdminAction }) {
  const [state, formAction] = useActionState(action, INITIAL_ADMIN_ACTION_STATE);

  return (
    <form action={formAction} noValidate className="flex flex-wrap items-end gap-3">
      <div className="sm:w-48">
        <FormField id="counter-init-value" label="Valor inicial" required error={state.errors.value}>
          <input
            id="counter-init-value"
            name="value"
            type="number"
            min={0}
            step={1}
            className="v-input"
            {...fieldAria("counter-init-value", state.errors.value)}
          />
        </FormField>
      </div>
      <AdminSubmit
        variant="primary"
        confirmMessage="¿Inicializar el contador? Esta acción solo puede hacerse una vez."
      >
        Inicializar
      </AdminSubmit>
      <div className="w-full">
        <AdminFeedback state={state} />
      </div>
    </form>
  );
}

function IncreaseForm({ action, currentValue }: { action: AdminAction; currentValue: number }) {
  const [state, formAction] = useActionState(action, INITIAL_ADMIN_ACTION_STATE);
  const [newValue, setNewValue] = useState("");

  return (
    <form action={formAction} noValidate className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="expectedCurrent" value={currentValue} />
      <div className="sm:w-48">
        <FormField id="counter-new-value" label="Nuevo valor" required error={state.errors.newValue}>
          <input
            id="counter-new-value"
            name="newValue"
            type="number"
            min={currentValue + 1}
            step={1}
            className="v-input"
            value={newValue}
            onChange={(event) => setNewValue(event.target.value)}
            {...fieldAria("counter-new-value", state.errors.newValue)}
          />
        </FormField>
      </div>
      <AdminSubmit
        variant="primary"
        confirmMessage={`¿Cambiar el contador de ${currentValue} a ${newValue || "…"}?\n\nEsta acción queda auditada y no se puede deshacer.`}
      >
        Ajustar
      </AdminSubmit>
      <div className="w-full">
        <AdminFeedback state={state} />
      </div>
    </form>
  );
}
