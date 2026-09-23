/** Day-of-month + month-abbreviation chip used on agenda rows, history rows,
 * and the session signup page's date row. `tone="light"` (default) is a soft
 * green tint for white-card rows; `tone="onDark"` is solid white, for rows
 * with a dark ink background. `plus` swaps the date for a "+" mark — same
 * box shape, used for a "create new" row styled to match the list it sits
 * above (e.g. the admin's "Nieuwe sessie" row). */
export function DayBadge({ date, tone = "light", plus = false }: { date?: string; tone?: "light" | "onDark"; plus?: boolean }) {
  const bg = tone === "onDark" ? "bg-white" : "bg-[#EAF1EA]";
  if (plus) {
    return (
      <div className={`flex h-[62px] w-[60px] flex-none items-center justify-center rounded-2xl ${bg} leading-none`}>
        <span className="mb-[7px] text-4xl font-extrabold text-[#0E2318]">+</span>
      </div>
    );
  }
  const d = new Date(`${date}T00:00:00`);
  const day = d.getDate();
  const month = d.toLocaleDateString("nl-NL", { month: "short" }).replace(".", "").toUpperCase();
  return (
    <div className={`flex h-[62px] w-[60px] flex-none flex-col items-center justify-center rounded-2xl ${bg} leading-none`}>
      <span className="text-2xl font-extrabold tracking-tight text-[#0E2318]">{day}</span>
      <span className="text-[10px] font-extrabold tracking-widest text-[#3F5610]">{month}</span>
    </div>
  );
}
