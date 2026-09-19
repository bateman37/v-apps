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
import {
  CATALOG_LABELS,
  CATALOG_NOTES,
  type CatalogKey,
} from "@/modules/master-data/catalogs";
import type { MasterDataGroup } from "@/modules/master-data/data";

/**
 * Administración de los siete catálogos del Gestor de Ofertas.
 *
 * Los siete comparten la misma tarjeta, el mismo formulario de alta y la misma
 * fila editable: no hay siete implementaciones duplicadas.
 */
export function MasterDataScreen({
  groups,
  createAction,
  updateAction,
  setActiveAction,
}: {
  groups: MasterDataGroup[];
  createAction: AdminAction;
  updateAction: AdminAction;
  setActiveAction: AdminAction;
}) {
  return (
    <div className="flex flex-col gap-6">
      {groups.map((group) => (
        <AdminCard
          key={group.key}
          title={CATALOG_LABELS[group.key].plural}
          description={CATALOG_NOTES[group.key]}
        >
          <CreateRecordForm action={createAction} catalog={group.key} />

          {group.records.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--color-text-muted)]">
              Todavía no hay registros en este catálogo.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="v-table">
                <thead>
                  <tr>
                    <th scope="col">Código técnico</th>
                    <th scope="col">Nombre visible y orden</th>
                    <th scope="col">Estado</th>
                    <th scope="col">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {group.records.map((record) => (
                    <tr key={record.id}>
                      <td className="font-mono text-xs text-[var(--color-text-muted)]">
                        {record.code}
                      </td>
                      <td className="min-w-[22rem]">
                        <EditRecordForm
                          action={updateAction}
                          catalog={group.key}
                          record={record}
                        />
                      </td>
                      <td>
                        <StatusBadge active={record.isActive} />
                      </td>
                      <td>
                        <ToggleActiveForm
                          action={setActiveAction}
                          id={record.id}
                          isActive={record.isActive}
                          name={record.name}
                          entityLabel={CATALOG_LABELS[group.key].singular}
                          extraFields={{ catalog: group.key }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AdminCard>
      ))}
    </div>
  );
}

function CreateRecordForm({
  action,
  catalog,
}: {
  action: AdminAction;
  catalog: CatalogKey;
}) {
  const [state, formAction] = useActionState(action, INITIAL_ADMIN_ACTION_STATE);
  const isTarget = state.targetId === catalog || state.status === "success";

  return (
    <form action={formAction} noValidate className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="catalog" value={catalog} />
      <div className="w-40">
        <FormField
          id={`${catalog}-new-code`}
          label="Código"
          required
          error={state.targetId === catalog ? state.errors.code : undefined}
          hint="Estable: no se podrá cambiar."
        >
          <input
            id={`${catalog}-new-code`}
            name="code"
            type="text"
            className="v-input font-mono"
            {...fieldAria(
              `${catalog}-new-code`,
              state.targetId === catalog ? state.errors.code : undefined,
              true,
            )}
          />
        </FormField>
      </div>
      <div className="grow sm:max-w-xs">
        <FormField
          id={`${catalog}-new-name`}
          label="Nombre visible"
          required
          error={state.targetId === catalog ? state.errors.name : undefined}
        >
          <input
            id={`${catalog}-new-name`}
            name="name"
            type="text"
            className="v-input"
            {...fieldAria(
              `${catalog}-new-name`,
              state.targetId === catalog ? state.errors.name : undefined,
            )}
          />
        </FormField>
      </div>
      <div className="w-28">
        <FormField
          id={`${catalog}-new-sort`}
          label="Orden"
          error={state.targetId === catalog ? state.errors.sortOrder : undefined}
        >
          <input
            id={`${catalog}-new-sort`}
            name="sortOrder"
            type="text"
            inputMode="numeric"
            className="v-input v-num"
            defaultValue="0"
            {...fieldAria(
              `${catalog}-new-sort`,
              state.targetId === catalog ? state.errors.sortOrder : undefined,
            )}
          />
        </FormField>
      </div>
      <AdminSubmit variant="primary">Añadir</AdminSubmit>
      <div className="w-full">{isTarget ? <AdminFeedback state={state} /> : null}</div>
    </form>
  );
}

function EditRecordForm({
  action,
  catalog,
  record,
}: {
  action: AdminAction;
  catalog: CatalogKey;
  record: { id: string; name: string; sortOrder: number };
}) {
  const [state, formAction] = useActionState(action, INITIAL_ADMIN_ACTION_STATE);
  const isTarget = state.targetId === record.id;
  const nameError = isTarget ? state.errors.name : undefined;
  const sortError = isTarget ? state.errors.sortOrder : undefined;

  return (
    <form action={formAction} noValidate className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="catalog" value={catalog} />
      <input type="hidden" name="id" value={record.id} />
      <label className="sr-only" htmlFor={`name-${record.id}`}>
        Nombre visible
      </label>
      <input
        id={`name-${record.id}`}
        name="name"
        type="text"
        className="v-input max-w-xs"
        defaultValue={record.name}
        {...fieldAria(`name-${record.id}`, nameError)}
      />
      <label className="sr-only" htmlFor={`sort-${record.id}`}>
        Orden de visualización
      </label>
      <input
        id={`sort-${record.id}`}
        name="sortOrder"
        type="text"
        inputMode="numeric"
        className="v-input v-num w-20"
        defaultValue={String(record.sortOrder)}
        {...fieldAria(`sort-${record.id}`, sortError)}
      />
      <AdminSubmit>Guardar</AdminSubmit>
      <div className="w-full">
        {nameError || sortError ? (
          <span className="v-field-error" role="alert">
            {nameError ?? sortError}
          </span>
        ) : (
          <AdminFeedback state={state} />
        )}
      </div>
    </form>
  );
}
