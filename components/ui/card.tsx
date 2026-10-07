import type { ReactNode } from "react";

/** White surface card on the Agenda's radius (20 / 28) and shadow scale. Padding/layout via className. */
export function Card({
  radius = "md",
  className = "",
  children,
}: {
  radius?: "md" | "lg";
  className?: string;
  children: ReactNode;
}) {
  return <div className={`bg-white shadow-card ${radius === "lg" ? "rounded-[28px]" : "rounded-[20px]"} ${className}`}>{children}</div>;
}
