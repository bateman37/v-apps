"use client";

import Link from "next/link";
import {
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Alert } from "@/components/ui/alert";
import { fieldAria, FormField } from "@/components/ui/form-field";
import { SubmitButton } from "@/components/ui/submit-button";
import { parseDecimal, sumDecimalStrings } from "@/lib/decimal";
import { formatDays } from "@/lib/format";
import {
  INITIAL_OFFER_FORM_STATE,
  type OfferFormState,
} from "@/modules/offers/form-state";
import type {
  OfferDetail,
  OfferFormOptions,
  SelectOption,
} from "@/modules/offers/data";
import {
  emptyOfferFormValues,
  profileDaysFieldName,
  type OfferFormValues,
} from "@/modules/offers/validation";

/**
 * Formulario de oferta, compartido literalmente por el alta (`/offers/new`) y
 * la modificación (`/offers/[id]/edit`): mismas secciones, mismos campos y
 * mismas reglas. La validación real vive en el servidor; lo que se hace aquí
 * es solo ayuda inmediata al usuario.
 *
 * ## Por qué el formulario es enteramente controlado (corrección de DEV-004)
 *
 * La versión anterior mezclaba dos fuentes de verdad: la mayoría de los campos
 * eran no controlados (`defaultValue`) mientras el estado y las jornadas vivían
 * en `useState`. Al completar una Server Action, React reinicia el formulario;
 * los campos no controlados volvían a su `defaultValue` mientras los
 * controlados conservaban su `useState` inicial —vacío en el alta—, de modo que
 * la interfaz y el `FormData` del siguiente envío podían divergir. Ese es el
 * origen del error reproducido: un primer guardado llegaba al contador con el
 * estado informado y el segundo intento fallaba con «El estado es obligatorio».
 *
 * Ahora hay **un único objeto de valores** en el estado del componente. Todos
 * los controles lo leen y lo escriben, y cuando el servidor responde con un
 * error se vuelcan los valores devueltos. Lo que se ve es exactamente lo que se
 * enviará.
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
    return emptyOfferFormValues();
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

  const [values, setValues] = useState<OfferFormValues>(initialValues);
  const lastAppliedSubmission = useRef(0);
  const errorSummaryRef = useRef<HTMLDivElement>(null);

  /**
   * Cuando el servidor devuelve un error, repone en el formulario **todos** los
   * valores enviados: textos, importes, fechas, desplegables, estado, motivo de
   * cancelación y jornadas por perfil. El testigo `submission` distingue una
   * respuesta nueva de un simple repintado, de modo que lo que el usuario haya
   * seguido escribiendo entretanto no se pisa sin motivo.
   */
  useEffect(() => {
    if (state.submission > lastAppliedSubmission.current && state.values) {
      lastAppliedSubmission.current = state.submission;
      setValues(state.values);
    }
  }, [state.submission, state.values]);

  const hasErrors = Object.keys(state.errors).length > 0;

  /** Foco accesible al resumen de errores tras una respuesta con problemas. */
  useEffect(() => {
    if (state.status === "error" && state.submission > 0) {
      errorSummaryRef.current?.focus();
    }
  }, [state.status, state.submission]);

  function setValue<K extends keyof OfferFormValues>(
    key: K,
    value: OfferFormValues[K],
  ) {
    setValues((previous) => ({ ...previous, [key]: value }));
  }

  function setProfileDays(profileId: string, value: string) {
    setValues((previous) => ({
      ...previous,
      profileDays: { ...previous.profileDays, [profileId]: value },
    }));
  }

  const errors = state.errors;
  const isCancelled = options.cancelledStatusIds.includes(values.statusId);
  const isAccepted = options.acceptedStatusIds.includes(values.statusId);

  const total = useMemo(() => {
    const parsedValues: string[] = [];
    for (const raw of Object.values(values.profileDays)) {
      const parsed = parseDecimal(raw, { scale: 2 });
      if (parsed.ok) {
        parsedValues.push(parsed.value);
      }
    }
    return sumDecimalStrings(parsedValues, 2);
  }, [values.profileDays]);

  return (
    <form action={formAction} noValidate className="flex flex-col gap-6">
      {mode === "edit" && offer ? (
        <input type="hidden" name="offerId" value={offer.id} />
      ) : null}

      {state.status === "error" ? (
        <div ref={errorSummaryRef} tabIndex={-1}>
          <Alert
            tone="error"
            title={errors._form ? "No se ha podido guardar" : "Revisa el formulario"}
          >
            {errors._form ? (
              <p>{errors._form}</p>
            ) : (
              <p>Hay campos con errores. Cada problema se indica junto a su campo.</p>
            )}
            {hasErrors ? (
              <p className="mt-1">
                Los datos que habías introducido se han conservado: corrige lo
                indicado y vuelve a guardar sin rellenarlo todo de nuevo.
              </p>
            ) : null}
          </Alert>
        </div>
      ) : null}

      <Section title="Identificación">
        <Grid>
          <SelectField
            id="clientId"
            label="Cliente"
            required
            options={options.clients}
            value={values.clientId}
            onChange={(value) => setValue("clientId", value)}
            error={errors.clientId}
            emptyLabel="Selecciona un cliente"
            emptyHint={
              options.clients.length === 0 ? (
                <>
                  No hay clientes activos con código.{" "}
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
            value={values.implantationText}
            onChange={(value) => setValue("implantationText", value)}
            error={errors.implantationText}
            hint="Texto libre opcional. Todavía no existe un maestro de implantaciones."
          />
          <SelectField
            id="priorityId"
            label="Prioridad"
            required
            options={options.priorities}
            value={values.priorityId}
            onChange={(value) => setValue("priorityId", value)}
            error={errors.priorityId}
            emptyLabel="Selecciona una prioridad"
          />
          <SelectField
            id="originId"
            label="Origen"
            required
            options={options.origins}
            value={values.originId}
            onChange={(value) => setValue("originId", value)}
            error={errors.originId}
            emptyLabel="Selecciona un origen"
          />
          <SelectField
            id="commercialId"
            label="Comercial"
            required
            options={options.commercials}
            value={values.commercialId}
            onChange={(value) => setValue("commercialId", value)}
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
            value={values.projectManagerId}
            onChange={(value) => setValue("projectManagerId", value)}
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
            value={values.offerDate}
            onChange={(value) => setValue("offerDate", value)}
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
              value={values.description}
              onChange={(event) => setValue("description", event.target.value)}
              {...fieldAria("description", errors.description)}
            />
          </FormField>

          <Grid>
            <SelectField
              id="offerTypeId"
              label="Tipo de oferta"
              required
              options={options.offerTypes}
              value={values.offerTypeId}
              onChange={(value) => setValue("offerTypeId", value)}
              error={errors.offerTypeId}
              emptyLabel="Selecciona un tipo"
            />
            <SelectField
              id="segmentationId"
              label="Segmentación"
              options={options.segmentations}
              value={values.segmentationId}
              onChange={(value) => setValue("segmentationId", value)}
              error={errors.segmentationId}
              emptyLabel="Sin segmentación"
            />
            <TextField
              id="requesterName"
              label="Nombre del solicitante"
              required
              value={values.requesterName}
              onChange={(value) => setValue("requesterName", value)}
              error={errors.requesterName}
            />
          </Grid>

          <FormField
            id="notes"
            label="Observaciones"
            error={errors.notes}
          >
            <textarea
              id="notes"
              name="notes"
              rows={4}
              className="v-input"
              value={values.notes}
              onChange={(event) => setValue("notes", event.target.value)}
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
            value={values.estimatedCommercialDeliveryDate}
            onChange={(value) => setValue("estimatedCommercialDeliveryDate", value)}
            error={errors.estimatedCommercialDeliveryDate}
          />
          <TextField
            id="estimatedClientDeliveryDate"
            label="Fecha estimada de entrega al cliente"
            type="date"
            value={values.estimatedClientDeliveryDate}
            onChange={(value) => setValue("estimatedClientDeliveryDate", value)}
            error={errors.estimatedClientDeliveryDate}
          />
          <TextField
            id="estimatedPortfolioDate"
            label="Fecha estimada de cartera"
            type="date"
            value={values.estimatedPortfolioDate}
            onChange={(value) => setValue("estimatedPortfolioDate", value)}
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
                  value={values.profileDays[profile.id] ?? ""}
                  onChange={(event) =>
                    setProfileDays(profile.id, event.target.value)
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
              value={values.commercialDays}
              onChange={(value) => setValue("commercialDays", value)}
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
            value={values.totalAmount}
            onChange={(value) => setValue("totalAmount", value)}
            error={errors.totalAmount}
            inputMode="decimal"
            hint="Usa coma o punto como separador decimal. 0,00 € es un valor válido."
          />
          <FormField id="statusId" label="Estado" required error={errors.statusId}>
            <select
              id="statusId"
              name="statusId"
              className="v-input"
              value={values.statusId}
              onChange={(event) => setValue("statusId", event.target.value)}
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
            required={isAccepted}
            value={values.navisionOrder}
            onChange={(value) => setValue("navisionOrder", value)}
            error={errors.navisionOrder}
            hint={
              isAccepted
                ? "Obligatorio con el estado «Aceptado» (DEC-052)."
                : "Opcional salvo con el estado «Aceptado». Si se abandona ese estado, el valor ya informado no se borra."
            }
          />
          {isCancelled ? (
            <SelectField
              id="cancellationReasonId"
              label="Motivo de cancelación"
              required
              options={options.cancellationReasons}
              value={values.cancellationReasonId}
              onChange={(value) => setValue("cancellationReasonId", value)}
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
          ) : (
            // El valor elegido se conserva en el envío aunque el campo deje de
            // mostrarse: así la interfaz y el `FormData` nunca divergen.
            <input
              type="hidden"
              name="cancellationReasonId"
              value={values.cancellationReasonId}
            />
          )}
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
  value,
  onChange,
  error,
  required,
  hint,
  type = "text",
  inputMode,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
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
        value={value}
        onChange={(event) => onChange(event.target.value)}
        {...fieldAria(id, error, Boolean(hint))}
      />
    </FormField>
  );
}

function SelectField({
  id,
  label,
  options,
  value,
  onChange,
  error,
  required,
  emptyLabel,
  emptyHint,
}: {
  id: string;
  label: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  emptyLabel: string;
  emptyHint?: ReactNode;
}) {
  /**
   * Si el valor enviado ya no está entre las opciones (por ejemplo, un maestro
   * desactivado entre dos intentos de guardado), se añade explícitamente como
   * opción para no perderlo en silencio al repintar el formulario.
   */
  const isKnown = value === "" || options.some((option) => option.id === value);

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
        value={value}
        onChange={(event) => onChange(event.target.value)}
        {...fieldAria(id, error, Boolean(emptyHint))}
      >
        <option value="">{emptyLabel}</option>
        {!isKnown ? (
          <option value={value}>Valor seleccionado (ya no disponible)</option>
        ) : null}
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </FormField>
  );
}
