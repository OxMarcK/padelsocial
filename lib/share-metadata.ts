import type { Metadata } from "next";

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
 * Shared link-preview shape — same title/description on every consuming route.
 * Deliberately does NOT set an `images` field: both consumers (/ and /[slug])
 * have their own opengraph-image.tsx file, and Next only auto-attaches that
 * file-based image when generateMetadata doesn't already specify one — an
 * explicit `images` here would silently override it with nothing.
 */
export function buildShareMetadata(title: string, description: string): Metadata {
  return {
    title,
    description,
    openGraph: { title, description, locale: "nl_NL", type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}
