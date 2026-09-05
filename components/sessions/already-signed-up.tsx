"use client";

import { useState } from "react";

const AVATAR_COLORS = ["bg-[#0E2318]", "bg-mint-lime-ink", "bg-glass-blue"];

function initialsFor(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/**
 * Shows who's already signed up (name only — no "niveau"/level column yet,
 * that's a separate future feature) plus an invite CTA, reusing the same
 * share-or-copy pattern as components/sessions/share-link.tsx but as one big
 * button rather than a URL row.
 */
export function AlreadySignedUp({ names, shareUrl, shareTitle }: { names: string[]; shareUrl: string; shareTitle: string }) {
  const [copied, setCopied] = useState(false);

  async function handleInvite() {
    try {
      if (navigator.share) {
        await navigator.share({ title: shareTitle, url: shareUrl });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2600);
      }
    } catch {
      // user cancelled the native share sheet — no error state needed
    }
  }

  const shown = names.slice(0, 3);
  const overflow = names.length - shown.length;

  return (
    <div className="rounded-2xl bg-white p-4 shadow-[0_1px_3px_rgba(20,35,28,.08)]">
      <div className="flex items-center justify-between">
        <span className="font-mint text-lg font-bold text-[#0E2318]">Al aangemeld</span>
        {shown.length > 0 ? (
          <div className="flex -space-x-3">
            {shown.map((name, i) => (
              <span
                key={i}
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 border-white font-mint text-xs font-bold text-white ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}
              >
                {initialsFor(name)}
              </span>
            ))}
            {overflow > 0 ? (
              <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-mint-net/40 font-mint text-xs font-bold text-mint-ink">
                +{overflow}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      {names.length > 0 ? (
        <div className="mt-3 flex flex-col">
          {names.map((name, i) => (
            <div key={i} className={`py-3 text-base text-mint-ink ${i > 0 ? "border-t border-mint-net/15" : ""}`}>
              {name}
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-mint-ink-muted">Nog niemand aangemeld — wees de eerste!</p>
      )}

      <button
        type="button"
        onClick={handleInvite}
        className="mt-4 h-14 w-full rounded-full bg-mint-lime font-mint text-lg font-bold text-mint-lime-ink transition hover:brightness-105"
      >
        {copied ? "Link gekopieerd" : "Nodig iemand uit"}
      </button>
    </div>
  );
}
