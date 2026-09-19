"use client";

import { useActionState } from "react";
import { fieldAria, FormField } from "@/components/ui/form-field";
import { StatusBadge } from "@/components/ui/status-badge";
import { INITIAL_ADMIN_ACTION_STATE } from "@/modules/admin/action-state";
import {
  AdminCard,
  AdminFeedback,
  AdminSubmit,
  ToggleActiveForm,
  type AdminAction,
} from "@/modules/admin/components/admin-forms";
import type { ClientFilters, ClientRow } from "@/modules/admin/clients/data";

/**
 * Administración del maestro de clientes: alta, cambio de nombre y
 * activación/desactivación. No existe borrado físico en ningún caso.
 */
export function ClientsScreen({
  clients,
  filters,
  createAction,
  updateAction,
  setActiveAction,
}: {
  clients: ClientRow[];
  filters: ClientFilters;
  createAction: AdminAction;
  updateAction: AdminAction;
  setActiveAction: AdminAction;
}) {
  return (
    <div className="flex flex-col gap-6">
      <AdminCard
        title="Nuevo cliente"
        description="Solo se pide el nombre. Todavía no existen códigos corporativos, grupos ni datos fiscales."
      >
        <CreateClientForm action={createAction} />
      </AdminCard>

      <AdminCard title="Clientes">
        <form method="get" action="/admin/clients" className="mb-4 flex flex-wrap items-end gap-3">
          <div className="grow sm:max-w-xs">
            <label className="v-label" htmlFor="q">
              Buscar por nombre
            </label>
            <input
              id="q"
              name="q"
              type="search"
              className="v-input"
              defaultValue={filters.q}
            />
          </div>
          <div className="sm:w-48">
            <label className="v-label" htmlFor="state">
              Estado
            </label>
            <select
              id="state"
              name="state"
              className="v-input"
              defaultValue={filters.state}
            >
              <option value="all">Todos</option>
              <option value="active">Solo activos</option>
              <option value="inactive">Solo inactivos</option>
            </select>
          </div>
          <button type="submit" className="v-btn v-btn-secondary">
            Filtrar
          </button>
        </form>

        {clients.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">
            No hay clientes que coincidan con el filtro.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="v-table">
              <thead>
                <tr>
                  <th scope="col">Nombre</th>
                  <th scope="col">Estado</th>
                  <th scope="col" className="text-right">
                    Ofertas
                  </th>
                  <th scope="col">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id}>
                    <td className="min-w-[16rem]">
                      <EditClientForm action={updateAction} client={client} />
                    </td>
                    <td>
                      <StatusBadge active={client.isActive} />
                    </td>
                    <td className="v-num text-right">{client.offerCount}</td>
                    <td>
                      <ToggleActiveForm
                        action={setActiveAction}
                        id={client.id}
                        isActive={client.isActive}
                        name={client.name}
                        entityLabel="el cliente"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>
    </div>
  );
}

function CreateClientForm({ action }: { action: AdminAction }) {
  const [state, formAction] = useActionState(action, INITIAL_ADMIN_ACTION_STATE);

  return (
    <form action={formAction} noValidate className="flex flex-wrap items-end gap-3">
      <div className="grow sm:max-w-md">
        <FormField id="new-client-name" label="Nombre del cliente" required error={state.errors.name}>
          <input
            id="new-client-name"
            name="name"
            type="text"
            className="v-input"
            {...fieldAria("new-client-name", state.errors.name)}
          />
        </FormField>
      </div>
      <AdminSubmit variant="primary">Crear cliente</AdminSubmit>
      <div className="w-full">
        <AdminFeedback state={state} />
      </div>
    </form>
  );
}

function EditClientForm({
  action,
  client,
}: {
  action: AdminAction;
  client: ClientRow;
}) {
  const [state, formAction] = useActionState(action, INITIAL_ADMIN_ACTION_STATE);
  const fieldId = `client-name-${client.id}`;
  const error = state.targetId === client.id ? state.errors.name : undefined;

  return (
    <form action={formAction} noValidate className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={client.id} />
      <label className="sr-only" htmlFor={fieldId}>
        Nombre del cliente
      </label>
      <input
        id={fieldId}
        name="name"
        type="text"
        className="v-input max-w-xs"
        defaultValue={client.name}
        {...fieldAria(fieldId, error)}
      />
      <AdminSubmit>Guardar</AdminSubmit>
      <div className="w-full">
        {error ? (
          <span className="v-field-error" role="alert">
            {error}
          </span>
        ) : (
          <AdminFeedback state={state} />
        )}
      </div>
    </form>
  );
}
