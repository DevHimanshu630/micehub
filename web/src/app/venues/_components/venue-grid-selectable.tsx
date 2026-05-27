"use client";

import type { Property } from "@/db/schema";
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
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
          <div className="flex items-center gap-4 rounded-full border border-slate-200 bg-white px-5 py-3 shadow-lg dark:border-slate-700 dark:bg-slate-900">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {selected.size} {selected.size === 1 ? "venue" : "venues"}{" "}
              selected
            </span>
            <button
              type="button"
              onClick={clear}
              className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={sendRfp}
              className="rounded-full bg-indigo-600 px-4 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
            >
              Send RFP &rarr;
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
      className={`group relative overflow-hidden rounded-xl border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-900 ${isSelected ? "border-indigo-500 ring-2 ring-indigo-500" : "border-slate-200 dark:border-slate-800"}`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-label={
          isSelected ? `Deselect ${property.name}` : `Select ${property.name}`
        }
        className={`absolute top-3 left-3 z-10 flex h-7 w-7 items-center justify-center rounded-md border-2 transition ${
          isSelected
            ? "border-indigo-600 bg-indigo-600 text-white"
            : "border-white/80 bg-white/80 text-transparent hover:border-indigo-400 dark:border-slate-700 dark:bg-slate-800"
        }`}
      >
        {isSelected ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4"
          >
            <path
              fillRule="evenodd"
              d="M16.704 5.29a1 1 0 010 1.42l-8 8a1 1 0 01-1.42 0l-4-4a1 1 0 011.42-1.42L8 12.59l7.29-7.3a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        ) : null}
      </button>

      <Link href={`/venues/${property.id}`} className="block">
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
    </div>
  );
}
