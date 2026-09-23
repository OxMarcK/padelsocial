/** Day-of-month + month-abbreviation chip used on agenda rows, history rows,
 * and the session signup page's date row. `tone="light"` (default) is a soft
 * green tint for white-card rows; `tone="onDark"` is solid white, for rows
 * with a dark ink background. */
export function DayBadge({ date, tone = "light" }: { date: string; tone?: "light" | "onDark" }) {
  const d = new Date(`${date}T00:00:00`);
  const day = d.getDate();
  const month = d.toLocaleDateString("nl-NL", { month: "short" }).replace(".", "").toUpperCase();
  const bg = tone === "onDark" ? "bg-white" : "bg-[#EAF1EA]";
  return (
    <div className={`flex h-[62px] w-[60px] flex-none flex-col items-center justify-center rounded-2xl ${bg} leading-none`}>
      <span className="text-2xl font-extrabold tracking-tight text-[#0E2318]">{day}</span>
      <span className="text-[10px] font-extrabold tracking-widest text-[#3F5610]">{month}</span>
    </div>
  );
}
