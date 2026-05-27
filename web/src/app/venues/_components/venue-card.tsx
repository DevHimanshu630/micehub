import type { Property } from "@/db/schema";
import { ArrowUpRight, MapPin, Users } from "lucide-react";
import Link from "next/link";
import { VenueAvatar } from "./venue-avatar";

export function VenueCard({ property }: { property: Property }) {
  return (
    <Link
      href={`/venues/${property.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-700"
    >
      <div className="relative">
        <VenueAvatar name={property.name} />
        <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-slate-800 shadow-sm backdrop-blur dark:bg-slate-900/95 dark:text-slate-100">
          <Users className="h-3 w-3" />
          {property.capacity.toLocaleString("en-IN")}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 text-base font-semibold text-slate-900 group-hover:text-indigo-600 dark:text-slate-100 dark:group-hover:text-indigo-400">
            {property.name}
          </h3>
          <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-indigo-500" />
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <MapPin className="h-3.5 w-3.5" />
          {property.city}
        </div>
        {property.description ? (
          <p className="mt-auto line-clamp-2 text-sm text-slate-600 dark:text-slate-400">
            {property.description}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
