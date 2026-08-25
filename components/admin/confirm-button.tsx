"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

export function ConfirmButton({
  label,
  confirmText,
  action,
  variant = "primary",
}: {
  label: string;
  confirmText: string;
  action: () => Promise<void>;
  variant?: "primary" | "secondary" | "danger";
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <Button type="button" variant={variant} onClick={() => setConfirming(true)}>
        {label}
      </Button>
    );
  }

  const boxClasses =
    variant === "danger" ? "border-clay-orange bg-clay-orange/10" : "border-lime-serve bg-lime-serve/10";

  return (
    <div className={`flex flex-col gap-3 rounded-2xl border p-4 ${boxClasses}`}>
      <p className="text-sm text-flood-white">{confirmText}</p>
      <div className="flex gap-2">
        <Button
          type="button"
          variant={variant}
          disabled={pending}
          onClick={() => startTransition(async () => {
            await action();
            setConfirming(false);
          })}
        >
          {pending ? "Bezig…" : "Bevestigen"}
        </Button>
        <Button type="button" variant="ghost" disabled={pending} onClick={() => setConfirming(false)}>
          Annuleren
        </Button>
      </div>
    </div>
  );
}
