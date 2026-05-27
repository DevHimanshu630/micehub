import Link from "next/link";
import type { Property } from "@/db/schema";
import { VenueAvatar } from "./venue-avatar";

export function VenueCard({ property }: { property: Property }) {
  return (
    <Link
      href={`/venues/${property.id}`}
      className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
    >
      <VenueAvatar name={property.name} />
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 text-base font-semibold text-slate-900 group-hover:text-indigo-600 dark:text-slate-100 dark:group-hover:text-indigo-400">
            {property.name}
          </h3>
          <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {property.capacity.toLocaleString("en-IN")} pax
          </span>
        </div>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {property.city}
        </p>
        {property.description ? (
          <p className="mt-2 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">
            {property.description}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
