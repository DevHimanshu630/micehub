"use client";

import type { Property } from "@/db/schema";
import { ArrowUpRight, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { VenueRow, type CapacityRange } from "./venue-row";

export function VenueGridSelectable({
  properties,
  capacityRanges,
}: {
  properties: Property[];
  capacityRanges: Record<string, CapacityRange>;
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

  function sendRfp() {
    if (selected.size === 0) return;
    router.push(`/rfp/new?venue_ids=${[...selected].join(",")}`);
  }

  return (
    <>
      <div className="space-y-4">
        {properties.map((p) => {
          const isSelected = selected.has(p.id);
          return (
            <VenueRow
              key={p.id}
              property={p}
              capacityRange={capacityRanges[p.id] ?? null}
              highlighted={isSelected}
              leftSlot={
                <button
                  type="button"
                  onClick={() => toggle(p.id)}
                  aria-pressed={isSelected}
                  aria-label={
                    isSelected ? `Deselect ${p.name}` : `Select ${p.name}`
                  }
                  className={`absolute top-3 left-3 z-10 flex h-7 w-7 items-center justify-center rounded-md border-2 shadow-sm transition ${
                    isSelected
                      ? "border-indigo-600 bg-indigo-600 text-white"
                      : "border-white/90 bg-white/90 text-transparent hover:border-indigo-400 dark:border-slate-700 dark:bg-slate-800/80"
                  }`}
                >
                  {isSelected ? <Check className="h-4 w-4" /> : null}
                </button>
              }
            />
          );
        })}
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
              onClick={() => setSelected(new Set())}
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
