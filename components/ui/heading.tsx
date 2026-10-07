import type { ReactNode } from "react";

type Level = "h1" | "h2" | "h3";
type Size = "display" | "section" | "sub";

/** Same heading treatment as the Agenda (app/page.tsx): weight 800, tight tracking, ink. */
const SIZE_CLASSES: Record<Size, string> = {
  display: "text-[clamp(2rem,6vw,2.6rem)] leading-[1.02]",
  section: "text-2xl leading-tight",
  sub: "text-lg leading-tight",
};

export function Heading({
  as: Tag = "h2",
  size = "section",
  className = "",
  children,
}: {
  as?: Level;
  size?: Size;
  className?: string;
  children: ReactNode;
}) {
  return <Tag className={`font-mint font-extrabold tracking-tight text-mint-ink ${SIZE_CLASSES[size]} ${className}`}>{children}</Tag>;
}
