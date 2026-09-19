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
 * «Personas y accesos» (hotfix DEV-005, bloque 7): una única pantalla de
 * Administración para personas y para sus cuentas de acceso.
 *
 * `Person` y `User` siguen siendo entidades separadas e independientes: esta
 * pantalla solo las presenta y las gestiona juntas. Crear, activar/desactivar
 * o cambiar el rol de una cuenta sigue siendo una acción sobre `User`, nunca
 * sobre `Person`, y viceversa.
 */
export function PeopleScreen({
  people,
  filters,
  createAction,
  updateAction,
  setActiveAction,
  createAccessAction,
  setAccessActiveAction,
  setAccessRoleAction,
  resetAccessPasswordAction,
}: {
  people: PersonRow[];
  filters: PersonFilters;
  createAction: AdminAction;
  updateAction: AdminAction;
  setActiveAction: AdminAction;
  createAccessAction: AdminAction;
  setAccessActiveAction: AdminAction;
  setAccessRoleAction: AdminAction;
  resetAccessPasswordAction: AdminAction;
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
                  <th scope="col">Estado de la persona</th>
                  <th scope="col" className="text-right">
                    Ofertas
                  </th>
                  <th scope="col">Acceso</th>
                  <th scope="col">Acciones de la persona</th>
                  <th scope="col">Acciones del acceso</th>
                </tr>
              </thead>
              <tbody>
                {people.map((person) => (
                  <tr key={person.id}>
                    <td className="min-w-[20rem]">
                      <EditPersonForm action={updateAction} person={person} />
                    </td>
                    <td>
                      <StatusBadge active={person.isActive} />
                    </td>
                    <td className="v-num text-right">{person.offerCount}</td>
                    <td className="min-w-[14rem]">
                      <AccessSummary person={person} />
                    </td>
                    <td>
                      <ToggleActiveForm
                        action={setActiveAction}
                        id={person.id}
                        isActive={person.isActive}
                        name={person.name}
                        entityLabel="la persona"
                      />
                    </td>
                    <td className="min-w-[16rem]">
                      {person.access ? (
                        <AccessActions
                          person={person}
                          setActiveAction={setAccessActiveAction}
                          setRoleAction={setAccessRoleAction}
                          resetPasswordAction={resetAccessPasswordAction}
                        />
                      ) : person.isActive ? (
                        <CreateAccessForm personId={person.id} action={createAccessAction} />
                      ) : (
                        <p className="v-hint">
                          Activa la persona para poder crear su acceso.
                        </p>
                      )}
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

function AccessSummary({ person }: { person: PersonRow }) {
  if (!person.access) {
    return <span className="text-sm text-[var(--color-text-muted)]">Sin acceso</span>;
  }
  return (
    <div className="text-sm">
      <p>
        <StatusBadge active={person.access.isActive} />{" "}
        <span className="v-num">{person.access.username}</span>
      </p>
      <p className="v-hint mt-0.5">
        {person.access.role === "ADMIN" ? "Administrador" : "Usuario"}
        {person.access.mustChangePassword ? " · cambio de contraseña pendiente" : ""}
      </p>
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

/**
 * Crear acceso desde la propia fila de la persona (bloque 7): no obliga a
 * volver a seleccionarla en otra pantalla. `personId` viaja oculto.
 */
function CreateAccessForm({
  personId,
  action,
}: {
  personId: string;
  action: AdminAction;
}) {
  const [state, formAction] = useActionState(action, INITIAL_ADMIN_ACTION_STATE);

  return (
    <form action={formAction} noValidate className="flex flex-col gap-2">
      <input type="hidden" name="personId" value={personId} />
      <FormField
        id={`access-username-${personId}`}
        label="Usuario"
        required
        error={state.errors.username}
      >
        <input
          id={`access-username-${personId}`}
          name="username"
          type="text"
          autoComplete="off"
          className="v-input"
          {...fieldAria(`access-username-${personId}`, state.errors.username)}
        />
      </FormField>
      <FormField
        id={`access-role-${personId}`}
        label="Rol"
        required
        error={state.errors.role}
      >
        <select
          id={`access-role-${personId}`}
          name="role"
          className="v-input"
          defaultValue="USER"
        >
          <option value="USER">Usuario</option>
          <option value="ADMIN">Administrador</option>
        </select>
      </FormField>
      <FormField
        id={`access-password-${personId}`}
        label="Contraseña temporal"
        required
        error={state.errors.password}
      >
        <input
          id={`access-password-${personId}`}
          name="password"
          type="password"
          autoComplete="new-password"
          className="v-input"
          {...fieldAria(`access-password-${personId}`, state.errors.password)}
        />
      </FormField>
      <div>
        <AdminSubmit variant="primary">Crear acceso</AdminSubmit>
      </div>
      <AdminFeedback state={state} />
    </form>
  );
}

/** Acciones sobre un acceso existente: activar/desactivar, rol y contraseña. */
function AccessActions({
  person,
  setActiveAction,
  setRoleAction,
  resetPasswordAction,
}: {
  person: PersonRow;
  setActiveAction: AdminAction;
  setRoleAction: AdminAction;
  resetPasswordAction: AdminAction;
}) {
  if (!person.access) {
    return null;
  }
  const access = person.access;

  return (
    <div className="flex flex-col gap-2">
      <RoleForm action={setRoleAction} userId={access.userId} role={access.role} />
      <ToggleActiveAccessForm
        action={setActiveAction}
        userId={access.userId}
        username={access.username}
        isActive={access.isActive}
      />
      <ResetPasswordForm action={resetPasswordAction} userId={access.userId} username={access.username} />
    </div>
  );
}

function RoleForm({
  action,
  userId,
  role,
}: {
  action: AdminAction;
  userId: string;
  role: "ADMIN" | "USER";
}) {
  const [state, formAction] = useActionState(action, INITIAL_ADMIN_ACTION_STATE);

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="id" value={userId} />
      <label className="sr-only" htmlFor={`role-${userId}`}>
        Rol del acceso
      </label>
      <select
        id={`role-${userId}`}
        name="role"
        className="v-input"
        defaultValue={role}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
      >
        <option value="USER">Usuario</option>
        <option value="ADMIN">Administrador</option>
      </select>
      <AdminFeedback state={state} />
    </form>
  );
}

function ToggleActiveAccessForm({
  action,
  userId,
  username,
  isActive,
}: {
  action: AdminAction;
  userId: string;
  username: string;
  isActive: boolean;
}) {
  const [state, formAction] = useActionState(action, INITIAL_ADMIN_ACTION_STATE);

  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={userId} />
      <input type="hidden" name="isActive" value={isActive ? "false" : "true"} />
      <AdminSubmit
        variant="quiet"
        confirmMessage={
          isActive
            ? `¿Desactivar el acceso de «${username}»?\n\nSus sesiones abiertas se cerrarán de inmediato. No se borra nada.`
            : undefined
        }
      >
        {isActive ? "Desactivar acceso" : "Activar acceso"}
      </AdminSubmit>
      <AdminFeedback state={state} />
    </form>
  );
}

function ResetPasswordForm({
  action,
  userId,
  username,
}: {
  action: AdminAction;
  userId: string;
  username: string;
}) {
  const [state, formAction] = useActionState(action, INITIAL_ADMIN_ACTION_STATE);
  const isTarget = state.targetId === userId;

  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={userId} />
      <AdminSubmit
        variant="quiet"
        confirmMessage={`¿Generar una nueva contraseña temporal para «${username}»?\n\nLa contraseña anterior dejará de funcionar y sus sesiones abiertas se cerrarán.`}
      >
        Nueva contraseña temporal
      </AdminSubmit>
      {isTarget && state.status === "success" && state.message ? (
        <p
          role="status"
          className="mt-1 whitespace-pre-line text-xs font-semibold"
          style={{ color: "var(--color-success)" }}
        >
          {state.message}
        </p>
      ) : (
        <AdminFeedback state={state} />
      )}
    </form>
  );
}
