import { db } from "@/db";
import {
  bookingSpaces,
  bookings,
  payments,
  properties,
  quoteLineItems,
  quotes,
  rfpRecipients,
  rfps,
  spaces,
  users,
} from "@/db/schema";
import { formatINR } from "@/lib/format";
import { EVENT_TYPE_LABELS } from "@/lib/schemas";
import { asc, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const STATUS_CLASSES: Record<string, string> = {
  pending_payment:
    "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  confirmed:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  expired: "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  cancelled: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
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

  const [lineItems, bookedSpaces, paymentHistory, ownerRow] = await Promise.all(
    [
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
    ],
  );

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
  ].sort((a, b) => a.at.getTime() - b.at.getTime());

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
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      p.status === "success"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                        : p.status === "failed"
                          ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                          : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    {p.status}
                  </span>
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

function Card({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className ?? ""}`}
    >
      <h2 className="mb-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">
        {title}
      </h2>
      {children}
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
