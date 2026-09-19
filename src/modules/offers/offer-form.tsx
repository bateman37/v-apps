"use client";

import Link from "next/link";
import { useActionState, useMemo, useState, type ReactNode } from "react";
import { Alert } from "@/components/ui/alert";
import { fieldAria, FormField } from "@/components/ui/form-field";
import { SubmitButton } from "@/components/ui/submit-button";
import { parseDecimal, sumDecimalStrings } from "@/lib/decimal";
import { formatDays } from "@/lib/format";
import {
  INITIAL_OFFER_FORM_STATE,
  type OfferFormState,
} from "@/modules/offers/form-state";
import type { OfferDetail, OfferFormOptions, SelectOption } from "@/modules/offers/data";
import { profileDaysFieldName, type OfferFormValues } from "@/modules/offers/validation";

/**
 * Formulario de oferta, compartido literalmente por el alta (`/offers/new`) y
 * la modificación (`/offers/[id]/edit`): mismas secciones, mismos campos y
 * mismas reglas. Es un componente de cliente porque necesita reaccionar al
 * estado seleccionado (para pedir el motivo de cancelación) y recalcular el
 * total de jornadas mientras se escribe.
 *
 * La validación real vive en el servidor: lo que se hace aquí es solo ayuda
 * inmediata al usuario.
 */

export type OfferFormAction = (
  state: OfferFormState,
  formData: FormData,
) => Promise<OfferFormState>;

type OfferFormProps = {
  mode: "create" | "edit";
  action: OfferFormAction;
  options: OfferFormOptions;
  offer?: OfferDetail;
};

function initialValuesFrom(offer?: OfferDetail): OfferFormValues {
  if (!offer) {
    return {
      clientId: "",
      implantationText: "",
      priorityId: "",
      originId: "",
      commercialId: "",
      projectManagerId: "",
      offerDate: "",
      description: "",
      offerTypeId: "",
      segmentationId: "",
      requesterName: "",
      languageId: "",
      notes: "",
      estimatedCommercialDeliveryDate: "",
      estimatedClientDeliveryDate: "",
      estimatedPortfolioDate: "",
      commercialDays: "",
      totalAmount: "",
      statusId: "",
      cancellationReasonId: "",
      navisionOrder: "",
      profileDays: {},
    };
  }

  const profileDays: Record<string, string> = {};
  for (const entry of offer.profileDays) {
    profileDays[entry.professionalProfileId] = entry.days;
  }

  return {
    clientId: offer.clientId,
    implantationText: offer.implantationText ?? "",
    priorityId: offer.priorityId,
    originId: offer.originId,
    commercialId: offer.commercialId,
    projectManagerId: offer.projectManagerId,
    offerDate: offer.offerDate,
    description: offer.description,
    offerTypeId: offer.offerTypeId,
    segmentationId: offer.segmentationId ?? "",
    requesterName: offer.requesterName,
    languageId: offer.languageId ?? "",
    notes: offer.notes ?? "",
    estimatedCommercialDeliveryDate: offer.estimatedCommercialDeliveryDate ?? "",
    estimatedClientDeliveryDate: offer.estimatedClientDeliveryDate ?? "",
    estimatedPortfolioDate: offer.estimatedPortfolioDate ?? "",
    commercialDays: offer.commercialDays ?? "",
    totalAmount: offer.totalAmount,
    statusId: offer.statusId,
    cancellationReasonId: offer.cancellationReasonId ?? "",
    navisionOrder: offer.navisionOrder ?? "",
    profileDays,
  };
}

export function OfferForm({ mode, action, options, offer }: OfferFormProps) {
  const initialValues = useMemo(() => initialValuesFrom(offer), [offer]);
  const [state, formAction] = useActionState(action, INITIAL_OFFER_FORM_STATE);
  const values = state.values ?? initialValues;
  const errors = state.errors;

  const [statusId, setStatusId] = useState(initialValues.statusId);
  const [profileDays, setProfileDays] = useState<Record<string, string>>(
    initialValues.profileDays,
  );

  const isCancelled = options.cancelledStatusIds.includes(statusId);

  const total = useMemo(() => {
    const parsedValues: string[] = [];
    for (const raw of Object.values(profileDays)) {
      const parsed = parseDecimal(raw, { scale: 2 });
      if (parsed.ok) {
        parsedValues.push(parsed.value);
      }
    }
    return sumDecimalStrings(parsedValues, 2);
  }, [profileDays]);

  return (
    <form action={formAction} noValidate className="flex flex-col gap-6">
      {mode === "edit" && offer ? (
        <input type="hidden" name="offerId" value={offer.id} />
      ) : null}

      {errors._form ? <Alert tone="error">{errors._form}</Alert> : null}

      {state.status === "error" && !errors._form ? (
        <Alert tone="error" title="Revisa el formulario">
          Hay campos con errores. Cada problema se indica junto a su campo.
        </Alert>
      ) : null}

      <Section title="Identificación">
        <Grid>
          <SelectField
            id="clientId"
            label="Cliente"
            required
            options={options.clients}
            defaultValue={values.clientId}
            error={errors.clientId}
            emptyLabel="Selecciona un cliente"
            emptyHint={
              options.clients.length === 0 ? (
                <>
                  No hay clientes activos.{" "}
                  <Link className="v-link" href="/admin/clients">
                    Crea uno en Administración
                  </Link>
                  .
                </>
              ) : undefined
            }
          />
          <TextField
            id="implantationText"
            label="Implantación"
            defaultValue={values.implantationText}
            error={errors.implantationText}
            hint="Texto libre opcional. Todavía no existe un maestro de implantaciones."
          />
          <SelectField
            id="priorityId"
            label="Prioridad"
            required
            options={options.priorities}
            defaultValue={values.priorityId}
            error={errors.priorityId}
            emptyLabel="Selecciona una prioridad"
          />
          <SelectField
            id="originId"
            label="Origen"
            required
            options={options.origins}
            defaultValue={values.originId}
            error={errors.originId}
            emptyLabel="Selecciona un origen"
          />
          <SelectField
            id="commercialId"
            label="Comercial"
            required
            options={options.commercials}
            defaultValue={values.commercialId}
            error={errors.commercialId}
            emptyLabel="Selecciona un comercial"
            emptyHint={
              options.commercials.length === 0 ? (
                <>
                  No hay personas habilitadas como comercial.{" "}
                  <Link className="v-link" href="/admin/people">
                    Crea una en Administración
                  </Link>
                  .
                </>
              ) : undefined
            }
          />
          <SelectField
            id="projectManagerId"
            label="Project Manager"
            required
            options={options.projectManagers}
            defaultValue={values.projectManagerId}
            error={errors.projectManagerId}
            emptyLabel="Selecciona un Project Manager"
            emptyHint={
              options.projectManagers.length === 0 ? (
                <>
                  No hay personas habilitadas como PM.{" "}
                  <Link className="v-link" href="/admin/people">
                    Crea una en Administración
                  </Link>
                  .
                </>
              ) : undefined
            }
          />
          <TextField
            id="offerDate"
            label="Fecha de la oferta"
            type="date"
            required
            defaultValue={values.offerDate}
            error={errors.offerDate}
          />
        </Grid>
      </Section>

      <Section title="Descripción y clasificación">
        <div className="flex flex-col gap-4">
          <FormField
            id="description"
            label="Descripción"
            required
            error={errors.description}
          >
            <textarea
              id="description"
              name="description"
              rows={3}
              className="v-input"
              defaultValue={values.description}
              {...fieldAria("description", errors.description)}
            />
          </FormField>

          <Grid>
            <SelectField
              id="offerTypeId"
              label="Tipo de oferta"
              required
              options={options.offerTypes}
              defaultValue={values.offerTypeId}
              error={errors.offerTypeId}
              emptyLabel="Selecciona un tipo"
            />
            <SelectField
              id="segmentationId"
              label="Segmentación"
              options={options.segmentations}
              defaultValue={values.segmentationId}
              error={errors.segmentationId}
              emptyLabel="Sin segmentación"
            />
            <TextField
              id="requesterName"
              label="Nombre del solicitante"
              required
              defaultValue={values.requesterName}
              error={errors.requesterName}
            />
            <SelectField
              id="languageId"
              label="Idioma"
              options={options.languages}
              defaultValue={values.languageId}
              error={errors.languageId}
              emptyLabel="Sin idioma"
              emptyHint={
                options.languages.length === 0
                  ? "Todavía no hay idiomas dados de alta en Administración > Maestros de oferta."
                  : undefined
              }
            />
          </Grid>

          <FormField id="notes" label="Observaciones" error={errors.notes}>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              className="v-input"
              defaultValue={values.notes}
              {...fieldAria("notes", errors.notes)}
            />
          </FormField>
        </div>
      </Section>

      <Section title="Planificación">
        <Grid>
          <TextField
            id="estimatedCommercialDeliveryDate"
            label="Fecha estimada de entrega comercial"
            type="date"
            defaultValue={values.estimatedCommercialDeliveryDate}
            error={errors.estimatedCommercialDeliveryDate}
          />
          <TextField
            id="estimatedClientDeliveryDate"
            label="Fecha estimada de entrega al cliente"
            type="date"
            defaultValue={values.estimatedClientDeliveryDate}
            error={errors.estimatedClientDeliveryDate}
          />
          <TextField
            id="estimatedPortfolioDate"
            label="Fecha estimada de cartera"
            type="date"
            defaultValue={values.estimatedPortfolioDate}
            error={errors.estimatedPortfolioDate}
          />
        </Grid>
      </Section>

      <Section
        title="Estimación por perfil"
        description="Deja en blanco los perfiles sin jornadas. Un valor vacío o cero no genera ningún registro."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {options.professionalProfiles.map((profile) => {
            const fieldName = profileDaysFieldName(profile.id);
            const error = errors[fieldName];
            return (
              <FormField
                key={profile.id}
                id={fieldName}
                label={`${profile.name}${profile.isActive ? "" : " (inactivo)"}`}
                error={error}
              >
                <input
                  id={fieldName}
                  name={fieldName}
                  type="text"
                  inputMode="decimal"
                  className="v-input v-num"
                  value={profileDays[profile.id] ?? ""}
                  onChange={(event) =>
                    setProfileDays((previous) => ({
                      ...previous,
                      [profile.id]: event.target.value,
                    }))
                  }
                  {...fieldAria(fieldName, error)}
                />
              </FormField>
            );
          })}
        </div>

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="sm:max-w-xs sm:grow">
            <TextField
              id="commercialDays"
              label="Jornadas comerciales"
              defaultValue={values.commercialDays}
              error={errors.commercialDays}
              inputMode="decimal"
              hint="Concepto separado: no se suma al total de jornadas por perfil."
            />
          </div>
          <p
            className="rounded-md px-3 py-2 text-sm font-semibold"
            style={{
              backgroundColor: "var(--color-accent-soft)",
              color: "var(--color-accent-text)",
            }}
          >
            Total de jornadas por perfil:{" "}
            <span className="v-num">{formatDays(total)}</span>
          </p>
        </div>
      </Section>

      <Section title="Situación comercial">
        <Grid>
          <TextField
            id="totalAmount"
            label="Importe total (€)"
            required
            defaultValue={values.totalAmount}
            error={errors.totalAmount}
            inputMode="decimal"
            hint="Usa coma o punto como separador decimal. 0,00 € es un valor válido."
          />
          <FormField id="statusId" label="Estado" required error={errors.statusId}>
            <select
              id="statusId"
              name="statusId"
              className="v-input"
              value={statusId}
              onChange={(event) => setStatusId(event.target.value)}
              {...fieldAria("statusId", errors.statusId)}
            >
              <option value="">Selecciona un estado</option>
              {options.statuses.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>
          <TextField
            id="navisionOrder"
            label="Pedido / identificador de Navision"
            defaultValue={values.navisionOrder}
            error={errors.navisionOrder}
            hint="Opcional en todos los estados mientras DEC-052 siga pendiente."
          />
          {isCancelled ? (
            <SelectField
              id="cancellationReasonId"
              label="Motivo de cancelación"
              required
              options={options.cancellationReasons}
              defaultValue={values.cancellationReasonId}
              error={errors.cancellationReasonId}
              emptyLabel="Selecciona un motivo"
              emptyHint={
                options.cancellationReasons.length === 0 ? (
                  <>
                    No hay motivos de cancelación dados de alta.{" "}
                    <Link className="v-link" href="/admin/master-data">
                      Crea uno en Administración &gt; Maestros de oferta
                    </Link>{" "}
                    antes de anular la oferta.
                  </>
                ) : undefined
              }
            />
          ) : null}
        </Grid>
        {!isCancelled ? (
          <p className="v-hint mt-2">
            El motivo de cancelación solo se pide, y solo se conserva, cuando el
            estado es «Anulado».
          </p>
        ) : null}
      </Section>

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton>
          {mode === "create" ? "Guardar oferta" : "Guardar cambios"}
        </SubmitButton>
        <Link
          className="v-btn v-btn-secondary"
          href={mode === "edit" && offer ? `/offers/${offer.id}` : "/offers"}
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <fieldset className="v-card px-4 py-4">
      <legend className="px-1 text-sm font-bold uppercase tracking-wide text-[var(--color-primary)]">
        {title}
      </legend>
      {description ? <p className="v-hint mb-3">{description}</p> : null}
      {children}
    </fieldset>
  );
}

function Grid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {children}
    </div>
  );
}

function TextField({
  id,
  label,
  defaultValue,
  error,
  required,
  hint,
  type = "text",
  inputMode,
}: {
  id: string;
  label: string;
  defaultValue: string;
  error?: string;
  required?: boolean;
  hint?: ReactNode;
  type?: "text" | "date";
  inputMode?: "decimal";
}) {
  return (
    <FormField id={id} label={label} error={error} required={required} hint={hint}>
      <input
        id={id}
        name={id}
        type={type}
        inputMode={inputMode}
        className={`v-input${inputMode === "decimal" ? " v-num" : ""}`}
        defaultValue={defaultValue}
        {...fieldAria(id, error, Boolean(hint))}
      />
    </FormField>
  );
}

function SelectField({
  id,
  label,
  options,
  defaultValue,
  error,
  required,
  emptyLabel,
  emptyHint,
}: {
  id: string;
  label: string;
  options: SelectOption[];
  defaultValue: string;
  error?: string;
  required?: boolean;
  emptyLabel: string;
  emptyHint?: ReactNode;
}) {
  return (
    <FormField
      id={id}
      label={label}
      error={error}
      required={required}
      hint={emptyHint}
    >
      <select
        id={id}
        name={id}
        className="v-input"
        defaultValue={defaultValue}
        {...fieldAria(id, error, Boolean(emptyHint))}
      >
        <option value="">{emptyLabel}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </FormField>
  );
}
