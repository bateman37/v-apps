import Link from "next/link";
import type { ReactNode } from "react";
import { Alert } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/page-header";
import {
  formatCurrencyEur,
  formatDate,
  formatDateTime,
  formatDays,
} from "@/lib/format";
import type { OfferDetail, ReviewStatusOption } from "@/modules/offers/data";
import {
  PENDING_PM_REVIEW_STATUS_CODE,
  PENDING_SALES_REVIEW_STATUS_CODE,
} from "@/modules/auth/identity";
import { ArchiveControls } from "@/modules/offers/archive-controls";
import {
  AttachmentUploadForm,
  RemoveAttachmentForm,
} from "@/modules/offers/attachment-controls";
import { CommentForm } from "@/modules/offers/comment-form";
import { ReviewForm } from "@/modules/offers/review-form";

/** Pantalla de consulta de una oferta. */
export function OfferDetailScreen({
  offer,
  savedNotice,
  reviewStatusOptions,
}: {
  offer: OfferDetail;
  savedNotice: "created" | "updated" | null;
  reviewStatusOptions: ReviewStatusOption[];
}) {
  const isArchived = offer.archivedAt !== null;
  const isPendingReview =
    offer.statusCode === PENDING_PM_REVIEW_STATUS_CODE ||
    offer.statusCode === PENDING_SALES_REVIEW_STATUS_CODE;

  return (
    <div className="flex flex-col gap-6">
      {savedNotice ? (
        <Alert
          tone="success"
          title={
            savedNotice === "created" ? "Oferta creada" : "Cambios guardados"
          }
        >
          {savedNotice === "created" ? (
            <>
              Se ha asignado automáticamente el número{" "}
              <strong className="v-num">{offer.number}</strong>. El número no
              cambiará al modificar la oferta.
            </>
          ) : (
            <>
              La oferta <strong className="v-num">{offer.number}</strong> se ha
              actualizado. El número y la fecha de creación no cambian.
            </>
          )}
        </Alert>
      ) : null}

      {isArchived ? (
        <Alert tone="warning" title="Oferta archivada">
          Archivada{offer.archivedByName ? ` por ${offer.archivedByName}` : ""}. No se
          ha borrado nada: recupérala para poder modificar sus datos.
        </Alert>
      ) : null}

      <PageHeader
        title={offer.number}
        subtitle={`${offer.clientName} · ${offer.statusName}`}
        actions={
          <>
            {offer.canModify && !isArchived ? (
              <Link className="v-btn v-btn-primary" href={`/offers/${offer.id}/edit`}>
                Modificar
              </Link>
            ) : null}
            {offer.canModify ? (
              <ArchiveControls
                offerId={offer.id}
                offerNumber={offer.number}
                isArchived={isArchived}
              />
            ) : null}
            <Link className="v-btn v-btn-secondary" href="/offers">
              Volver al listado
            </Link>
          </>
        }
      />

      {isPendingReview && offer.canModify && !isArchived ? (
        <Card title="Revisar">
          <ReviewForm
            offerId={offer.id}
            currentStatusId={offer.statusId}
            statusOptions={reviewStatusOptions}
          />
        </Card>
      ) : null}

      <Card title="Identificación">
        <DefinitionGrid>
          <Item label="Número de oferta">
            <span className="v-num font-semibold">{offer.number}</span>
          </Item>
          <Item label="Cliente">
            {offer.clientCode ? `${offer.clientCode} · ` : ""}
            {offer.clientName}
          </Item>
          <Item label="Implantación">{offer.implantationText ?? "—"}</Item>
          <Item label="Prioridad">{offer.priorityName}</Item>
          <Item label="Origen">{offer.originName}</Item>
          <Item label="Comercial">{offer.commercialName}</Item>
          <Item label="Project Manager">{offer.projectManagerName}</Item>
          <Item label="Fecha de la oferta">{formatDate(offer.offerDate)}</Item>
        </DefinitionGrid>
      </Card>

      <Card title="Descripción y clasificación">
        <DefinitionGrid>
          <Item label="Descripción" wide>
            {offer.description}
          </Item>
          <Item label="Tipo de oferta">{offer.offerTypeName}</Item>
          <Item label="Segmentación">{offer.segmentationName ?? "—"}</Item>
          <Item label="Solicitante">{offer.requesterName}</Item>
          <Item label="Idioma">{offer.languageName ?? "—"}</Item>
          <Item label="Observaciones" wide>
            {offer.notes ?? "—"}
          </Item>
        </DefinitionGrid>
      </Card>

      <Card title="Planificación">
        <DefinitionGrid>
          <Item label="Entrega comercial estimada">
            {formatDate(offer.estimatedCommercialDeliveryDate)}
          </Item>
          <Item label="Entrega al cliente estimada">
            {formatDate(offer.estimatedClientDeliveryDate)}
          </Item>
          <Item label="Fecha estimada de cartera">
            {formatDate(offer.estimatedPortfolioDate)}
          </Item>
        </DefinitionGrid>
      </Card>

      <Card title="Estimación por perfil">
        {offer.profileDays.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">
            Esta oferta no tiene jornadas por perfil informadas.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="v-table">
              <thead>
                <tr>
                  <th scope="col">Perfil</th>
                  <th scope="col">Código</th>
                  <th scope="col" className="text-right">
                    Jornadas
                  </th>
                </tr>
              </thead>
              <tbody>
                {offer.profileDays.map((entry) => (
                  <tr key={entry.professionalProfileId}>
                    <td>{entry.profileName}</td>
                    <td className="font-mono text-xs text-[var(--color-text-muted)]">
                      {entry.profileCode}
                    </td>
                    <td className="v-num text-right">{formatDays(entry.days)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row" colSpan={2}>
                    Total calculado
                  </th>
                  <td
                    className="v-num text-right font-bold"
                    style={{ color: "var(--color-accent-text)" }}
                  >
                    {formatDays(offer.totalProfileDays)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        <p className="v-hint mt-3">
          Jornadas comerciales (concepto separado, no incluido en el total):{" "}
          <span className="v-num font-semibold">
            {formatDays(offer.commercialDays)}
          </span>
        </p>
      </Card>

      <Card title="Situación comercial">
        <DefinitionGrid>
          <Item label="Importe total">
            <span className="v-num font-semibold">
              {formatCurrencyEur(offer.totalAmount)}
            </span>
          </Item>
          <Item label="Estado">{offer.statusName}</Item>
          <Item label="Motivo de cancelación">
            {offer.cancellationReasonName ?? "—"}
          </Item>
          <Item label="Pedido de Navision">{offer.navisionOrder ?? "—"}</Item>
        </DefinitionGrid>
      </Card>

      <Card title="Histórico de estados">
        <div className="overflow-x-auto">
          <table className="v-table">
            <thead>
              <tr>
                <th scope="col">Fecha y hora</th>
                <th scope="col">Estado anterior</th>
                <th scope="col">Estado nuevo</th>
                <th scope="col">Autor</th>
              </tr>
            </thead>
            <tbody>
              {offer.statusHistory.map((entry) => (
                <tr key={entry.id}>
                  <td className="v-num">{formatDateTime(entry.changedAt)}</td>
                  <td>{entry.previousStatusName ?? "Alta de la oferta"}</td>
                  <td>{entry.newStatusName}</td>
                  <td>{entry.actorName ?? UNKNOWN_ACTOR_LABEL}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="v-hint mt-3">
          Solo se registra un evento cuando el estado cambia realmente.
        </p>
      </Card>

      <Card title="Comentarios internos">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            {offer.comments.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)]">
                Todavía no hay comentarios.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {offer.comments.map((comment) => (
                  <li key={comment.id} className="v-card px-3 py-2">
                    <p className="whitespace-pre-line text-sm">{comment.body}</p>
                    <p className="v-hint mt-1">
                      {comment.authorName ?? UNKNOWN_ACTOR_LABEL} ·{" "}
                      {formatDateTime(comment.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <CommentForm offerId={offer.id} />
          </div>
        </div>
      </Card>

      <Card title="Adjuntos">
        {offer.canModify && !isArchived ? (
          <div className="mb-4">
            <AttachmentUploadForm offerId={offer.id} />
          </div>
        ) : null}
        {offer.attachments.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">
            No hay documentos adjuntos.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="v-table">
              <thead>
                <tr>
                  <th scope="col">Nombre</th>
                  <th scope="col">Tipo</th>
                  <th scope="col" className="text-right">
                    Tamaño
                  </th>
                  <th scope="col">Autor</th>
                  <th scope="col">Fecha</th>
                  <th scope="col">Estado</th>
                  <th scope="col">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {offer.attachments.map((attachment) => (
                  <tr key={attachment.id}>
                    <td>
                      {attachment.removedAt ? (
                        attachment.originalName
                      ) : (
                        <Link
                          className="v-link"
                          href={`/offers/${offer.id}/attachments/${attachment.id}`}
                        >
                          {attachment.originalName}
                        </Link>
                      )}
                    </td>
                    <td className="font-mono text-xs">{attachment.contentType}</td>
                    <td className="v-num text-right">
                      {(attachment.sizeBytes / 1024).toFixed(0)} KB
                    </td>
                    <td>{attachment.uploadedByName ?? UNKNOWN_ACTOR_LABEL}</td>
                    <td className="v-num">{formatDateTime(attachment.createdAt)}</td>
                    <td>{attachment.removedAt ? "Retirado" : "Disponible"}</td>
                    <td>
                      {attachment.canRemove && !attachment.removedAt ? (
                        <RemoveAttachmentForm
                          offerId={offer.id}
                          attachmentId={attachment.id}
                        />
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="v-hint mt-3">
          Máximo 25 MB por archivo. Formatos admitidos: PDF, Word, Excel, PowerPoint,
          imágenes y mensajes de Outlook (.msg).
        </p>
      </Card>

      <Card title="Control de registro">
        <DefinitionGrid>
          <Item label="Creada">{formatDateTime(offer.createdAt)}</Item>
          <Item label="Creada por">{offer.createdByName ?? UNKNOWN_ACTOR_LABEL}</Item>
          <Item label="Última modificación">{formatDateTime(offer.updatedAt)}</Item>
        </DefinitionGrid>
      </Card>
    </div>
  );
}

const UNKNOWN_ACTOR_LABEL = "Usuario no disponible (registro anterior al login)";

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="v-card">
      <header className="v-card-header">
        <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--color-primary)]">
          {title}
        </h2>
      </header>
      <div className="px-4 py-4">{children}</div>
    </section>
  );
}

function DefinitionGrid({ children }: { children: ReactNode }) {
  return (
    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {children}
    </dl>
  );
}

function Item({
  label,
  wide,
  children,
}: {
  label: string;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={wide ? "sm:col-span-2 lg:col-span-3" : undefined}>
      <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm whitespace-pre-line">{children}</dd>
    </div>
  );
}
