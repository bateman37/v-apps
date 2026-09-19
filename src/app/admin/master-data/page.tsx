import type { Metadata } from "next";
import { getMasterDataGroups } from "@/modules/master-data/data";
import { MasterDataScreen } from "@/modules/master-data/master-data-screen";
import { MasterDataConnectionError } from "@/modules/master-data/connection-error";

export const metadata: Metadata = {
  title: "Maestros · Vincle Apps",
};

// Lee siempre datos reales y actuales de PostgreSQL: no se prerenderiza
// como página estática, porque el contenido depende de la base de datos.
export const dynamic = "force-dynamic";

export default async function MasterDataPage() {
  const groups = await loadMasterDataGroups();

  if (groups === null) {
    return <MasterDataConnectionError />;
  }

  return <MasterDataScreen groups={groups} />;
}

async function loadMasterDataGroups() {
  try {
    return await getMasterDataGroups();
  } catch (error) {
    // El detalle técnico solo se conserva en la consola del servidor de
    // desarrollo (mecanismo normal de Next.js); nunca se muestra en la
    // interfaz para no exponer cadenas de conexión ni datos sensibles.
    if (process.env.NODE_ENV !== "production") {
      console.error("Error al leer los maestros desde PostgreSQL:", error);
    }
    return null;
  }
}
