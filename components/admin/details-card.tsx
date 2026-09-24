import type { ReactNode } from "react";

/** Shared shell for the collapsible white card used across /admin (event/session/
 * member rows, "add new" forms) — same rounded corners, shadow and open-state lift
 * everywhere instead of each page re-typing the class string. */
export function DetailsCard({
  summary,
  summaryClassName = "flex cursor-pointer list-none items-center gap-4 px-4 py-2.5",
  children,
}: {
  summary: ReactNode;
  summaryClassName?: string;
  children: ReactNode;
}) {
  return (
    <details className="group rounded-[20px] bg-white shadow-[0_1px_3px_rgba(20,35,28,.08)] open:shadow-[0_4px_14px_rgba(20,35,28,.1)]">
      <summary className={summaryClassName}>{summary}</summary>
      {children}
    </details>
  );
}
