import type { Metadata } from "next";
import { Alert } from "@/components/ui/alert";
import { DatabaseConnectionError } from "@/components/ui/database-connection-error";
import { PageHeader } from "@/components/ui/page-header";
import {
  createClientAction,
  setClientActiveAction,
  updateClientAction,
} from "@/modules/admin/clients/actions";
import {
  getClients,
  parseClientFilters,
  type RawSearchParams,
} from "@/modules/admin/clients/data";
import { ClientsScreen } from "@/modules/admin/clients/clients-screen";

export const metadata: Metadata = {
  title: "Clientes · Vincle Apps",
};

export const dynamic = "force-dynamic";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const filters = parseClientFilters(await searchParams);

  let clients;
  try {
    clients = await getClients(filters);
  } catch (error) {
    return <DatabaseConnectionError title="Clientes" error={error} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Clientes"
        subtitle="Maestro de clientes del Gestor de Ofertas. Un cliente utilizado por ofertas nunca se elimina: se desactiva."
      />

      <Alert tone="warning" title="Pantalla sin restricción de acceso">
        <p>
          La restricción real a administradores sigue pendiente porque todavía
          no hay autenticación. Esta pantalla solo debe usarse en local.
        </p>
      </Alert>

      <ClientsScreen
        clients={clients}
        filters={filters}
        createAction={createClientAction}
        updateAction={updateClientAction}
        setActiveAction={setClientActiveAction}
      />
    </div>
  );
}
