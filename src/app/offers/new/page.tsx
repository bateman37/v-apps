import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { createOfferAction } from "@/modules/offers/actions";
import { getOfferFormOptions } from "@/modules/offers/data";
import { OfferForm } from "@/modules/offers/offer-form";

export const metadata: Metadata = {
  title: "Nueva oferta · Vincle Apps",
};

export const dynamic = "force-dynamic";

export default async function NewOfferPage() {
  const options = await getOfferFormOptions();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Nueva oferta"
        subtitle={
          <>
            Número de oferta:{" "}
            <strong>Se asignará al guardar</strong>. El número se consume
            únicamente en el primer guardado correcto: abrir o cancelar este
            formulario no gasta ninguno.
          </>
        }
        actions={
          <Link className="v-btn v-btn-secondary" href="/offers">
            Volver al listado
          </Link>
        }
      />

      <OfferForm mode="create" action={createOfferAction} options={options} />
    </div>
  );
}
