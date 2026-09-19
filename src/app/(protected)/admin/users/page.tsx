import {
  createUserAction,
  resetUserPasswordAction,
  setUserActiveAction,
  setUserRoleAction,
} from "@/modules/admin/users/actions";
import { getPeopleWithoutUser, getUsers } from "@/modules/admin/users/data";
import { UsersScreen } from "@/modules/admin/users/users-screen";
import { requireAdmin } from "@/modules/auth/session";

export default async function AdminUsersPage() {
  await requireAdmin();
  const [users, availablePeople] = await Promise.all([
    getUsers(),
    getPeopleWithoutUser(),
  ]);

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-[var(--color-text)]">Usuarios</h1>
      <p className="v-hint mb-6">
        Autenticación local provisional (DEC-019). Cada cuenta se vincula a una persona
        del maestro común.
      </p>
      <UsersScreen
        users={users}
        availablePeople={availablePeople}
        createAction={createUserAction}
        setActiveAction={setUserActiveAction}
        setRoleAction={setUserRoleAction}
        resetPasswordAction={resetUserPasswordAction}
      />
    </div>
  );
}
