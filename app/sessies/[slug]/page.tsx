import { notFound, redirect } from "next/navigation";
import { sessionsRepo } from "@/lib/data/sessions";

/**
 * Sessions now live at the flat /{slug} namespace (see app/[slug]/page.tsx) —
 * this legacy path is kept as a permanent redirect, not deleted, because
 * /sessies/{slug} links are already shared via WhatsApp and can't be recalled.
 * Unknown slugs still 404 here exactly as before, rather than blindly
 * redirecting every /sessies/* request regardless of whether it ever existed.
 */
export default async function LegacySessionRedirect({ params }: { params: { slug: string } }) {
  const session = await sessionsRepo.getSessionBySlug(params.slug);
  if (!session) notFound();
  redirect(`/${params.slug}`);
}
