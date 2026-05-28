import { Badge, type BadgeTone, Card } from "@/app/_components/ui";
import { db } from "@/db";
import {
  bookingSpaces,
  bookings,
  payments,
  payouts,
  properties,
  quoteLineItems,
  quotes,
  rfpRecipients,
  rfps,
  spaces,
  users,
} from "@/db/schema";
import { formatINR } from "@/lib/format";
import { formatCommissionPct } from "@/lib/payouts";
import { EVENT_TYPE_LABELS } from "@/lib/schemas";
import { asc, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { markBookingComplete } from "../../payouts/actions";

export const dynamic = "force-dynamic";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const STATUS_TONES: Record<string, BadgeTone> = {
  pending_payment: "amber",
  confirmed: "emerald",
  expired: "slate",
  cancelled: "rose",
};

const STATUS_LABELS: Record<string, string> = {
  pending_payment: "Pending payment",
  confirmed: "Confirmed",
  expired: "Expired",
  cancelled: "Cancelled",
};

export default async function AdminBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!UUID_REGEX.test(id)) notFound();

  const [row] = await db
    .select({
      booking: bookings,
      quote: quotes,
      property: properties,
      rfp: rfps,
      plannerEmail: users.email,
    })
    .from(bookings)
    .innerJoin(quotes, eq(quotes.id, bookings.quoteId))
    .innerJoin(rfpRecipients, eq(rfpRecipients.id, quotes.rfpRecipientId))
    .innerJoin(rfps, eq(rfps.id, rfpRecipients.rfpId))
    .innerJoin(properties, eq(properties.id, bookings.propertyId))
    .innerJoin(users, eq(users.id, bookings.plannerId))
    .where(eq(bookings.id, id))
    .limit(1);

  if (!row) notFound();

  const { booking, quote, property, rfp, plannerEmail } = row;

  const [lineItems, bookedSpaces, paymentHistory, ownerRow, payoutRow] =
    await Promise.all([
      db
        .select()
        .from(quoteLineItems)
        .where(eq(quoteLineItems.quoteId, quote.id))
        .orderBy(asc(quoteLineItems.sortOrder)),
      db
        .select({ space: spaces, bookingSpace: bookingSpaces })
        .from(bookingSpaces)
        .innerJoin(spaces, eq(spaces.id, bookingSpaces.spaceId))
        .where(eq(bookingSpaces.bookingId, booking.id))
        .orderBy(asc(spaces.name)),
      db
        .select()
        .from(payments)
        .where(eq(payments.bookingId, booking.id))
        .orderBy(asc(payments.createdAt)),
      property.ownerId
        ? db
            .select({ email: users.email })
            .from(users)
            .where(eq(users.id, property.ownerId))
            .limit(1)
        : Promise.resolve([] as { email: string }[]),
      db
        .select()
        .from(payouts)
        .where(eq(payouts.bookingId, booking.id))
        .limit(1),
    ]);

  const payout = payoutRow[0];

  const ownerEmail = ownerRow[0]?.email ?? "—";

  // Build a chronological audit timeline from existing data.
  const timeline: Array<{ at: Date; what: string }> = [
    { at: rfp.createdAt, what: `RFP created by ${plannerEmail}` },
    {
      at: quote.createdAt,
      what: `Quote sent (₹${quote.totalAmount.toLocaleString("en-IN")})`,
    },
    { at: booking.createdAt, what: `Booking hold created (15 min)` },
    ...paymentHistory.map((p) => ({
      at: p.createdAt,
      what: `Razorpay order created (${p.razorpayOrderId.slice(0, 14)}…, ${formatINR(Math.floor(p.amountPaise / 100))})`,
    })),
    ...paymentHistory
      .filter((p) => p.completedAt)
      .map((p) => ({
        at: p.completedAt!,
        what: `Payment ${p.status} (${p.razorpayPaymentId ?? "no pid"})`,
      })),
    ...(booking.eventCompletedAt
      ? [
          {
            at: booking.eventCompletedAt,
            what: "Event marked complete",
          },
        ]
      : []),
    ...(payout
      ? [
          {
            at: payout.createdAt,
            what: `Payout queued (net ${formatINR(payout.netRupees)})`,
          },
        ]
      : []),
    ...(payout?.releasedAt
      ? [
          {
            at: payout.releasedAt,
            what: `Payout released to venue (UTR ${payout.utr ?? "—"})`,
          },
        ]
      : []),
  ].sort((a, b) => a.at.getTime() - b.at.getTime());

  const canMarkComplete =
    booking.status === "confirmed" && !booking.eventCompletedAt;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-4">
        <Link
          href="/admin/bookings"
          className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
        >
          &larr; Back to all bookings
        </Link>
      </div>

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">
                {property.name}
              </h1>
              <Badge tone={STATUS_TONES[booking.status] ?? "slate"}>
                {STATUS_LABELS[booking.status] ?? booking.status}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {EVENT_TYPE_LABELS[rfp.eventType]} ·{" "}
              {rfp.guestCount.toLocaleString("en-IN")} guests ·{" "}
              {formatDate(rfp.startDate)} → {formatDate(rfp.endDate)}
            </p>
            <p className="mt-1 font-mono text-xs text-slate-500">
              {booking.id}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="text-right">
              <p className="text-xs text-slate-500">Total</p>
              <p className="text-2xl font-bold text-slate-900 tabular-nums dark:text-slate-100">
                {formatINR(quote.totalAmount)}
              </p>
            </div>
            <a
              href={`/api/invoices/${booking.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Download invoice
            </a>
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card title="Planner">
          <p className="text-sm font-medium">{plannerEmail}</p>
          <p className="text-xs text-slate-500">{booking.plannerId}</p>
        </Card>
        <Card title="Venue owner">
          <p className="text-sm font-medium">{ownerEmail}</p>
          <p className="text-xs text-slate-500">{property.city}</p>
        </Card>
      </div>

      <Card title={`Booked spaces (${bookedSpaces.length})`} className="mb-6">
        <ul className="divide-y divide-slate-200 dark:divide-slate-800">
          {bookedSpaces.map(({ space, bookingSpace }) => (
            <li
              key={bookingSpace.id}
              className="flex items-center justify-between py-2 text-sm"
            >
              <span className="font-medium">{space.name}</span>
              <span className="text-xs text-slate-500">
                {formatDate(bookingSpace.startDate)} →{" "}
                {formatDate(bookingSpace.endDate)} · cap{" "}
                {space.capacity.toLocaleString("en-IN")}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <Card title="Quote line items" className="mb-6">
        <table className="min-w-full">
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {lineItems.map((item) => (
              <tr key={item.id}>
                <td className="py-2 text-sm">
                  {item.label}
                  {item.unitLabel ? (
                    <span className="ml-1 text-xs text-slate-500">
                      × {item.quantity} {item.unitLabel}
                    </span>
                  ) : (
                    <span className="ml-1 text-xs text-slate-500">
                      × {item.quantity}
                    </span>
                  )}
                </td>
                <td className="py-2 text-right text-sm font-medium tabular-nums">
                  {formatINR(item.lineTotal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card title={`Payments (${paymentHistory.length})`} className="mb-6">
        {paymentHistory.length === 0 ? (
          <p className="text-sm text-slate-500">No payment attempts yet.</p>
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-slate-800">
            {paymentHistory.map((p) => (
              <li key={p.id} className="py-2 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-slate-500">
                    {p.razorpayOrderId}
                  </span>
                  <Badge
                    tone={
                      p.status === "success"
                        ? "emerald"
                        : p.status === "failed"
                          ? "rose"
                          : "slate"
                    }
                  >
                    {p.status}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {formatINR(Math.floor(p.amountPaise / 100))} ·{" "}
                  {p.createdAt.toLocaleString("en-IN")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Payout" className="mb-6">
        {payout ? (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-4">
              <Stat label="Gross" value={formatINR(payout.grossRupees)} />
              <Stat
                label={`Fee (${formatCommissionPct(payout.commissionBps)})`}
                value={`−${formatINR(payout.commissionRupees)}`}
              />
              <Stat
                label="Net to venue"
                value={formatINR(payout.netRupees)}
                emphasize
              />
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Badge tone={payout.status === "released" ? "emerald" : "amber"}>
                {payout.status}
              </Badge>
              {payout.status === "released" ? (
                <span className="text-xs text-slate-500">
                  UTR <span className="font-mono">{payout.utr}</span> ·{" "}
                  {payout.releasedAt?.toLocaleString("en-IN")}
                </span>
              ) : (
                <Link
                  href="/admin/payouts?status=pending"
                  className="text-xs text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                >
                  Go to payout queue →
                </Link>
              )}
            </div>
          </div>
        ) : canMarkComplete ? (
          <form action={markBookingComplete} className="space-y-3">
            <input type="hidden" name="bookingId" value={booking.id} />
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Mark the event complete to queue the venue payout. Only do this
              after the event has actually happened (scheduled end date{" "}
              {formatDate(rfp.endDate)}).
            </p>
            <button
              type="submit"
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
            >
              Mark event complete
            </button>
          </form>
        ) : booking.status !== "confirmed" ? (
          <p className="text-sm text-slate-500">
            Payouts are only created once a booking is confirmed and the event
            is complete.
          </p>
        ) : null}
      </Card>

      <Card title="Timeline">
        <ol className="space-y-2">
          {timeline.map((evt, i) => (
            <li
              key={i}
              className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300"
            >
              <span className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full bg-indigo-500" />
              <span className="flex-1">
                {evt.what}
                <span className="ml-2 text-xs text-slate-500">
                  {evt.at.toLocaleString("en-IN")}
                </span>
              </span>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}

function Stat({
  label,
  value,
  emphasize = false,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] font-medium tracking-wide text-slate-500 uppercase">
        {label}
      </p>
      <p
        className={`mt-0.5 text-sm tabular-nums ${
          emphasize
            ? "font-bold text-slate-900 dark:text-slate-100"
            : "font-medium text-slate-700 dark:text-slate-300"
        }`}
      >
        {value}
      </p>
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
