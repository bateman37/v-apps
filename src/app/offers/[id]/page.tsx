import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getOfferDetail } from "@/modules/offers/data";
import { OfferDetailScreen } from "@/modules/offers/offer-detail-screen";

export const metadata: Metadata = {
  title: "Oferta · Vincle Apps",
};

export const dynamic = "force-dynamic";

export default async function OfferDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { id } = await params;
  const offer = await getOfferDetail(id);

  if (!offer) {
    notFound();
  }

  const { saved } = await searchParams;
  const savedNotice =
    saved === "created" || saved === "updated" ? saved : null;

  return <OfferDetailScreen offer={offer} savedNotice={savedNotice} />;
}
