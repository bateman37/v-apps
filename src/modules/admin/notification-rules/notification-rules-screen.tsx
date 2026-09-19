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
import type { NotificationRuleRow, RuleFormOptions } from "@/modules/admin/notification-rules/data";

const TRIGGER_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "OFFER_CREATED", label: "Oferta creada" },
  { value: "OFFER_STATUS_CHANGED", label: "Estado de oferta cambiado" },
  { value: "OFFER_COMMENT_ADDED", label: "Comentario añadido" },
  { value: "OFFER_ATTACHMENT_ADDED", label: "Adjunto añadido" },
  { value: "OFFER_PENDING_PM_REVIEW", label: "Oferta pendiente de revisión para PM" },
  { value: "OFFER_PENDING_SALES_REVIEW", label: "Oferta pendiente de revisión para comercial" },
];

const CONDITION_FIELD_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "", label: "— Sin usar —" },
  { value: "STATUS", label: "Estado" },
  { value: "PROJECT_MANAGER", label: "Project Manager" },
  { value: "COMMERCIAL", label: "Comercial" },
  { value: "CREATOR", label: "Creador" },
  { value: "CLIENT", label: "Cliente" },
];

const RECIPIENT_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "", label: "— Sin usar —" },
  { value: "PROJECT_MANAGER", label: "Project Manager asignado" },
  { value: "COMMERCIAL", label: "Comercial asignado" },
  { value: "CREATOR", label: "Creador de la oferta" },
  { value: "ALL_ADMINS", label: "Todos los administradores activos" },
  { value: "SPECIFIC_PERSON", label: "Persona concreta" },
];

const ROW_COUNT = 4;

/**
 * Recalcula las filas visibles de un bloque progresivo (bloque 8) a partir de
 * los valores actuales: conserva únicamente los valores no vacíos, en orden,
 * y añade exactamente una fila vacía al final salvo que ya se haya alcanzado
 * el máximo. Es una función pura, comprobable sin React (ver bloque 12).
 *
 * - Empieza mostrando una única fila vacía.
 * - Completar la última fila vacía visible añade la siguiente.
 * - Vaciar una fila la retira, compactando las posteriores sin perder las
 *   demás filas con valor.
 * - Nunca hay más de una fila vacía visible, ni más de `max` filas en total.
 */
export function nextProgressiveRowValues(
  values: readonly string[],
  max: number,
): string[] {
  const filled = values.filter((value) => value !== "");
  if (filled.length >= max) {
    return filled.slice(0, max);
  }
  return [...filled, ""];
}

export function NotificationRulesScreen({
  rules,
  options,
  createAction,
  setActiveAction,
}: {
  rules: NotificationRuleRow[];
  options: RuleFormOptions;
  createAction: AdminAction;
  setActiveAction: AdminAction;
}) {
  return (
    <div className="flex flex-col gap-6">
      <AdminCard
        title="Nueva regla"
        description="Al estilo de un disparador: un evento, condiciones cerradas y uno o más destinatarios. En esta fase el email no se envía ni se simula."
      >
        <RuleForm action={createAction} options={options} />
      </AdminCard>

      <AdminCard title="Reglas existentes">
        {rules.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">No hay reglas todavía.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {rules.map((rule) => (
              <RuleSummary key={rule.id} rule={rule} setActiveAction={setActiveAction} />
            ))}
          </ul>
        )}
      </AdminCard>
    </div>
  );
}

function RuleSummary({
  rule,
  setActiveAction,
}: {
  rule: NotificationRuleRow;
  setActiveAction: AdminAction;
}) {
  const [state, formAction] = useActionState(setActiveAction, INITIAL_ADMIN_ACTION_STATE);

  return (
    <li className="v-card px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-bold">{rule.name}</p>
          {rule.description ? <p className="v-hint">{rule.description}</p> : null}
          <p className="v-hint mt-1">
            Disparador: {rule.triggerLabel} · Canal:{" "}
            {rule.channel === "INTERNAL_AND_EMAIL" ? "Interna + email" : "Solo interna"}
          </p>
          {rule.channel === "INTERNAL_AND_EMAIL" ? (
            <p
              className="mt-1 text-xs font-semibold"
              style={{ color: "var(--color-warning)" }}
            >
              El envío por email está pendiente de configuración; en esta versión solo se
              genera la notificación interna.
            </p>
          ) : null}
          <p className="v-hint mt-1">
            Condiciones: {rule.conditions.length === 0 ? "ninguna" : rule.conditions.length} ·
            Destinatarios:{" "}
            {rule.actions
              .map((action) =>
                action.kind === "SPECIFIC_PERSON" ? action.personName ?? "persona" : action.kind,
              )
              .join(", ")}
          </p>
        </div>
        <form action={formAction}>
          <input type="hidden" name="id" value={rule.id} />
          <input type="hidden" name="isActive" value={rule.isActive ? "false" : "true"} />
          <AdminSubmit variant="quiet">{rule.isActive ? "Desactivar" : "Activar"}</AdminSubmit>
          <AdminFeedback state={state} />
        </form>
      </div>
    </li>
  );
}

function RuleForm({ action, options }: { action: AdminAction; options: RuleFormOptions }) {
  const [state, formAction] = useActionState(action, INITIAL_ADMIN_ACTION_STATE);

  const [allFields, setAllFields] = useState<string[]>([""]);
  const [anyFields, setAnyFields] = useState<string[]>([""]);
  const [actionKinds, setActionKinds] = useState<string[]>([""]);

  function updateAt(
    values: string[],
    setValues: (next: string[]) => void,
    index: number,
    value: string,
  ) {
    const next = values.slice();
    next[index] = value;
    setValues(nextProgressiveRowValues(next, ROW_COUNT));
  }

  return (
    <form action={formAction} noValidate className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField id="rule-name" label="Nombre" required error={state.errors.name}>
          <input id="rule-name" name="name" type="text" className="v-input" {...fieldAria("rule-name", state.errors.name)} />
        </FormField>
        <FormField id="rule-trigger" label="Disparador" required error={state.errors.trigger}>
          <select id="rule-trigger" name="trigger" className="v-input" defaultValue="">
            <option value="" disabled>
              Selecciona…
            </option>
            {TRIGGER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      <FormField id="rule-description" label="Descripción (opcional)" error={state.errors.description}>
        <textarea id="rule-description" name="description" rows={2} className="v-input" />
      </FormField>

      <fieldset className="v-card px-3 py-3">
        <legend className="px-1 text-xs font-bold uppercase tracking-wide text-[var(--color-primary)]">
          Cumplir TODAS las condiciones
        </legend>
        <div className="flex flex-col gap-2">
          {allFields.map((field, index) => (
            <ConditionRow
              key={index}
              prefix="condition_all"
              index={index}
              options={options}
              field={field}
              onFieldChange={(value) => updateAt(allFields, setAllFields, index, value)}
            />
          ))}
        </div>
      </fieldset>

      <fieldset className="v-card px-3 py-3">
        <legend className="px-1 text-xs font-bold uppercase tracking-wide text-[var(--color-primary)]">
          Cumplir CUALQUIERA de las condiciones
        </legend>
        <div className="flex flex-col gap-2">
          {anyFields.map((field, index) => (
            <ConditionRow
              key={index}
              prefix="condition_any"
              index={index}
              options={options}
              field={field}
              onFieldChange={(value) => updateAt(anyFields, setAnyFields, index, value)}
            />
          ))}
        </div>
      </fieldset>

      <fieldset className="v-card px-3 py-3">
        <legend className="px-1 text-xs font-bold uppercase tracking-wide text-[var(--color-primary)]">
          Destinatarios
        </legend>
        <div className="flex flex-col gap-2">
          {actionKinds.map((kind, index) => (
            <ActionRow
              key={index}
              index={index}
              people={options.people}
              kind={kind}
              onKindChange={(value) => updateAt(actionKinds, setActionKinds, index, value)}
            />
          ))}
        </div>
      </fieldset>

      <FormField id="rule-channel" label="Canal" required>
        <select id="rule-channel" name="channel" className="v-input" defaultValue="INTERNAL">
          <option value="INTERNAL">Solo interna</option>
          <option value="INTERNAL_AND_EMAIL">Interna + email</option>
        </select>
      </FormField>

      {state.errors._form ? (
        <p className="v-field-error" role="alert">
          {state.errors._form}
        </p>
      ) : null}

      <div>
        <AdminSubmit variant="primary">Crear regla</AdminSubmit>
      </div>
      <AdminFeedback state={state} />
    </form>
  );
}

function ConditionRow({
  prefix,
  index,
  options,
  field,
  onFieldChange,
}: {
  prefix: "condition_all" | "condition_any";
  index: number;
  options: RuleFormOptions;
  field: string;
  onFieldChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-end gap-2">
      <select
        name={`${prefix}_${index}_field`}
        className="v-input sm:w-48"
        value={field}
        onChange={(event) => onFieldChange(event.target.value)}
        aria-label="Campo de la condición"
      >
        {CONDITION_FIELD_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {field !== "" ? (
        <select
          name={`${prefix}_${index}_operator`}
          className="v-input sm:w-32"
          defaultValue="IS"
          aria-label="Operador"
        >
          <option value="IS">es</option>
          <option value="IS_NOT">no es</option>
        </select>
      ) : null}

      {field === "STATUS" ? (
        <select name={`${prefix}_${index}_value`} className="v-input sm:w-56" aria-label="Estado">
          <option value="">Selecciona…</option>
          {options.statuses.map((status) => (
            <option key={status.id} value={status.id}>
              {status.name}
            </option>
          ))}
        </select>
      ) : null}

      {field === "CLIENT" ? (
        <select name={`${prefix}_${index}_value`} className="v-input sm:w-56" aria-label="Cliente">
          <option value="">Selecciona…</option>
          {options.clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
      ) : null}

      {field === "PROJECT_MANAGER" || field === "COMMERCIAL" || field === "CREATOR" ? (
        <select name={`${prefix}_${index}_value`} className="v-input sm:w-56" aria-label="Persona">
          <option value="">Selecciona…</option>
          {options.people.map((person) => (
            <option key={person.id} value={person.id}>
              {person.name}
            </option>
          ))}
        </select>
      ) : null}
    </div>
  );
}

function ActionRow({
  index,
  people,
  kind,
  onKindChange,
}: {
  index: number;
  people: RuleFormOptions["people"];
  kind: string;
  onKindChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-end gap-2">
      <select
        name={`action_${index}_kind`}
        className="v-input sm:w-64"
        value={kind}
        onChange={(event) => onKindChange(event.target.value)}
        aria-label="Destinatario"
      >
        {RECIPIENT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {kind === "SPECIFIC_PERSON" ? (
        <select name={`action_${index}_personId`} className="v-input sm:w-56" aria-label="Persona destinataria">
          <option value="">Selecciona…</option>
          {people.map((person) => (
            <option key={person.id} value={person.id}>
              {person.name}
            </option>
          ))}
        </select>
      ) : null}
    </div>
  );
}
