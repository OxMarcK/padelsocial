"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/require-admin";
import { sessionsRepo } from "@/lib/data/sessions";
import type { NewMemberInput } from "@/lib/data/sessions-repo";
import type { MemberLevel } from "@/lib/session-types";

const MEMBER_LEVELS: MemberLevel[] = ["beginner", "beginner_plus", "intermediate"];

export async function addMembersBulk(formData: FormData) {
  await requireAdmin();
  const text = String(formData.get("bulk") ?? "");
  const members: NewMemberInput[] = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, email, phone] = line.split("|").map((s) => s.trim());
      return { name: name || "", email: email || null, phone: phone || null };
    })
    .filter((m) => m.name);

  if (members.length > 0) await sessionsRepo.addMembersBulk(members);
  revalidatePath("/admin/leden");
}

export async function updateMember(memberId: string, formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const rawLevel = String(formData.get("level") ?? "");
  const level: MemberLevel | null = MEMBER_LEVELS.includes(rawLevel as MemberLevel) ? (rawLevel as MemberLevel) : null;
  if (name) await sessionsRepo.updateMember(memberId, { name, level });
  revalidatePath("/admin/leden");
}

export async function deleteMember(memberId: string) {
  await requireAdmin();
  await sessionsRepo.deleteMember(memberId);
  revalidatePath("/admin/leden");
}
