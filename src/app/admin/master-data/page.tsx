import type { Metadata } from "next";
import { DatabaseConnectionError } from "@/components/ui/database-connection-error";
import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
import {
  createCatalogRecordAction,
  setCatalogRecordActiveAction,
  updateCatalogRecordAction,
} from "@/modules/master-data/actions";
import { getMasterDataGroups } from "@/modules/master-data/data";
import { MasterDataScreen } from "@/modules/master-data/master-data-screen";

export const metadata: Metadata = {
  title: "Maestros de oferta · Vincle Apps",
};

export const dynamic = "force-dynamic";

export default async function MasterDataPage() {
  let groups;
  try {
    groups = await getMasterDataGroups();
  } catch (error) {
    return <DatabaseConnectionError title="Maestros de oferta" error={error} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Maestros de oferta"
        subtitle="Alta, edición y activación o desactivación de los catálogos del Gestor de Ofertas. Ningún registro se elimina físicamente."
      />

      <Alert tone="warning" title="Pantalla sin restricción de acceso">
        <p>
          Mientras la autenticación siga pospuesta no existe ninguna
          restricción real a administradores: cualquiera que abra la
          aplicación puede modificar estos catálogos. Utilízala únicamente en
          local.
        </p>
      </Alert>

      <MasterDataScreen
        groups={groups}
        createAction={createCatalogRecordAction}
        updateAction={updateCatalogRecordAction}
        setActiveAction={setCatalogRecordActiveAction}
      />
    </div>
  );
}
