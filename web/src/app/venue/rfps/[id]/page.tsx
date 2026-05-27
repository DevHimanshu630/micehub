import { db } from "@/db";
import {
  bookings,
  properties,
  quoteLineItems,
  quotes,
  rfpRecipients,
  rfps,
  users,
} from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { formatINR } from "@/lib/format";
import { EVENT_TYPE_LABELS } from "@/lib/schemas";
import { and, asc, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function VenueRfpDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("venue");
  const { id } = await params;
  if (!UUID_REGEX.test(id)) notFound();

  const [row] = await db
    .select({
      recipient: rfpRecipients,
      rfp: rfps,
      property: properties,
      plannerEmail: users.email,
    })
    .from(rfpRecipients)
    .innerJoin(properties, eq(properties.id, rfpRecipients.propertyId))
    .innerJoin(rfps, eq(rfps.id, rfpRecipients.rfpId))
    .innerJoin(users, eq(users.id, rfps.plannerId))
    .where(and(eq(rfpRecipients.id, id), eq(properties.ownerId, user.id)))
    .limit(1);

  if (!row) notFound();

  // Mark as viewed if still 'sent'.
  if (row.recipient.status === "sent") {
    await db
      .update(rfpRecipients)
      .set({ status: "viewed" })
      .where(eq(rfpRecipients.id, row.recipient.id));
  }

  const { rfp, property, plannerEmail } = row;

  const [existingQuote] = await db
    .select()
    .from(quotes)
    .where(eq(quotes.rfpRecipientId, id))
    .limit(1);

  const existingLineItems = existingQuote
    ? await db
        .select()
        .from(quoteLineItems)
        .where(eq(quoteLineItems.quoteId, existingQuote.id))
        .orderBy(asc(quoteLineItems.sortOrder))
    : [];

  const [existingBooking] = existingQuote
    ? await db
        .select({ id: bookings.id, status: bookings.status })
        .from(bookings)
        .where(eq(bookings.quoteId, existingQuote.id))
        .limit(1)
    : [];

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4">
        <Link
          href="/venue/rfps"
          className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
        >
          &larr; Back to inbox
        </Link>
      </div>

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {EVENT_TYPE_LABELS[rfp.eventType]}
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {formatDate(rfp.startDate)} &rarr; {formatDate(rfp.endDate)} ·{" "}
              {rfp.guestCount.toLocaleString("en-IN")} guests
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">For your property</p>
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
              {property.name}
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Detail label="Planner" body={plannerEmail} />
          <Detail
            label="Received"
            body={rfp.createdAt.toLocaleString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          />
          <Detail label="F&B" body={rfp.fbNotes} />
          <Detail label="A/V" body={rfp.avNotes} />
        </div>

        {rfp.otherNotes ? (
          <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-800">
            <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
              Other notes
            </p>
            <p className="mt-1 text-sm whitespace-pre-line text-slate-700 dark:text-slate-300">
              {rfp.otherNotes}
            </p>
          </div>
        ) : null}
      </div>

      {existingQuote ? (
        <SubmittedQuote
          totalAmount={existingQuote.totalAmount}
          submittedAt={existingQuote.createdAt}
          notes={existingQuote.notes}
          lineItems={existingLineItems}
          bookingId={existingBooking?.id}
          bookingStatus={existingBooking?.status}
        />
      ) : (
        <BuildQuoteCta recipientId={id} />
      )}
    </div>
  );
}

function BuildQuoteCta({ recipientId }: { recipientId: string }) {
  return (
    <div className="rounded-xl border-2 border-indigo-200 bg-indigo-50 p-6 text-center dark:border-indigo-900 dark:bg-indigo-950/30">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
        Ready to respond?
      </h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        Build a quote with line items. The planner will see your total alongside
        any other quotes they&apos;ve received.
      </p>
      <Link
        href={`/venue/rfps/${recipientId}/quote/new`}
        className="mt-4 inline-block rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
      >
        Build a quote &rarr;
      </Link>
    </div>
  );
}

function SubmittedQuote({
  totalAmount,
  submittedAt,
  notes,
  lineItems,
  bookingId,
  bookingStatus,
}: {
  totalAmount: number;
  submittedAt: Date;
  notes: string | null;
  lineItems: Array<{
    id: string;
    label: string;
    unitLabel: string | null;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
  }>;
  bookingId: string | undefined;
  bookingStatus:
    | "pending_payment"
    | "confirmed"
    | "expired"
    | "cancelled"
    | undefined;
}) {
  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-900 dark:bg-emerald-950/30">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold tracking-wide text-emerald-700 uppercase dark:text-emerald-400">
            Quote sent
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            {submittedAt.toLocaleString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <p className="text-2xl font-bold text-slate-900 tabular-nums dark:text-slate-100">
          {formatINR(totalAmount)}
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-emerald-200 bg-white dark:border-emerald-900 dark:bg-slate-900">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
          <thead className="bg-slate-50 dark:bg-slate-950">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold tracking-wide text-slate-600 uppercase dark:text-slate-400">
                Item
              </th>
              <th className="px-4 py-2 text-right text-xs font-semibold tracking-wide text-slate-600 uppercase dark:text-slate-400">
                Unit price
              </th>
              <th className="px-4 py-2 text-right text-xs font-semibold tracking-wide text-slate-600 uppercase dark:text-slate-400">
                Qty
              </th>
              <th className="px-4 py-2 text-right text-xs font-semibold tracking-wide text-slate-600 uppercase dark:text-slate-400">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {lineItems.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-2 text-sm">
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {item.label}
                  </span>
                  {item.unitLabel ? (
                    <span className="ml-1 text-xs text-slate-500">
                      ({item.unitLabel})
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-2 text-right text-sm text-slate-700 tabular-nums dark:text-slate-300">
                  {formatINR(item.unitPrice)}
                </td>
                <td className="px-4 py-2 text-right text-sm text-slate-700 tabular-nums dark:text-slate-300">
                  {item.quantity}
                </td>
                <td className="px-4 py-2 text-right text-sm font-medium text-slate-900 tabular-nums dark:text-slate-100">
                  {formatINR(item.lineTotal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {notes ? (
        <div className="mt-4 rounded-md bg-white px-3 py-2 text-sm text-slate-700 dark:bg-slate-900 dark:text-slate-300">
          <p className="mb-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
            Notes
          </p>
          {notes}
        </div>
      ) : null}

      {bookingId ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md bg-white px-3 py-2 text-sm dark:bg-slate-900">
          <span className="text-slate-600 dark:text-slate-400">
            Planner accepted this quote ·{" "}
            <span className="font-medium">
              {bookingStatus === "confirmed"
                ? "Booking confirmed"
                : bookingStatus === "pending_payment"
                  ? "Awaiting payment"
                  : bookingStatus}
            </span>
          </span>
          <a
            href={`/api/invoices/${bookingId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Download invoice (PDF)
          </a>
        </div>
      ) : null}
    </div>
  );
}

function Detail({ label, body }: { label: string; body: string | null }) {
  return (
    <div>
      <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
        {label}
      </p>
      <p className="mt-1 text-sm whitespace-pre-line text-slate-700 dark:text-slate-300">
        {body || "—"}
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
