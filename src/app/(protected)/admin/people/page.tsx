import type { Metadata } from "next";
import { Alert } from "@/components/ui/alert";
import { DatabaseConnectionError } from "@/components/ui/database-connection-error";
import { PageHeader } from "@/components/ui/page-header";
import {
  createPersonAction,
  setPersonActiveAction,
  updatePersonAction,
} from "@/modules/admin/people/actions";
import {
  getPeople,
  parsePersonFilters,
  type RawSearchParams,
} from "@/modules/admin/people/data";
import { PeopleScreen } from "@/modules/admin/people/people-screen";

export const metadata: Metadata = {
  title: "Personas · Vincle Apps",
};

export const dynamic = "force-dynamic";

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const filters = parsePersonFilters(await searchParams);

  let people;
  try {
    people = await getPeople(filters);
  } catch (error) {
    return <DatabaseConnectionError title="Personas" error={error} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Personas"
        subtitle="Maestro común de personas: una misma persona puede estar habilitada como comercial, como Project Manager, como ambas o como ninguna."
      />

      <Alert tone="warning" title="Pantalla sin restricción de acceso">
        <p>
          La restricción real a administradores sigue pendiente porque todavía
          no hay autenticación. Esta pantalla solo debe usarse en local.
        </p>
      </Alert>

      <PeopleScreen
        people={people}
        filters={filters}
        createAction={createPersonAction}
        updateAction={updatePersonAction}
        setActiveAction={setPersonActiveAction}
      />
    </div>
  );
}
