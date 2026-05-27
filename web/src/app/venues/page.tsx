import { db } from "@/db";
import { properties } from "@/db/schema";
import { and, desc, eq, ilike } from "drizzle-orm";
import { CityFilter } from "./_components/city-filter";
import { VenueCard } from "./_components/venue-card";

export const dynamic = "force-dynamic";

export default async function VenuesPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string }>;
}) {
  const { city } = await searchParams;
  const trimmedCity = city?.trim();

  const conditions = [eq(properties.status, "approved")];
  if (trimmedCity) {
    conditions.push(ilike(properties.city, `%${trimmedCity}%`));
  }

  const rows = await db
    .select()
    .from(properties)
    .where(and(...conditions))
    .orderBy(desc(properties.createdAt));

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
        <CityFilter activeCity={trimmedCity} />
      </div>

      {rows.length === 0 ? (
        <EmptyState city={trimmedCity} />
      ) : (
        <>
          <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
            {rows.length} {rows.length === 1 ? "venue" : "venues"}
            {trimmedCity ? ` matching "${trimmedCity}"` : ""}
          </p>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((property) => (
              <VenueCard key={property.id} property={property} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function EmptyState({ city }: { city?: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
      {city ? (
        <>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            No venues found in <span className="font-medium">{city}</span> yet.
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Try a different city or clear the filter.
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
