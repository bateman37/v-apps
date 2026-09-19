import type { Metadata } from "next";
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
import {
  createUserAction,
  resetUserPasswordAction,
  setUserActiveAction,
  setUserRoleAction,
} from "@/modules/admin/users/actions";
import { requireAdmin } from "@/modules/auth/session";

export const metadata: Metadata = {
  title: "Personas y accesos · Vincle Apps",
};

export const dynamic = "force-dynamic";

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  await requireAdmin();
  const filters = parsePersonFilters(await searchParams);

  let people;
  try {
    people = await getPeople(filters);
  } catch (error) {
    return <DatabaseConnectionError title="Personas y accesos" error={error} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Personas y accesos"
        subtitle="Personas (comercial y/o Project Manager) y sus cuentas de acceso, en una sola pantalla. Son entidades separadas por debajo: fusionar una persona con un acceso no cambia la otra."
      />

      <PeopleScreen
        people={people}
        filters={filters}
        createAction={createPersonAction}
        updateAction={updatePersonAction}
        setActiveAction={setPersonActiveAction}
        createAccessAction={createUserAction}
        setAccessActiveAction={setUserActiveAction}
        setAccessRoleAction={setUserRoleAction}
        resetAccessPasswordAction={resetUserPasswordAction}
      />
    </div>
  );
}
