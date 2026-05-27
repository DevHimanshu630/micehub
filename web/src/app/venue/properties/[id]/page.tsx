import { StatusBadge } from "@/app/_components/status-badge";
import { db } from "@/db";
import { properties, spaces } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { and, asc, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function VenuePropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("venue");
  const { id } = await params;
  if (!UUID_REGEX.test(id)) notFound();

  const [property] = await db
    .select()
    .from(properties)
    .where(and(eq(properties.id, id), eq(properties.ownerId, user.id)))
    .limit(1);

  if (!property) notFound();

  const propertySpaces = await db
    .select()
    .from(spaces)
    .where(eq(spaces.propertyId, property.id))
    .orderBy(asc(spaces.createdAt));

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-4">
        <Link
          href="/venue/dashboard"
          className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
        >
          &larr; Back to my properties
        </Link>
      </div>

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">
                {property.name}
              </h1>
              <StatusBadge status={property.status} />
            </div>
            <p className="mt-1 text-slate-600 dark:text-slate-400">
              {property.city} · {property.capacity.toLocaleString("en-IN")} pax
              headline capacity
            </p>
          </div>
        </div>

        {property.description ? (
          <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-800">
            <p className="text-sm whitespace-pre-line text-slate-700 dark:text-slate-300">
              {property.description}
            </p>
          </div>
        ) : null}

        {property.status === "pending_approval" ? (
          <div className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            This property is awaiting admin review. It won&apos;t appear on the
            public listing until approved.
          </div>
        ) : null}
        {property.status === "rejected" ? (
          <div className="mt-4 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:bg-rose-950 dark:text-rose-300">
            This property was rejected. Please contact support if you believe
            this was a mistake.
          </div>
        ) : null}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Spaces</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Bookable halls and rooms inside this property.
            </p>
          </div>
          <Link
            href={`/venue/properties/${property.id}/spaces/new`}
            className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            + Add space
          </Link>
        </div>

        {propertySpaces.length === 0 ? (
          <div className="rounded-md border border-dashed border-slate-300 px-6 py-10 text-center text-sm text-slate-600 dark:border-slate-700 dark:text-slate-400">
            No spaces yet. Add halls and rooms to make this venue bookable.
          </div>
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-slate-800">
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
        )}
      </div>
    </div>
  );
}
