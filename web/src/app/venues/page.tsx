import { db } from "@/db";
import { properties } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { and, desc, eq, gte, ilike, type SQL } from "drizzle-orm";
import { SearchFilters } from "./_components/search-filters";
import { VenueCard } from "./_components/venue-card";
import { VenueGridSelectable } from "./_components/venue-grid-selectable";

export const dynamic = "force-dynamic";

export default async function VenuesPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string; min_capacity?: string }>;
}) {
  const { city, min_capacity } = await searchParams;
  const trimmedCity = city?.trim();
  const parsedMinCapacity = (() => {
    if (!min_capacity) return undefined;
    const n = Number(min_capacity);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  })();

  const conditions: SQL[] = [eq(properties.status, "approved")];
  if (trimmedCity) {
    conditions.push(ilike(properties.city, `%${trimmedCity}%`));
  }
  if (parsedMinCapacity !== undefined) {
    conditions.push(gte(properties.capacity, parsedMinCapacity));
  }

  const rows = await db
    .select()
    .from(properties)
    .where(and(...conditions))
    .orderBy(desc(properties.createdAt));

  const user = await getCurrentUser();
  const canSendRfp = user?.role === "planner";

  const filterSummary = [
    trimmedCity ? `in "${trimmedCity}"` : null,
    parsedMinCapacity
      ? `${parsedMinCapacity.toLocaleString("en-IN")}+ pax`
      : null,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Browse venues</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Discover banquet halls, conference centres, and event spaces across
          India.
        </p>
      </div>

      <div className="mb-8">
        <SearchFilters
          activeCity={trimmedCity}
          activeMinCapacity={parsedMinCapacity}
        />
      </div>

      {rows.length === 0 ? (
        <EmptyState summary={filterSummary} />
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {rows.length} {rows.length === 1 ? "venue" : "venues"}
              {filterSummary ? ` ${filterSummary}` : ""}
            </p>
            {canSendRfp ? (
              <p className="text-xs text-slate-500">
                Select multiple venues to send one RFP.
              </p>
            ) : null}
          </div>
          {canSendRfp ? (
            <VenueGridSelectable properties={rows} />
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {rows.map((property) => (
                <VenueCard key={property.id} property={property} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function EmptyState({ summary }: { summary: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
      {summary ? (
        <>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            No venues found {summary}.
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Try a different filter or clear it.
          </p>
        </>
      ) : (
        <p className="text-sm text-slate-600 dark:text-slate-400">
          No venues listed yet. Check back soon.
        </p>
      )}
    </div>
  );
}
