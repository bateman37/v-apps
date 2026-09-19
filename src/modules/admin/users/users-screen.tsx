"use client";

import { useActionState } from "react";
import { fieldAria, FormField } from "@/components/ui/form-field";
import { StatusBadge } from "@/components/ui/status-badge";
import { INITIAL_ADMIN_ACTION_STATE } from "@/modules/admin/action-state";
import {
  AdminCard,
  AdminFeedback,
  AdminSubmit,
  type AdminAction,
} from "@/modules/admin/components/admin-forms";
import type { PersonOption, UserRow } from "@/modules/admin/users/data";

/**
 * Administración de usuarios (DEC-055). Solo accesible para `ADMIN`
 * (impuesto en servidor por cada Server Action, no solo por ocultar el
 * enlace). No se muestran hashes ni contraseñas existentes.
 */
export function UsersScreen({
  users,
  availablePeople,
  createAction,
  setActiveAction,
  setRoleAction,
  resetPasswordAction,
}: {
  users: UserRow[];
  availablePeople: PersonOption[];
  createAction: AdminAction;
  setActiveAction: AdminAction;
  setRoleAction: AdminAction;
  resetPasswordAction: AdminAction;
}) {
  return (
    <div className="flex flex-col gap-6">
      <AdminCard
        title="Nuevo usuario"
        description="Vincula la cuenta a una persona que todavía no tenga usuario. La contraseña temporal deberá cambiarse en el primer acceso."
      >
        <CreateUserForm action={createAction} availablePeople={availablePeople} />
      </AdminCard>

      <AdminCard title="Usuarios">
        {users.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">
            Todavía no hay usuarios creados.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="v-table">
              <thead>
                <tr>
                  <th scope="col">Usuario</th>
                  <th scope="col">Persona</th>
                  <th scope="col">Rol</th>
                  <th scope="col">Estado</th>
                  <th scope="col">Cambio pendiente</th>
                  <th scope="col">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="v-num">{user.username}</td>
                    <td>{user.personName}</td>
                    <td>
                      <RoleForm action={setRoleAction} user={user} />
                    </td>
                    <td>
                      <StatusBadge active={user.isActive} />
                    </td>
                    <td>{user.mustChangePassword ? "Sí" : "No"}</td>
                    <td className="flex flex-wrap gap-2">
                      <ToggleActiveUserForm action={setActiveAction} user={user} />
                      <ResetPasswordForm action={resetPasswordAction} user={user} />
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

function CreateUserForm({
  action,
  availablePeople,
}: {
  action: AdminAction;
  availablePeople: PersonOption[];
}) {
  const [state, formAction] = useActionState(action, INITIAL_ADMIN_ACTION_STATE);

  return (
    <form action={formAction} noValidate className="flex flex-wrap items-end gap-3">
      <div className="sm:w-56">
        <FormField id="new-user-person" label="Persona" required error={state.errors.personId}>
          <select
            id="new-user-person"
            name="personId"
            className="v-input"
            defaultValue=""
            {...fieldAria("new-user-person", state.errors.personId)}
          >
            <option value="" disabled>
              Selecciona una persona…
            </option>
            {availablePeople.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      <div className="sm:w-48">
        <FormField id="new-user-username" label="Usuario" required error={state.errors.username}>
          <input
            id="new-user-username"
            name="username"
            type="text"
            autoComplete="off"
            className="v-input"
            {...fieldAria("new-user-username", state.errors.username)}
          />
        </FormField>
      </div>

      <div className="sm:w-40">
        <FormField id="new-user-role" label="Rol" required error={state.errors.role}>
          <select
            id="new-user-role"
            name="role"
            className="v-input"
            defaultValue="USER"
            {...fieldAria("new-user-role", state.errors.role)}
          >
            <option value="USER">Usuario</option>
            <option value="ADMIN">Administrador</option>
          </select>
        </FormField>
      </div>

      <div className="sm:w-48">
        <FormField
          id="new-user-password"
          label="Contraseña temporal"
          required
          error={state.errors.password}
        >
          <input
            id="new-user-password"
            name="password"
            type="password"
            autoComplete="new-password"
            className="v-input"
            {...fieldAria("new-user-password", state.errors.password)}
          />
        </FormField>
      </div>

      <AdminSubmit variant="primary">Crear usuario</AdminSubmit>
      <div className="w-full">
        {availablePeople.length === 0 ? (
          <p className="v-hint">
            No hay personas activas sin usuario todavía. Crea o activa una persona en
            Administración → Personas.
          </p>
        ) : null}
        <AdminFeedback state={state} />
      </div>
    </form>
  );
}

function ToggleActiveUserForm({ action, user }: { action: AdminAction; user: UserRow }) {
  const [state, formAction] = useActionState(action, INITIAL_ADMIN_ACTION_STATE);

  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={user.id} />
      <input type="hidden" name="isActive" value={user.isActive ? "false" : "true"} />
      <AdminSubmit
        variant="quiet"
        confirmMessage={
          user.isActive
            ? `¿Desactivar el usuario «${user.username}»?\n\nSus sesiones abiertas se cerrarán de inmediato. No se borra nada.`
            : undefined
        }
      >
        {user.isActive ? "Desactivar" : "Activar"}
      </AdminSubmit>
      <AdminFeedback state={state} />
    </form>
  );
}

function ResetPasswordForm({ action, user }: { action: AdminAction; user: UserRow }) {
  const [state, formAction] = useActionState(action, INITIAL_ADMIN_ACTION_STATE);
  const isTarget = state.targetId === user.id;

  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={user.id} />
      <AdminSubmit
        variant="quiet"
        confirmMessage={`¿Generar una nueva contraseña temporal para «${user.username}»?\n\nLa contraseña anterior dejará de funcionar y sus sesiones abiertas se cerrarán.`}
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

function RoleForm({ action, user }: { action: AdminAction; user: UserRow }) {
  const [state, formAction] = useActionState(action, INITIAL_ADMIN_ACTION_STATE);

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="id" value={user.id} />
      <label className="sr-only" htmlFor={`role-${user.id}`}>
        Rol de {user.username}
      </label>
      <select
        id={`role-${user.id}`}
        name="role"
        className="v-input"
        defaultValue={user.role}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
      >
        <option value="USER">Usuario</option>
        <option value="ADMIN">Administrador</option>
      </select>
      <AdminFeedback state={state} />
    </form>
  );
}
