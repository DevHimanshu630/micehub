import { db } from "@/db";
import { properties, quotes, rfpRecipients, rfps, users } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { EVENT_TYPE_LABELS } from "@/lib/schemas";
import { and, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { QuoteForm } from "./_components/quote-form";

export const dynamic = "force-dynamic";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function NewQuotePage({
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

  // If a quote has already been submitted, go back to the detail page.
  const [existingQuote] = await db
    .select({ id: quotes.id })
    .from(quotes)
    .where(eq(quotes.rfpRecipientId, id))
    .limit(1);
  if (existingQuote) redirect(`/venue/rfps/${id}`);

  const { rfp, property, plannerEmail } = row;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <Link
          href={`/venue/rfps/${id}`}
          className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
        >
          &larr; Back to RFP
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">
          Build a quote
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          For <span className="font-medium">{property.name}</span> ·{" "}
          {EVENT_TYPE_LABELS[rfp.eventType]} ·{" "}
          {rfp.guestCount.toLocaleString("en-IN")} guests · from{" "}
          <span className="text-slate-700 dark:text-slate-300">
            {plannerEmail}
          </span>
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <QuoteForm rfpRecipientId={id} backHref={`/venue/rfps/${id}`} />
      </div>
    </div>
  );
}
