import { db } from "@/db";
import {
  properties,
  quoteLineItems,
  quotes,
  rfpRecipients,
  rfps,
} from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { formatINR, relativeTimeFromHours } from "@/lib/format";
import { EVENT_TYPE_LABELS } from "@/lib/schemas";
import { and, asc, eq, inArray } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function CompareQuotesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("planner");
  const { id } = await params;
  if (!UUID_REGEX.test(id)) notFound();

  const [rfp] = await db
    .select()
    .from(rfps)
    .where(and(eq(rfps.id, id), eq(rfps.plannerId, user.id)))
    .limit(1);

  if (!rfp) notFound();

  const quoteRows = await db
    .select({
      quote: quotes,
      property: properties,
    })
    .from(quotes)
    .innerJoin(rfpRecipients, eq(rfpRecipients.id, quotes.rfpRecipientId))
    .innerJoin(properties, eq(properties.id, rfpRecipients.propertyId))
    .where(eq(rfpRecipients.rfpId, rfp.id))
    .orderBy(asc(quotes.totalAmount));

  if (quoteRows.length === 0) {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center">
        <Link
          href={`/dashboard/rfps/${rfp.id}`}
          className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
        >
          &larr; Back to RFP
        </Link>
        <h1 className="mt-4 text-2xl font-bold tracking-tight">
          No quotes yet
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Once venues respond to your RFP, you&apos;ll be able to compare their
          quotes here.
        </p>
      </div>
    );
  }

  const quoteIds = quoteRows.map((q) => q.quote.id);
  const lineItems = await db
    .select()
    .from(quoteLineItems)
    .where(inArray(quoteLineItems.quoteId, quoteIds))
    .orderBy(asc(quoteLineItems.sortOrder));

  const itemsByQuote = new Map<string, typeof lineItems>();
  for (const item of lineItems) {
    const existing = itemsByQuote.get(item.quoteId);
    if (existing) {
      existing.push(item);
    } else {
      itemsByQuote.set(item.quoteId, [item]);
    }
  }

  const cheapest = quoteRows[0]?.quote.totalAmount ?? 0;

  return (
    <div>
      <div className="mb-4">
        <Link
          href={`/dashboard/rfps/${rfp.id}`}
          className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
        >
          &larr; Back to RFP
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">
          Compare {quoteRows.length}{" "}
          {quoteRows.length === 1 ? "quote" : "quotes"}
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          {EVENT_TYPE_LABELS[rfp.eventType]} ·{" "}
          {rfp.guestCount.toLocaleString("en-IN")} guests ·{" "}
          {formatDate(rfp.startDate)} → {formatDate(rfp.endDate)} · sorted by
          price
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {quoteRows.map(({ quote, property }) => {
          const isCheapest = quote.totalAmount === cheapest;
          const items = itemsByQuote.get(quote.id) ?? [];
          const responseHours =
            (quote.createdAt.getTime() - rfp.createdAt.getTime()) /
            (1000 * 60 * 60);

          return (
            <div
              key={quote.id}
              className={`flex flex-col overflow-hidden rounded-xl border bg-white shadow-sm dark:bg-slate-900 ${isCheapest ? "border-emerald-400 ring-2 ring-emerald-400" : "border-slate-200 dark:border-slate-800"}`}
            >
              <div className="border-b border-slate-200 p-5 dark:border-slate-800">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link
                      href={`/venues/${property.id}`}
                      className="text-base font-semibold text-slate-900 hover:text-indigo-600 dark:text-slate-100 dark:hover:text-indigo-400"
                    >
                      {property.name}
                    </Link>
                    <p className="text-xs text-slate-500">{property.city}</p>
                  </div>
                  {isCheapest ? (
                    <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      Lowest
                    </span>
                  ) : null}
                </div>
                <p className="mt-3 text-3xl font-bold text-slate-900 tabular-nums dark:text-slate-100">
                  {formatINR(quote.totalAmount)}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Responded in{" "}
                  {relativeTimeFromHours(Math.max(responseHours, 0))}
                </p>
              </div>

              <div className="flex-1 px-5 py-4">
                <h3 className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  Line items ({items.length})
                </h3>
                <ul className="mt-2 space-y-1.5">
                  {items.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-baseline justify-between gap-3 text-sm"
                    >
                      <span className="text-slate-700 dark:text-slate-300">
                        {item.label}
                        <span className="ml-1 text-xs text-slate-500">
                          × {item.quantity}
                          {item.unitLabel ? ` ${item.unitLabel}` : ""}
                        </span>
                      </span>
                      <span className="shrink-0 font-medium text-slate-900 tabular-nums dark:text-slate-100">
                        {formatINR(item.lineTotal)}
                      </span>
                    </li>
                  ))}
                </ul>

                {quote.notes ? (
                  <div className="mt-4 rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:bg-slate-950 dark:text-slate-400">
                    {quote.notes}
                  </div>
                ) : null}
              </div>

              <div className="border-t border-slate-200 bg-slate-50 px-5 py-3 dark:border-slate-800 dark:bg-slate-950">
                <button
                  type="button"
                  disabled
                  title="Booking arrives in Step 8"
                  className="w-full cursor-not-allowed rounded-md bg-indigo-600/40 px-4 py-2 text-sm font-semibold text-white"
                >
                  Pick this quote (Step 8)
                </button>
              </div>
            </div>
          );
        })}
      </div>
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
