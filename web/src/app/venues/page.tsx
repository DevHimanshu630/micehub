import { db } from "@/db";
import { properties, spaces } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import {
  AMENITY_OPTIONS,
  OWNERSHIP_OPTIONS,
  VENUE_TYPE_OPTIONS,
} from "@/lib/venue-meta";
import {
  and,
  arrayContains,
  asc,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lte,
  sql,
  type SQL,
} from "drizzle-orm";
import { Building2, MapPin, SearchX } from "lucide-react";
import Link from "next/link";
import { FilterRail } from "./_components/filter-rail";
import { VenueGridSelectable } from "./_components/venue-grid-selectable";
import { VenueRow, type CapacityRange } from "./_components/venue-row";

export const dynamic = "force-dynamic";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "name_asc", label: "Name A–Z" },
  { value: "capacity_desc", label: "Capacity: High–Low" },
  { value: "capacity_asc", label: "Capacity: Low–High" },
] as const;

type SortKey = (typeof SORT_OPTIONS)[number]["value"];

type RawParams = {
  city?: string;
  min_capacity?: string;
  max_capacity?: string;
  type?: string | string[];
  amenities?: string | string[];
  ownership?: string | string[];
  sort?: string;
};

function toArray<T extends string>(
  v: string | string[] | undefined,
  allowed: readonly T[],
): T[] {
  if (!v) return [];
  const arr = Array.isArray(v) ? v : [v];
  return arr.filter((x): x is T => (allowed as readonly string[]).includes(x));
}

function parsePositiveInt(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : undefined;
}

function parseSort(raw: string | undefined): SortKey {
  const allowed = SORT_OPTIONS.map((o) => o.value);
  return (allowed as string[]).includes(raw ?? "")
    ? (raw as SortKey)
    : "newest";
}

export default async function VenuesPage({
  searchParams,
}: {
  searchParams: Promise<RawParams>;
}) {
  const params = await searchParams;

  const city = params.city?.trim() || undefined;
  const minCap = parsePositiveInt(params.min_capacity);
  const maxCap = parsePositiveInt(params.max_capacity);
  const types = toArray(params.type, VENUE_TYPE_OPTIONS);
  const amenities = toArray(params.amenities, AMENITY_OPTIONS);
  const ownership = toArray(params.ownership, OWNERSHIP_OPTIONS);
  const sort = parseSort(params.sort);

  const conditions: SQL[] = [eq(properties.status, "approved")];
  if (city) conditions.push(ilike(properties.city, `%${city}%`));
  if (minCap !== undefined) conditions.push(gte(properties.capacity, minCap));
  if (maxCap !== undefined) conditions.push(lte(properties.capacity, maxCap));
  if (types.length > 0) conditions.push(inArray(properties.venueType, types));
  if (ownership.length > 0)
    conditions.push(inArray(properties.ownership, ownership));
  if (amenities.length > 0)
    conditions.push(arrayContains(properties.amenities, amenities));

  const orderBy = (() => {
    switch (sort) {
      case "name_asc":
        return asc(properties.name);
      case "capacity_desc":
        return desc(properties.capacity);
      case "capacity_asc":
        return asc(properties.capacity);
      default:
        return desc(properties.createdAt);
    }
  })();

  const rows = await db
    .select()
    .from(properties)
    .where(and(...conditions))
    .orderBy(orderBy);

  // Real capacity range per property, derived from its bookable spaces.
  const capacityRanges: Record<string, CapacityRange> = {};
  if (rows.length > 0) {
    const ids = rows.map((r) => r.id);
    const caps = await db
      .select({
        propertyId: spaces.propertyId,
        minCap: sql<number>`min(${spaces.capacity})`,
        maxCap: sql<number>`max(${spaces.capacity})`,
      })
      .from(spaces)
      .where(inArray(spaces.propertyId, ids))
      .groupBy(spaces.propertyId);
    for (const c of caps) {
      capacityRanges[c.propertyId] = {
        min: Number(c.minCap),
        max: Number(c.maxCap),
      };
    }
  }

  const user = await getCurrentUser();
  const canSendRfp = user?.role === "planner";

  // Build a sort-tab href that preserves the active filters.
  function sortHref(value: SortKey): string {
    const qs = new URLSearchParams();
    if (city) qs.set("city", city);
    if (minCap !== undefined) qs.set("min_capacity", String(minCap));
    if (maxCap !== undefined) qs.set("max_capacity", String(maxCap));
    for (const t of types) qs.append("type", t);
    for (const a of amenities) qs.append("amenities", a);
    for (const o of ownership) qs.append("ownership", o);
    qs.set("sort", value);
    return `/venues?${qs.toString()}`;
  }

  return (
    <div>
      <header className="mb-6 flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          Browse venues
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Banquet halls, conference centres, and event spaces across India.
          {canSendRfp ? " Select multiple to send a single RFP." : null}
        </p>
      </header>

      <div className="flex flex-col gap-6 md:flex-row md:items-start">
        <div className="md:w-64 md:shrink-0">
          <FilterRail
            activeCity={city}
            activeTypes={types}
            activeMinCapacity={minCap}
            activeMaxCapacity={maxCap}
            activeAmenities={amenities}
            activeOwnership={ownership}
            activeSort={sort}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-4 flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
            <p className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Building2 className="h-4 w-4 text-slate-400" />
              <span>
                <strong className="font-semibold text-slate-900 dark:text-slate-100">
                  {rows.length}
                </strong>{" "}
                {rows.length === 1 ? "venue" : "venues"} found
              </span>
            </p>
            <div className="flex flex-wrap gap-1">
              {SORT_OPTIONS.map((opt) => {
                const active = opt.value === sort;
                return (
                  <Link
                    key={opt.value}
                    href={sortHref(opt.value)}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                      active
                        ? "bg-indigo-600 text-white"
                        : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                    }`}
                  >
                    {opt.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {rows.length === 0 ? (
            <EmptyState
              hasFilter={Boolean(
                city ||
                minCap ||
                maxCap ||
                types.length ||
                amenities.length ||
                ownership.length,
              )}
            />
          ) : canSendRfp ? (
            <VenueGridSelectable
              properties={rows}
              capacityRanges={capacityRanges}
            />
          ) : (
            <div className="space-y-4">
              {rows.map((property) => (
                <VenueRow
                  key={property.id}
                  property={property}
                  capacityRange={capacityRanges[property.id] ?? null}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
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
            Try widening the capacity range or clearing a filter on the left.
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
