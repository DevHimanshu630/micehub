import Link from "next/link";

type BookingDot = {
  status: "pending_payment" | "confirmed";
  propertyName: string;
  spaceName: string;
};

export function CalendarMonth({
  year,
  month, // 0-11
  dotsByDate,
  prevMonth,
  nextMonth,
}: {
  year: number;
  month: number;
  dotsByDate: Map<string, BookingDot[]>;
  prevMonth: { year: number; month: number };
  nextMonth: { year: number; month: number };
}) {
  const firstOfMonth = new Date(Date.UTC(year, month, 1));
  const startWeekday = firstOfMonth.getUTCDay(); // 0 = Sunday

  // 6 rows × 7 cols = 42 cells; start from Sunday before the 1st.
  const cells: Array<{ date: Date; inMonth: boolean }> = [];
  const gridStart = new Date(firstOfMonth);
  gridStart.setUTCDate(firstOfMonth.getUTCDate() - startWeekday);

  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setUTCDate(gridStart.getUTCDate() + i);
    cells.push({
      date: d,
      inMonth: d.getUTCMonth() === month,
    });
  }

  const todayKey = isoDate(new Date());
  const monthLabel = firstOfMonth.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">{monthLabel}</h2>
        <div className="flex items-center gap-2">
          <Link
            href={`/venue/calendar?month=${formatYM(prevMonth)}`}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label="Previous month"
          >
            ←
          </Link>
          <Link
            href="/venue/calendar"
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Today
          </Link>
          <Link
            href={`/venue/calendar?month=${formatYM(nextMonth)}`}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label="Next month"
          >
            →
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div
              key={d}
              className="px-2 py-2 text-center text-xs font-semibold tracking-wide text-slate-600 uppercase dark:text-slate-400"
            >
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((cell, idx) => {
            const key = isoDate(cell.date);
            const dots = dotsByDate.get(key) ?? [];
            const isToday = key === todayKey;
            const dayNum = cell.date.getUTCDate();

            return (
              <div
                key={idx}
                className={`relative min-h-[70px] border-r border-b border-slate-200 p-1.5 dark:border-slate-800 ${
                  cell.inMonth
                    ? "bg-white dark:bg-slate-900"
                    : "bg-slate-50 dark:bg-slate-950"
                } ${idx % 7 === 6 ? "border-r-0" : ""} ${idx >= 35 ? "border-b-0" : ""}`}
              >
                <div
                  className={`text-xs font-medium ${
                    isToday
                      ? "inline-flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white"
                      : cell.inMonth
                        ? "text-slate-700 dark:text-slate-300"
                        : "text-slate-400"
                  }`}
                >
                  {dayNum}
                </div>
                {dots.length > 0 ? (
                  <div className="mt-1 space-y-0.5">
                    {dots.slice(0, 3).map((dot, i) => (
                      <div
                        key={i}
                        title={`${dot.propertyName} · ${dot.spaceName}${dot.status === "pending_payment" ? " (held)" : ""}`}
                        className={`truncate rounded px-1 py-0.5 text-[10px] font-medium ${
                          dot.status === "confirmed"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                        }`}
                      >
                        {dot.spaceName}
                      </div>
                    ))}
                    {dots.length > 3 ? (
                      <div className="text-[10px] text-slate-500">
                        +{dots.length - 3} more
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-amber-200 dark:bg-amber-900" />
          <span className="text-slate-600 dark:text-slate-400">
            Held (pending payment)
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-emerald-200 dark:bg-emerald-900" />
          <span className="text-slate-600 dark:text-slate-400">Confirmed</span>
        </div>
      </div>
    </div>
  );
}

function isoDate(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

function formatYM({ year, month }: { year: number; month: number }): string {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}
