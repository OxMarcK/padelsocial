import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "sm";

/** Design 6A trial: restyled for the light "mint" admin — see app/admin/e/[id]/page.tsx. */
const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-mint-lime text-mint-lime-ink hover:brightness-105",
  secondary: "bg-glass-blue text-white hover:brightness-110",
  ghost: "border border-mint-net/30 bg-white text-mint-ink hover:bg-mint-net/10",
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
      className={`rounded-2xl font-mint font-bold uppercase tracking-wider transition disabled:opacity-40 disabled:cursor-not-allowed ${SIZE_CLASSES[size]} ${VARIANT_CLASSES[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...props}
    />
  );
}
