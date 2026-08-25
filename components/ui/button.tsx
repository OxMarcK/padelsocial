import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-lime-serve text-court-night hover:brightness-105",
  secondary: "bg-glass-blue text-flood-white hover:brightness-110",
  ghost: "border border-flood-white/20 text-flood-white hover:bg-flood-white/10",
  danger: "border border-clay-orange text-clay-orange hover:bg-clay-orange/10",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  fullWidth?: boolean;
}

export function Button({ variant = "primary", fullWidth, className = "", ...props }: ButtonProps) {
  return (
    <button
      className={`h-14 min-h-[48px] rounded-2xl px-6 font-display text-lg font-bold uppercase tracking-wider transition disabled:opacity-40 disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...props}
    />
  );
}
