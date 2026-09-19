import { prisma } from "@/lib/db/prisma";

/** Lecturas de la pantalla de administración de usuarios (DEC-055). */

export type UserRow = {
  id: string;
  username: string;
  role: "ADMIN" | "USER";
  isActive: boolean;
  mustChangePassword: boolean;
  personId: string;
  personName: string;
};

export async function getUsers(): Promise<UserRow[]> {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      role: true,
      isActive: true,
      mustChangePassword: true,
      personId: true,
      person: { select: { name: true } },
    },
    orderBy: { username: "asc" },
  });

  return users.map((user) => ({
    id: user.id,
    username: user.username,
    role: user.role,
    isActive: user.isActive,
    mustChangePassword: user.mustChangePassword,
    personId: user.personId,
    personName: user.person.name,
  }));
}

export type PersonOption = { id: string; name: string };

/** Personas activas que todavía no tienen usuario, para el alta. */
export async function getPeopleWithoutUser(): Promise<PersonOption[]> {
  const people = await prisma.person.findMany({
    where: { isActive: true, user: null },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  return people;
}
