"use client";

import { useState } from "react";

/** Same share-or-copy pattern as the tournament's team-card share button
 * (components/mint/team-result-card.tsx), reimplemented here rather than
 * imported — see the plan's "shares no code with the tournament side" rule. */
export function ShareLink({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2600);
      }
    } catch {
      // user cancelled the native share sheet — no error state needed
    }
  }

  return (
    <div className="flex items-center gap-2 rounded-xl bg-mint-net/10 px-3 py-2 text-sm">
      <a href={url} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate font-medium text-[#0E2318] hover:underline">
        {url.replace(/^https?:\/\//, "")}
      </a>
      <button
        type="button"
        onClick={handleShare}
        className="flex-none rounded-lg bg-white px-3 py-1.5 font-mint text-xs font-bold text-[#0E2318] shadow-[0_8px_20px_rgba(14,35,24,.06)] hover:brightness-95"
      >
        {copied ? "Gekopieerd" : "Deel"}
      </button>
    </div>
  );
}
