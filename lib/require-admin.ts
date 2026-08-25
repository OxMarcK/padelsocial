import { redirect } from "next/navigation";
import { repo } from "./data";

/** Call at the top of every /admin/* Server Component. Redirects to /admin/login if there's no session. */
export async function requireAdmin(): Promise<string> {
  const email = await repo.currentAdminEmail();
  if (!email) redirect("/admin/login");
  return email;
}
