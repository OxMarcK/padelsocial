"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

export function ConfirmButton({
  label,
  icon,
  confirmText,
  action,
  variant = "primary",
  size = "md",
  successMessage,
}: {
  label: string;
  /** Renders the trigger as a compact square icon button (e.g. "✕") instead of a text
   * button — `label` still becomes its aria-label, so it stays as accessible as the
   * text variant. Use this wherever a full-width text button would crowd a tight row
   * (a table row's delete action, say) instead of overflowing it. */
  icon?: string;
  confirmText: string;
  action: () => Promise<void>;
  variant?: "primary" | "secondary" | "danger";
  size?: "md" | "sm";
  /** Shown for a few seconds after the action resolves, instead of instantly collapsing back
   * to the plain button — a click needs a visible outcome, not just a spinner that disappears. */
  successMessage?: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (done && successMessage) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-mint-lime bg-mint-lime/15 px-4 py-3 text-sm text-mint-lime-ink">
        <span aria-hidden>✓</span> {successMessage}
      </div>
    );
  }

  if (!confirming) {
    return (
      <div className="flex flex-col gap-2">
        <Button
          type="button"
          variant={variant}
          size={size}
          aria-label={icon ? label : undefined}
          className={icon ? "!w-9 flex-none !px-0 text-center" : undefined}
          onClick={() => {
            setConfirming(true);
            setError(null);
          }}
        >
          {icon ?? label}
        </Button>
        {error ? <p className="text-xs text-clay-orange">{error}</p> : null}
      </div>
    );
  }

  const boxClasses =
    variant === "danger" ? "border-clay-orange bg-clay-orange/10" : "border-mint-lime bg-mint-lime/15";

  return (
    <div className={`flex w-full flex-col gap-3 rounded-2xl border ${size === "sm" ? "p-3" : "p-4"} ${boxClasses}`}>
      <p className="text-sm text-mint-ink">{confirmText}</p>
      <div className="flex gap-2">
        <Button
          type="button"
          variant={variant}
          size={size}
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              try {
                await action();
                setConfirming(false);
                if (successMessage) {
                  setDone(true);
                  setTimeout(() => setDone(false), 2800);
                }
              } catch (e) {
                // Server Actions that redirect() (e.g. deleteEvent -> /admin) throw a special
                // Next.js control-flow error tagged with a NEXT_REDIRECT digest — let it
                // propagate so the navigation actually happens, don't treat it as a failure.
                if (e && typeof e === "object" && "digest" in e && String(e.digest).startsWith("NEXT_REDIRECT")) {
                  throw e;
                }
                setError(e instanceof Error ? e.message : "Er ging iets mis.");
                setConfirming(false);
              }
            })
          }
        >
          {pending ? "Bezig…" : "Bevestigen"}
        </Button>
        <Button type="button" variant="ghost" size={size} disabled={pending} onClick={() => setConfirming(false)}>
          Annuleren
        </Button>
      </div>
    </div>
  );
}
