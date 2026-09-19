import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { updateOfferAction } from "@/modules/offers/actions";
import { getOfferDetail, getOfferFormOptions } from "@/modules/offers/data";
import { OfferForm } from "@/modules/offers/offer-form";

export const metadata: Metadata = {
  title: "Modificar oferta · Vincle Apps",
};

export const dynamic = "force-dynamic";

export default async function EditOfferPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const offer = await getOfferDetail(id);

  if (!offer) {
    notFound();
  }

  // Los maestros ya usados por esta oferta siguen siendo seleccionables
  // aunque se hayan desactivado después.
  const options = await getOfferFormOptions({
    clientId: offer.clientId,
    priorityId: offer.priorityId,
    originId: offer.originId,
    offerTypeId: offer.offerTypeId,
    statusId: offer.statusId,
    segmentationId: offer.segmentationId,
    languageId: offer.languageId,
    cancellationReasonId: offer.cancellationReasonId,
    commercialId: offer.commercialId,
    projectManagerId: offer.projectManagerId,
    professionalProfileIds: offer.profileDays.map(
      (entry) => entry.professionalProfileId,
    ),
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Modificar ${offer.number}`}
        subtitle="El número de oferta y la fecha de creación no cambian nunca al modificar."
        actions={
          <Link className="v-btn v-btn-secondary" href={`/offers/${offer.id}`}>
            Volver a la oferta
          </Link>
        }
      />

      <OfferForm
        mode="edit"
        action={updateOfferAction}
        options={options}
        offer={offer}
      />
    </div>
  );
}
