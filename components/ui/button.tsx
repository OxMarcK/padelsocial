import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "sm";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-lime-serve text-court-night hover:brightness-105",
  secondary: "bg-glass-blue text-flood-white hover:brightness-110",
  ghost: "border border-flood-white/20 text-flood-white hover:bg-flood-white/10",
  danger: "border border-clay-orange text-clay-orange hover:bg-clay-orange/10",
};

const SIZE_CLASSES: Record<Size, string> = {
  md: "h-14 min-h-[48px] px-6 text-lg",
  sm: "h-9 min-h-0 px-3 text-xs",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

export function Button({ variant = "primary", size = "md", fullWidth, className = "", ...props }: ButtonProps) {
  return (
    <button
      className={`rounded-2xl font-display font-bold uppercase tracking-wider transition disabled:opacity-40 disabled:cursor-not-allowed ${SIZE_CLASSES[size]} ${VARIANT_CLASSES[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...props}
    />
  );
}
