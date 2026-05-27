import { db } from "@/db";
import { properties, rfpRecipients, rfps, users } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { EVENT_TYPE_LABELS } from "@/lib/schemas";
import { and, eq } from "drizzle-orm";
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

  // The id is the rfp_recipients row id, not the RFP id.
  // This ensures the venue only sees the rows linked to their own properties.
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

  // Mark as viewed (best-effort, ignore concurrent updates).
  if (row.recipient.status === "sent") {
    await db
      .update(rfpRecipients)
      .set({ status: "viewed" })
      .where(eq(rfpRecipients.id, row.recipient.id));
  }

  const { rfp, property, plannerEmail } = row;

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

      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center dark:border-slate-700 dark:bg-slate-900">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Quote response coming in Step 7
        </p>
        <p className="mt-2 text-xs text-slate-500">
          You&apos;ll be able to build a quote with line items (space rental,
          F&amp;B, A/V) and send it back to the planner.
        </p>
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
