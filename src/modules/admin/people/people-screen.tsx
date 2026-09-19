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
import type { PersonFilters, PersonRow } from "@/modules/admin/people/data";

/**
 * Administración del maestro común de personas. Los dos indicadores
 * (comercial y Project Manager) son independientes: una persona puede tener
 * uno, los dos o ninguno.
 */
export function PeopleScreen({
  people,
  filters,
  createAction,
  updateAction,
  setActiveAction,
}: {
  people: PersonRow[];
  filters: PersonFilters;
  createAction: AdminAction;
  updateAction: AdminAction;
  setActiveAction: AdminAction;
}) {
  return (
    <div className="flex flex-col gap-6">
      <AdminCard
        title="Nueva persona"
        description="Marca las habilitaciones que correspondan. No se guardan email, teléfono, departamento ni credenciales."
      >
        <CreatePersonForm action={createAction} />
      </AdminCard>

      <AdminCard title="Personas">
        <form
          method="get"
          action="/admin/people"
          className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:items-end"
        >
          <div className="lg:col-span-2">
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
          <div>
            <label className="v-label" htmlFor="commercial">
              Habilitación comercial
            </label>
            <select
              id="commercial"
              name="commercial"
              className="v-input"
              defaultValue={filters.commercial}
            >
              <option value="all">Todas</option>
              <option value="yes">Sí</option>
              <option value="no">No</option>
            </select>
          </div>
          <div>
            <label className="v-label" htmlFor="projectManager">
              Habilitación PM
            </label>
            <select
              id="projectManager"
              name="projectManager"
              className="v-input"
              defaultValue={filters.projectManager}
            >
              <option value="all">Todas</option>
              <option value="yes">Sí</option>
              <option value="no">No</option>
            </select>
          </div>
          <div>
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
              <option value="active">Solo activas</option>
              <option value="inactive">Solo inactivas</option>
            </select>
          </div>
          <div className="lg:col-span-5">
            <button type="submit" className="v-btn v-btn-secondary">
              Filtrar
            </button>
          </div>
        </form>

        {people.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">
            No hay personas que coincidan con el filtro.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="v-table">
              <thead>
                <tr>
                  <th scope="col">Nombre y habilitaciones</th>
                  <th scope="col">Estado</th>
                  <th scope="col" className="text-right">
                    Ofertas
                  </th>
                  <th scope="col">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {people.map((person) => (
                  <tr key={person.id}>
                    <td className="min-w-[22rem]">
                      <EditPersonForm action={updateAction} person={person} />
                    </td>
                    <td>
                      <StatusBadge active={person.isActive} />
                    </td>
                    <td className="v-num text-right">{person.offerCount}</td>
                    <td>
                      <ToggleActiveForm
                        action={setActiveAction}
                        id={person.id}
                        isActive={person.isActive}
                        name={person.name}
                        entityLabel="la persona"
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

function CreatePersonForm({ action }: { action: AdminAction }) {
  const [state, formAction] = useActionState(action, INITIAL_ADMIN_ACTION_STATE);

  return (
    <form action={formAction} noValidate className="flex flex-wrap items-end gap-4">
      <div className="grow sm:max-w-md">
        <FormField
          id="new-person-name"
          label="Nombre de la persona"
          required
          error={state.errors.name}
        >
          <input
            id="new-person-name"
            name="name"
            type="text"
            className="v-input"
            {...fieldAria("new-person-name", state.errors.name)}
          />
        </FormField>
      </div>
      <Checkbox id="new-person-commercial" name="canBeCommercial" label="Comercial" />
      <Checkbox
        id="new-person-pm"
        name="canBeProjectManager"
        label="Project Manager"
      />
      <AdminSubmit variant="primary">Crear persona</AdminSubmit>
      <div className="w-full">
        <AdminFeedback state={state} />
      </div>
    </form>
  );
}

function EditPersonForm({
  action,
  person,
}: {
  action: AdminAction;
  person: PersonRow;
}) {
  const [state, formAction] = useActionState(action, INITIAL_ADMIN_ACTION_STATE);
  const fieldId = `person-name-${person.id}`;
  const error = state.targetId === person.id ? state.errors.name : undefined;

  return (
    <form action={formAction} noValidate className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="id" value={person.id} />
      <label className="sr-only" htmlFor={fieldId}>
        Nombre de la persona
      </label>
      <input
        id={fieldId}
        name="name"
        type="text"
        className="v-input max-w-xs"
        defaultValue={person.name}
        {...fieldAria(fieldId, error)}
      />
      <Checkbox
        id={`person-commercial-${person.id}`}
        name="canBeCommercial"
        label="Comercial"
        defaultChecked={person.canBeCommercial}
      />
      <Checkbox
        id={`person-pm-${person.id}`}
        name="canBeProjectManager"
        label="PM"
        defaultChecked={person.canBeProjectManager}
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

function Checkbox({
  id,
  name,
  label,
  defaultChecked,
}: {
  id: string;
  name: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-center gap-2 text-sm font-medium" htmlFor={id}>
      <input
        id={id}
        name={name}
        type="checkbox"
        defaultChecked={defaultChecked}
        className="size-4 accent-[var(--color-primary)]"
      />
      {label}
    </label>
  );
}
