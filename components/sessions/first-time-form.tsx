"use client";

import { useState, useTransition } from "react";
import type { MemberLevel, Reservation } from "@/lib/session-types";

const LEVELS: { value: MemberLevel; label: string; caption: string }[] = [
  { value: "beginner", label: "Beginner", caption: "< 10 keer" },
  { value: "beginner_plus", label: "Beginner+", caption: "Speelt vaker" },
  { value: "intermediate", label: "Intermediate", caption: "Competitie" },
];

/**
 * The "first time here?" self-service path: name + email + level creates a
 * club-member profile on the spot (no admin gatekeeping) and reserves a spot
 * in one action — see app/[slug]/session-actions.ts's createMemberAndReserveAction.
 * Email is required so a returning player's profile can be matched and reused
 * rather than duplicated.
 */
export function FirstTimeForm({
  sessionId,
  createMemberAndReserve,
  onReserved,
}: {
  sessionId: string;
  createMemberAndReserve: (sessionId: string, formData: FormData) => Promise<Reservation>;
  onReserved: (reservation: Reservation) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [level, setLevel] = useState<MemberLevel>("beginner_plus");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const formData = new FormData();
    formData.set("name", name);
    formData.set("email", email);
    formData.set("level", level);
    startTransition(async () => {
      try {
        onReserved(await createMemberAndReserve(sessionId, formData));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Er ging iets mis.");
      }
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div>
        <h3 className="font-mint text-2xl font-bold text-[#0E2318]">Eerste keer hier?</h3>
        <p className="mt-1 text-sm text-mint-ink-muted">
          Alleen je naam is genoeg. De rest onthouden we voor de volgende zondag.
        </p>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="font-mint text-xs font-bold uppercase tracking-wider text-mint-lime-ink">Jouw naam</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Voornaam"
          className="h-14 rounded-2xl border-2 border-mint-lime bg-white px-4 text-lg text-mint-ink placeholder:text-mint-ink-muted/50 focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="font-mint text-xs font-bold uppercase tracking-wider text-mint-lime-ink">Jouw e-mail</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="jij@mail.nl"
          className="h-12 rounded-xl border border-mint-net/25 bg-white px-4 text-mint-ink placeholder:text-mint-ink-muted/50"
        />
      </label>

      <div className="flex flex-col gap-1.5">
        <span className="font-mint text-xs font-bold uppercase tracking-wider text-mint-lime-ink">Hoe speel je?</span>
        <div className="grid grid-cols-3 gap-2">
          {LEVELS.map((l) => {
            const active = level === l.value;
            return (
              <button
                key={l.value}
                type="button"
                onClick={() => setLevel(l.value)}
                className={`flex flex-col items-center gap-0.5 rounded-2xl border px-2 py-3 text-center transition ${
                  active ? "border-[#0E2318] bg-[#0E2318]" : "border-mint-net/25 bg-white"
                }`}
              >
                <span className={`font-mint text-sm font-bold ${active ? "text-white" : "text-mint-lime-ink"}`}>{l.label}</span>
                <span className={`text-[11px] ${active ? "text-white/70" : "text-mint-ink-muted"}`}>{l.caption}</span>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-mint-ink-muted">Bepaalt op welke baan je begint — daarna schuif je zelf omhoog.</p>
      </div>

      {error ? <p className="text-xs text-clay-orange">{error}</p> : null}

      <button
        type="submit"
        disabled={pending || !name.trim() || !email.trim()}
        className="h-14 rounded-full bg-mint-lime font-mint text-lg font-bold text-mint-lime-ink transition disabled:cursor-not-allowed disabled:opacity-40"
      >
        {pending ? "Bezig…" : "Meld je aan"}
      </button>
    </form>
  );
}
