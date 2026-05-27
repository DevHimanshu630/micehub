import { db } from "@/db";
import { properties, quotes, rfpRecipients, rfps } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { formatINR } from "@/lib/format";
import { EVENT_TYPE_LABELS } from "@/lib/schemas";
import { and, asc, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const STATUS_LABELS: Record<string, string> = {
  sent: "Sent",
  viewed: "Viewed",
  responded: "Quoted",
  declined: "Declined",
};

const STATUS_CLASSES: Record<string, string> = {
  sent: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  viewed: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  responded:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  declined: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
};

export default async function PlannerRfpDetailPage({
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

  const recipients = await db
    .select({
      recipient: rfpRecipients,
      property: properties,
      quote: quotes,
    })
    .from(rfpRecipients)
    .innerJoin(properties, eq(properties.id, rfpRecipients.propertyId))
    .leftJoin(quotes, eq(quotes.rfpRecipientId, rfpRecipients.id))
    .where(eq(rfpRecipients.rfpId, rfp.id))
    .orderBy(asc(rfpRecipients.createdAt));

  const quotedCount = recipients.filter((r) => r.quote !== null).length;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4">
        <Link
          href="/dashboard"
          className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
        >
          &larr; Back to my RFPs
        </Link>
      </div>

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-2xl font-bold tracking-tight">
          {EVENT_TYPE_LABELS[rfp.eventType]}
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          {formatDate(rfp.startDate)} &rarr; {formatDate(rfp.endDate)} ·{" "}
          {rfp.guestCount.toLocaleString("en-IN")} guests
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Detail label="F&B" body={rfp.fbNotes} />
          <Detail label="A/V" body={rfp.avNotes} />
          <Detail label="Other notes" body={rfp.otherNotes} />
          <Detail
            label="Created"
            body={rfp.createdAt.toLocaleString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">
              Sent to {recipients.length}{" "}
              {recipients.length === 1 ? "venue" : "venues"}
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {quotedCount} {quotedCount === 1 ? "venue has" : "venues have"}{" "}
              responded with a quote.
            </p>
          </div>
          {quotedCount > 0 ? (
            <Link
              href={`/dashboard/rfps/${rfp.id}/compare`}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
            >
              Compare quotes ({quotedCount}) &rarr;
            </Link>
          ) : null}
        </div>

        <ul className="divide-y divide-slate-200 dark:divide-slate-800">
          {recipients.map(({ recipient, property, quote }) => (
            <li
              key={recipient.id}
              className="flex items-center justify-between py-3"
            >
              <div>
                <Link
                  href={`/venues/${property.id}`}
                  className="font-medium text-slate-900 hover:text-indigo-600 dark:text-slate-100 dark:hover:text-indigo-400"
                >
                  {property.name}
                </Link>
                <p className="text-xs text-slate-500">{property.city}</p>
              </div>
              <div className="flex items-center gap-3">
                {quote ? (
                  <span className="text-sm font-semibold text-slate-900 tabular-nums dark:text-slate-100">
                    {formatINR(quote.totalAmount)}
                  </span>
                ) : null}
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASSES[recipient.status]}`}
                >
                  {STATUS_LABELS[recipient.status]}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
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
