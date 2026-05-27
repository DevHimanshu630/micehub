import { db } from "@/db";
import { properties, spaces } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { and, asc, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { VenueAvatar } from "../_components/venue-avatar";

export const dynamic = "force-dynamic";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function VenueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!UUID_REGEX.test(id)) notFound();

  const [property] = await db
    .select()
    .from(properties)
    .where(and(eq(properties.id, id), eq(properties.status, "approved")))
    .limit(1);

  if (!property) notFound();

  const propertySpaces = await db
    .select()
    .from(spaces)
    .where(eq(spaces.propertyId, property.id))
    .orderBy(asc(spaces.createdAt));

  const user = await getCurrentUser();
  const canSendRfp = user?.role === "planner";

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-4">
        <Link
          href="/venues"
          className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
        >
          &larr; Back to venues
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <VenueAvatar name={property.name} size="lg" />

        <div className="p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {property.name}
              </h1>
              <p className="mt-1 text-slate-600 dark:text-slate-400">
                {property.city}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                {property.capacity.toLocaleString("en-IN")} pax capacity
              </span>
            </div>
          </div>

          {property.description ? (
            <div className="mt-6">
              <h2 className="text-sm font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
                About this venue
              </h2>
              <p className="mt-2 whitespace-pre-line text-slate-700 dark:text-slate-300">
                {property.description}
              </p>
            </div>
          ) : null}

          {propertySpaces.length > 0 ? (
            <div className="mt-8 border-t border-slate-200 pt-6 dark:border-slate-800">
              <h2 className="text-sm font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
                Bookable spaces ({propertySpaces.length})
              </h2>
              <ul className="mt-3 divide-y divide-slate-200 dark:divide-slate-800">
                {propertySpaces.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-start justify-between gap-4 py-3"
                  >
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        {s.name}
                      </p>
                      {s.description ? (
                        <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
                          {s.description}
                        </p>
                      ) : null}
                    </div>
                    <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {s.capacity.toLocaleString("en-IN")} pax
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="mt-8 flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
            <p className="text-sm text-slate-500">
              Listed{" "}
              {property.createdAt.toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
            {canSendRfp ? (
              <Link
                href={`/rfp/new?venue_ids=${property.id}`}
                className="rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
              >
                Request a quote &rarr;
              </Link>
            ) : (
              <Link
                href={user ? "/" : "/sign-up"}
                className="rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
              >
                {user
                  ? "Sign in as Planner to quote"
                  : "Sign up as Planner to quote"}
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
