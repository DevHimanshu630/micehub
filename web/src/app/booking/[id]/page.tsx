import { db } from "@/db";
import {
  bookingSpaces,
  bookings,
  properties,
  quoteLineItems,
  quotes,
  rfpRecipients,
  rfps,
  spaces,
} from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { formatINR } from "@/lib/format";
import { EVENT_TYPE_LABELS } from "@/lib/schemas";
import { and, asc, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cancelBooking, expireStaleHolds } from "../actions";
import { HoldCountdown } from "./_components/hold-countdown";

export const dynamic = "force-dynamic";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const STATUS_LABELS: Record<string, string> = {
  pending_payment: "Pending payment",
  confirmed: "Confirmed",
  expired: "Expired",
  cancelled: "Cancelled",
};

const STATUS_CLASSES: Record<string, string> = {
  pending_payment:
    "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  confirmed:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  expired: "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  cancelled: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
};

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("planner");
  const { id } = await params;
  if (!UUID_REGEX.test(id)) notFound();

  // Refresh stale holds so users see accurate status.
  await expireStaleHolds();

  const [row] = await db
    .select({
      booking: bookings,
      quote: quotes,
      property: properties,
      rfp: rfps,
    })
    .from(bookings)
    .innerJoin(quotes, eq(quotes.id, bookings.quoteId))
    .innerJoin(rfpRecipients, eq(rfpRecipients.id, quotes.rfpRecipientId))
    .innerJoin(rfps, eq(rfps.id, rfpRecipients.rfpId))
    .innerJoin(properties, eq(properties.id, bookings.propertyId))
    .where(and(eq(bookings.id, id), eq(bookings.plannerId, user.id)))
    .limit(1);

  if (!row) notFound();

  const { booking, quote, property, rfp } = row;

  const [lineItems, bookedSpaces] = await Promise.all([
    db
      .select()
      .from(quoteLineItems)
      .where(eq(quoteLineItems.quoteId, quote.id))
      .orderBy(asc(quoteLineItems.sortOrder)),
    db
      .select({
        space: spaces,
        bookingSpace: bookingSpaces,
      })
      .from(bookingSpaces)
      .innerJoin(spaces, eq(spaces.id, bookingSpaces.spaceId))
      .where(eq(bookingSpaces.bookingId, booking.id))
      .orderBy(asc(spaces.name)),
  ]);

  const advance = Math.round(quote.totalAmount * 0.2);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4">
        <Link
          href={`/dashboard/rfps/${rfp.id}`}
          className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
        >
          &larr; Back to RFP
        </Link>
      </div>

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">
                {property.name}
              </h1>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASSES[booking.status]}`}
              >
                {STATUS_LABELS[booking.status]}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {EVENT_TYPE_LABELS[rfp.eventType]} ·{" "}
              {rfp.guestCount.toLocaleString("en-IN")} guests ·{" "}
              {formatDate(rfp.startDate)} → {formatDate(rfp.endDate)}
            </p>
            <p className="mt-1 text-xs text-slate-500">{property.city}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">Total</p>
            <p className="text-2xl font-bold text-slate-900 tabular-nums dark:text-slate-100">
              {formatINR(quote.totalAmount)}
            </p>
          </div>
        </div>
      </div>

      {booking.status === "pending_payment" ? (
        <div className="mb-6 space-y-3">
          <HoldCountdown expiresAtMs={booking.holdExpiresAt.getTime()} />
          <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-6 dark:border-indigo-900 dark:bg-indigo-950/30">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Pay {formatINR(advance)} to confirm
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              20% advance now; balance settles after the event. Razorpay
              integration arrives in Step 9 — for now this button is a
              placeholder.
            </p>
            <button
              type="button"
              disabled
              title="Razorpay arrives in Step 9"
              className="mt-4 cursor-not-allowed rounded-md bg-indigo-600/40 px-5 py-2.5 text-sm font-semibold text-white"
            >
              Pay {formatINR(advance)} advance (Step 9)
            </button>
          </div>
        </div>
      ) : null}

      {booking.status === "expired" ? (
        <div className="mb-6 rounded-md bg-slate-100 px-4 py-3 text-sm text-slate-700 dark:bg-slate-900 dark:text-slate-300">
          This hold expired before payment was completed. The slot has been
          released for other planners.
        </div>
      ) : null}

      {booking.status === "cancelled" ? (
        <div className="mb-6 rounded-md bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:bg-rose-950 dark:text-rose-300">
          This booking was cancelled.
        </div>
      ) : null}

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-semibold">Held spaces</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          {bookedSpaces.length === 1
            ? "1 space is held for your event dates."
            : `${bookedSpaces.length} spaces are held for your event dates.`}
        </p>
        <ul className="mt-4 divide-y divide-slate-200 dark:divide-slate-800">
          {bookedSpaces.map(({ space, bookingSpace }) => (
            <li
              key={bookingSpace.id}
              className="flex items-center justify-between py-3"
            >
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  {space.name}
                </p>
                <p className="text-xs text-slate-500">
                  Capacity {space.capacity.toLocaleString("en-IN")}
                </p>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {formatDate(bookingSpace.startDate)} →{" "}
                {formatDate(bookingSpace.endDate)}
              </p>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-semibold">Quote breakdown</h2>
        <table className="mt-4 min-w-full divide-y divide-slate-200 dark:divide-slate-800">
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {lineItems.map((item) => (
              <tr key={item.id}>
                <td className="py-2 text-sm text-slate-700 dark:text-slate-300">
                  {item.label}
                  <span className="ml-1 text-xs text-slate-500">
                    × {item.quantity}
                    {item.unitLabel ? ` ${item.unitLabel}` : ""}
                  </span>
                </td>
                <td className="py-2 text-right text-sm font-medium tabular-nums">
                  {formatINR(item.lineTotal)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-200 dark:border-slate-800">
              <td className="pt-3 text-sm font-semibold">Total</td>
              <td className="pt-3 text-right text-base font-bold tabular-nums">
                {formatINR(quote.totalAmount)}
              </td>
            </tr>
          </tfoot>
        </table>
        {quote.notes ? (
          <p className="mt-4 rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:bg-slate-950 dark:text-slate-400">
            {quote.notes}
          </p>
        ) : null}
      </div>

      {booking.status === "pending_payment" ? (
        <form action={cancelBooking.bind(null, booking.id)} className="mt-6">
          <button
            type="submit"
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cancel this booking
          </button>
        </form>
      ) : null}
    </div>
  );
}

function formatDate(d: Date) {
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
