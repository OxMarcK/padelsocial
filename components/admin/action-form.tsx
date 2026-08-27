"use client";

import { createContext, useContext, useRef, useState, useTransition, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

/**
 * Wraps a Server Action form so a click actually shows something: "Bezig…" while
 * pending, a lingering "Opgeslagen" flash on success, and the error message inline
 * instead of a blank navigation to Next's error page. Calls the bound action
 * directly (same mechanism ConfirmButton already uses) instead of relying on
 * native form submission, so we get a pending/success/error state to expose.
 *
 * State is exposed via context rather than a render-prop, because this component's
 * children are built by Server Component pages — a function passed as `children`
 * can't cross the server/client boundary, but plain JSX elements can.
 */
const ActionFormState = createContext<{ pending: boolean; saved: boolean; error: string | null }>({
  pending: false,
  saved: false,
  error: null,
});

export function ActionForm({
  action,
  className,
  children,
  resetOnSuccess = false,
}: {
  action: (formData: FormData) => Promise<void>;
  className?: string;
  children: ReactNode;
  resetOnSuccess?: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      try {
        await action(formData);
        setSaved(true);
        setTimeout(() => setSaved(false), 2200);
        if (resetOnSuccess) formRef.current?.reset();
      } catch (err) {
        if (err && typeof err === "object" && "digest" in err && String(err.digest).startsWith("NEXT_REDIRECT")) {
          throw err;
        }
        setError(err instanceof Error ? err.message : "Er ging iets mis.");
      }
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className={className}>
      <ActionFormState.Provider value={{ pending, saved, error }}>{children}</ActionFormState.Provider>
    </form>
  );
}

/** Inline error message for the form, if the last submit failed. */
export function ActionFormError() {
  const { error } = useContext(ActionFormState);
  if (!error) return null;
  return <p className="text-xs text-clay-orange">{error}</p>;
}

/** Standard submit button for use inside an ActionForm — reads pending/saved from context. */
export function SaveButton({
  label = "Opslaan",
  savedLabel = "Opgeslagen",
  variant = "secondary",
  size = "md",
  fullWidth = false,
  disabled = false,
}: {
  label?: string;
  savedLabel?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "md" | "sm";
  fullWidth?: boolean;
  disabled?: boolean;
}) {
  const { pending, saved } = useContext(ActionFormState);
  return (
    <Button type="submit" variant={variant} size={size} fullWidth={fullWidth} disabled={disabled || pending}>
      {saved ? `✓ ${savedLabel}` : pending ? "Bezig…" : label}
    </Button>
  );
}
