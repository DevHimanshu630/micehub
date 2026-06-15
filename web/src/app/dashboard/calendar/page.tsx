import { CalendarMonth } from "@/app/_components/calendar-month";
import { PageHeader } from "@/app/_components/ui";
import { expireStaleHolds } from "@/app/booking/actions";
import { db } from "@/db";
import { bookingSpaces, bookings, properties, spaces } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { and, eq, gte, inArray, lte } from "drizzle-orm";

export const dynamic = "force-dynamic";

function parseMonth(raw: string | undefined): { year: number; month: number } {
  const now = new Date();
  if (!raw) {
    return { year: now.getUTCFullYear(), month: now.getUTCMonth() };
  }
  const m = raw.match(/^(\d{4})-(\d{2})$/);
  if (!m) return { year: now.getUTCFullYear(), month: now.getUTCMonth() };
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  if (!Number.isFinite(y) || !Number.isFinite(mo) || mo < 0 || mo > 11) {
    return { year: now.getUTCFullYear(), month: now.getUTCMonth() };
  }
  return { year: y, month: mo };
}

function isoDate(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

export default async function PlannerCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const user = await requireRole("planner");
  const { month: monthParam } = await searchParams;
  const { year, month } = parseMonth(monthParam);

  // Auto-expire stale holds so the calendar stays accurate.
  await expireStaleHolds();

  // Fetch a window that covers the visible grid (~6 weeks).
  const gridStart = new Date(Date.UTC(year, month, 1));
  gridStart.setUTCDate(1 - gridStart.getUTCDay());
  const gridEnd = new Date(gridStart);
  gridEnd.setUTCDate(gridStart.getUTCDate() + 41);

  const rows = await db
    .select({
      bookingSpace: bookingSpaces,
      space: spaces,
      property: properties,
    })
    .from(bookingSpaces)
    .innerJoin(spaces, eq(spaces.id, bookingSpaces.spaceId))
    .innerJoin(properties, eq(properties.id, spaces.propertyId))
    .innerJoin(bookings, eq(bookings.id, bookingSpaces.bookingId))
    .where(
      and(
        eq(bookings.plannerId, user.id),
        inArray(bookingSpaces.status, ["pending_payment", "confirmed"]),
        lte(bookingSpaces.startDate, gridEnd),
        gte(bookingSpaces.endDate, gridStart),
      ),
    );

  // Explode each booking_space into one entry per day within its range.
  const dotsByDate = new Map<
    string,
    Array<{
      status: "pending_payment" | "confirmed";
      propertyName: string;
      spaceName: string;
    }>
  >();

  for (const { bookingSpace, space, property } of rows) {
    if (
      bookingSpace.status !== "pending_payment" &&
      bookingSpace.status !== "confirmed"
    ) {
      continue;
    }

    const start = bookingSpace.startDate;
    const end = bookingSpace.endDate;
    for (
      const d = new Date(start);
      d.getTime() <= end.getTime();
      d.setUTCDate(d.getUTCDate() + 1)
    ) {
      if (d.getTime() < gridStart.getTime() || d.getTime() > gridEnd.getTime())
        continue;
      const key = isoDate(d);
      const existing = dotsByDate.get(key);
      const entry = {
        status: bookingSpace.status,
        propertyName: property.name,
        spaceName: space.name,
      };
      if (existing) {
        existing.push(entry);
      } else {
        dotsByDate.set(key, [entry]);
      }
    }
  }

  const prevMonth =
    month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 };
  const nextMonth =
    month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 };

  return (
    <div>
      <PageHeader
        title="Calendar"
        description="Your held and confirmed bookings across all venues."
      />

      <CalendarMonth
        year={year}
        month={month}
        dotsByDate={dotsByDate}
        prevMonth={prevMonth}
        nextMonth={nextMonth}
        basePath="/dashboard/calendar"
        primary="property"
      />
    </div>
  );
}
