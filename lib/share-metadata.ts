import type { Metadata } from "next";

/** Fallback link-preview image — used everywhere until a per-event/session
 * generated image is built (see the "dynamic og:image" follow-up). */
export const OG_IMAGE = "/social/padel-social-og-thumb-whatsapp.png";

/** Short date for share-card titles, e.g. "zo 30 aug, 10:30". */
export function fmtDateShort(date: string, time: string): string {
  const short = new Date(`${date}T00:00:00`).toLocaleDateString("nl-NL", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  return `${short}, ${time}`;
}

/** Uppercase share-card eyebrow, e.g. "ZONDAG 30 AUGUSTUS · 10:30" — matches
 * the Claude Design og-image hand-off's exact copy style. */
export function fmtEyebrow(date: string, time: string): string {
  const long = new Date(`${date}T00:00:00`).toLocaleDateString("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return `${long.toUpperCase()} · ${time}`;
}

/**
 * Shared link-preview shape — same image/card type everywhere (tournaments,
 * sessions, the landing page), only title/description vary per page. A
 * neutral, dependency-free formatting helper (like lib/slug.ts), not owned by
 * either the tournament or sessions feature.
 */
export function buildShareMetadata(title: string, description: string): Metadata {
  return {
    title,
    description,
    openGraph: { title, description, images: [OG_IMAGE], locale: "nl_NL", type: "website" },
    twitter: { card: "summary_large_image", title, description, images: [OG_IMAGE] },
  };
}
