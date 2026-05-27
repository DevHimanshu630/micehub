"use client";

import type { Property } from "@/db/schema";
import { ArrowUpRight, Check, MapPin, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { VenueAvatar } from "./venue-avatar";

export function VenueGridSelectable({
  properties,
}: {
  properties: Property[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function clear() {
    setSelected(new Set());
  }

  function sendRfp() {
    if (selected.size === 0) return;
    const ids = [...selected].join(",");
    router.push(`/rfp/new?venue_ids=${ids}`);
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {properties.map((p) => (
          <SelectableCard
            key={p.id}
            property={p}
            isSelected={selected.has(p.id)}
            onToggle={() => toggle(p.id)}
          />
        ))}
      </div>

      {selected.size > 0 ? (
        <div className="fixed right-4 bottom-6 left-4 z-50 mx-auto max-w-md sm:right-auto sm:left-1/2 sm:-translate-x-1/2">
          <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white py-2 pr-2 pl-5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              <strong className="text-slate-900 dark:text-slate-100">
                {selected.size}
              </strong>{" "}
              {selected.size === 1 ? "venue" : "venues"}
            </span>
            <button
              type="button"
              onClick={clear}
              className="rounded-full px-2.5 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={sendRfp}
              className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
            >
              Send RFP
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

function SelectableCard({
  property,
  isSelected,
  onToggle,
}: {
  property: Property;
  isSelected: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={`group relative flex flex-col overflow-hidden rounded-xl border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:bg-slate-900 ${
        isSelected
          ? "border-indigo-500 ring-2 ring-indigo-500"
          : "border-slate-200 hover:border-indigo-300 dark:border-slate-800 dark:hover:border-indigo-700"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-label={
          isSelected ? `Deselect ${property.name}` : `Select ${property.name}`
        }
        aria-pressed={isSelected}
        className={`absolute top-3 left-3 z-10 flex h-7 w-7 items-center justify-center rounded-md border-2 shadow-sm transition ${
          isSelected
            ? "border-indigo-600 bg-indigo-600 text-white"
            : "border-white/90 bg-white/90 text-transparent hover:border-indigo-400 dark:border-slate-700 dark:bg-slate-800/80"
        }`}
      >
        {isSelected ? <Check className="h-4 w-4" /> : null}
      </button>

      <Link href={`/venues/${property.id}`} className="flex flex-1 flex-col">
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
    </div>
  );
}
