import type { Property } from "@/db/schema";
import { amenityLabel, venueTypeLabel } from "@/lib/venue-meta";
import { ArrowUpRight, BadgeCheck, MapPin, Users } from "lucide-react";
import Link from "next/link";
import { VenueAvatar } from "./venue-avatar";

export type CapacityRange = { min: number; max: number } | null;

function capacityLabel(property: Property, range: CapacityRange): string {
  if (range) {
    return range.min === range.max
      ? `${range.max.toLocaleString("en-IN")} pax`
      : `${range.min.toLocaleString("en-IN")}–${range.max.toLocaleString("en-IN")} pax`;
  }
  return `${property.capacity.toLocaleString("en-IN")} pax`;
}

export function VenueRow({
  property,
  capacityRange,
  leftSlot,
  highlighted = false,
}: {
  property: Property;
  capacityRange: CapacityRange;
  leftSlot?: React.ReactNode;
  highlighted?: boolean;
}) {
  const amenities = property.amenities ?? [];

  return (
    <div
      className={`group relative flex flex-col gap-4 rounded-xl border bg-white p-4 transition sm:flex-row dark:bg-slate-900 ${
        highlighted
          ? "border-indigo-500 ring-2 ring-indigo-500"
          : "border-slate-200 hover:border-indigo-300 hover:shadow-md dark:border-slate-800 dark:hover:border-indigo-700"
      }`}
    >
      {leftSlot}

      <Link
        href={`/venues/${property.id}`}
        className="flex flex-1 flex-col gap-4 sm:flex-row"
      >
        <div className="w-full shrink-0 overflow-hidden rounded-lg sm:w-44">
          <VenueAvatar name={property.name} size="md" />
        </div>

        <div className="flex flex-1 flex-col gap-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <h3 className="text-lg font-semibold text-slate-900 group-hover:text-indigo-600 dark:text-slate-100 dark:group-hover:text-indigo-400">
                  {property.name}
                </h3>
                {property.status === "approved" ? (
                  <span className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    Verified
                  </span>
                ) : null}
              </div>
              <p className="mt-0.5 flex items-center gap-1 text-sm text-slate-500">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                {property.address ?? property.city}
              </p>
            </div>
            <ArrowUpRight className="hidden h-5 w-5 shrink-0 text-slate-300 transition group-hover:text-indigo-500 sm:block" />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              {venueTypeLabel(property.venueType)}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <Users className="h-3 w-3" />
              {capacityLabel(property, capacityRange)}
            </span>
          </div>

          {amenities.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {amenities.slice(0, 4).map((a) => (
                <span
                  key={a}
                  className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300"
                >
                  {amenityLabel(a)}
                </span>
              ))}
              {amenities.length > 4 ? (
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-500 dark:bg-slate-800">
                  +{amenities.length - 4} more
                </span>
              ) : null}
            </div>
          ) : null}

          {property.description ? (
            <p className="line-clamp-2 text-sm text-slate-600 dark:text-slate-400">
              {property.description}
            </p>
          ) : null}
        </div>
      </Link>
    </div>
  );
}
