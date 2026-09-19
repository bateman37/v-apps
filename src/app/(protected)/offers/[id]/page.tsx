import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getOfferDetail, getReviewStatusOptions } from "@/modules/offers/data";
import { OfferDetailScreen } from "@/modules/offers/offer-detail-screen";
import { requireUser } from "@/modules/auth/session";

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
  const user = await requireUser();
  const { id } = await params;
  const offer = await getOfferDetail(id, user);

  if (!offer) {
    notFound();
  }

  const { saved } = await searchParams;
  const savedNotice =
    saved === "created" || saved === "updated" ? saved : null;
  const reviewStatusOptions = await getReviewStatusOptions();

  return (
    <OfferDetailScreen
      offer={offer}
      savedNotice={savedNotice}
      reviewStatusOptions={reviewStatusOptions}
    />
  );
}
