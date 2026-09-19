import { redirect } from "next/navigation";
import { getCurrentUser } from "@/modules/auth/session";

export default async function RootPage() {
  const user = await getCurrentUser();
  redirect(user ? "/offers" : "/login");
}
