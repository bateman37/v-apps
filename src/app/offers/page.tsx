import type { Metadata } from "next";
import { OffersScreen } from "@/modules/offers/offers-screen";

export const metadata: Metadata = {
  title: "Gestor de Ofertas · Vincle Apps",
};

export default function OffersPage() {
  return <OffersScreen />;
}
