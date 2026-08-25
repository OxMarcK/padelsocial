import type { ReactNode } from "react";

export function Chip({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "lime" | "blue" | "orange";
}) {
  const toneClasses: Record<string, string> = {
    neutral: "bg-net-grey text-court-night",
    lime: "bg-lime-serve text-court-night",
    blue: "bg-glass-blue text-flood-white",
    orange: "bg-clay-orange text-court-night",
  };
  return (
    <span
      className={`inline-flex items-center rounded font-display text-xs font-bold uppercase tracking-wider px-1.5 py-0.5 ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}
