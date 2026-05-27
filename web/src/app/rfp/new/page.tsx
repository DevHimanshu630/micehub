import { db } from "@/db";
import { properties } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { and, eq, inArray } from "drizzle-orm";
import Link from "next/link";
import { RfpForm } from "./_components/rfp-form";

export const dynamic = "force-dynamic";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function NewRfpPage({
  searchParams,
}: {
  searchParams: Promise<{ venue_ids?: string }>;
}) {
  await requireRole("planner");
  const { venue_ids } = await searchParams;

  const ids = (venue_ids ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => UUID_REGEX.test(s));

  const selectedVenues =
    ids.length === 0
      ? []
      : await db
          .select({
            id: properties.id,
            name: properties.name,
            city: properties.city,
          })
          .from(properties)
          .where(
            and(inArray(properties.id, ids), eq(properties.status, "approved")),
          );

  if (selectedVenues.length === 0) {
    return (
      <div className="mx-auto max-w-2xl py-12">
        <h1 className="text-2xl font-bold tracking-tight">
          Pick some venues first
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          To send an RFP, browse venues and select one or more.
        </p>
        <Link
          href="/venues"
          className="mt-6 inline-block rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
        >
          Browse venues &rarr;
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <Link
          href="/venues"
          className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
        >
          &larr; Back to venues
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">
          Send a request for proposal
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Tell us about your event. We&apos;ll forward this to each selected
          venue.
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <RfpForm selectedVenues={selectedVenues} />
      </div>
    </div>
  );
}
