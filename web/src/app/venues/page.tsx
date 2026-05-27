import { db } from "@/db";
import { properties } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { and, asc, desc, eq, gte, ilike, lte, type SQL } from "drizzle-orm";
import { Building2, MapPin, SearchX } from "lucide-react";
import {
  SearchFilters,
  SORT_OPTIONS,
  type SortKey,
} from "./_components/search-filters";
import { VenueCard } from "./_components/venue-card";
import { VenueGridSelectable } from "./_components/venue-grid-selectable";

export const dynamic = "force-dynamic";

function parseSort(raw: string | undefined): SortKey {
  if (!raw) return "newest";
  const allowed = SORT_OPTIONS.map((o) => o.value);
  return (allowed as string[]).includes(raw) ? (raw as SortKey) : "newest";
}

export default async function VenuesPage({
  searchParams,
}: {
  searchParams: Promise<{
    city?: string;
    min_capacity?: string;
    max_capacity?: string;
    sort?: string;
  }>;
}) {
  const params = await searchParams;
  const trimmedCity = params.city?.trim();
  const parsedMinCapacity = parsePositiveInt(params.min_capacity);
  const parsedMaxCapacity = parsePositiveInt(params.max_capacity);
  const sort = parseSort(params.sort);

  const conditions: SQL[] = [eq(properties.status, "approved")];
  if (trimmedCity) {
    conditions.push(ilike(properties.city, `%${trimmedCity}%`));
  }
  if (parsedMinCapacity !== undefined) {
    conditions.push(gte(properties.capacity, parsedMinCapacity));
  }
  if (parsedMaxCapacity !== undefined) {
    conditions.push(lte(properties.capacity, parsedMaxCapacity));
  }

  const orderBy = (() => {
    switch (sort) {
      case "name_asc":
        return asc(properties.name);
      case "capacity_desc":
        return desc(properties.capacity);
      case "capacity_asc":
        return asc(properties.capacity);
      case "newest":
      default:
        return desc(properties.createdAt);
    }
  })();

  const rows = await db
    .select()
    .from(properties)
    .where(and(...conditions))
    .orderBy(orderBy);

  const user = await getCurrentUser();
  const canSendRfp = user?.role === "planner";

  const activeFilters = [
    trimmedCity ? { label: `City: ${trimmedCity}`, key: "city" } : null,
    parsedMinCapacity
      ? {
          label: `Min ${parsedMinCapacity.toLocaleString("en-IN")} pax`,
          key: "min",
        }
      : null,
    parsedMaxCapacity
      ? {
          label: `Max ${parsedMaxCapacity.toLocaleString("en-IN")} pax`,
          key: "max",
        }
      : null,
  ].filter((x): x is { label: string; key: string } => x !== null);

  return (
    <div>
      <header className="mb-6 flex flex-col gap-1 md:mb-8">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          Browse venues
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Banquet halls, conference centres, and event spaces across India.
          {canSendRfp ? " Select multiple to send a single RFP." : null}
        </p>
      </header>

      <div className="mb-6">
        <SearchFilters
          activeCity={trimmedCity}
          activeMinCapacity={parsedMinCapacity}
          activeMaxCapacity={parsedMaxCapacity}
          activeSort={sort}
        />
      </div>

      {rows.length === 0 ? (
        <EmptyState hasFilter={activeFilters.length > 0} />
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Building2 className="h-4 w-4 text-slate-400" />
              <span>
                <strong className="font-semibold text-slate-900 dark:text-slate-100">
                  {rows.length}
                </strong>{" "}
                {rows.length === 1 ? "venue" : "venues"}
              </span>
              {activeFilters.length > 0 ? (
                <>
                  <span className="text-slate-300 dark:text-slate-700">·</span>
                  {activeFilters.map((f) => (
                    <span
                      key={f.key}
                      className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300"
                    >
                      {f.label}
                    </span>
                  ))}
                </>
              ) : null}
            </div>
            <p className="text-xs text-slate-500">
              Sorted by{" "}
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {SORT_OPTIONS.find((o) => o.value === sort)?.label}
              </span>
            </p>
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

function parsePositiveInt(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : undefined;
}

function EmptyState({ hasFilter }: { hasFilter: boolean }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800">
        {hasFilter ? (
          <SearchX className="h-6 w-6" />
        ) : (
          <MapPin className="h-6 w-6" />
        )}
      </div>
      {hasFilter ? (
        <>
          <p className="text-base font-medium text-slate-900 dark:text-slate-100">
            No venues match these filters
          </p>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            Try widening the capacity range or clearing the city filter.
          </p>
        </>
      ) : (
        <>
          <p className="text-base font-medium text-slate-900 dark:text-slate-100">
            No venues listed yet
          </p>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            Check back soon — venues are joining MICEHub every week.
          </p>
        </>
      )}
    </div>
  );
}
