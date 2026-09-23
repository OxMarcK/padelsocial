"use server";

import { redirect } from "next/navigation";
import { repo } from "@/lib/data";

export async function signOutAdmin() {
  await repo.signOut();
  redirect("/admin/login");
}
