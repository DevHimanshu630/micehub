"use client";

import {
  AMENITY_LABELS,
  AMENITY_OPTIONS,
  OWNERSHIP_LABELS,
  OWNERSHIP_OPTIONS,
  VENUE_TYPE_LABELS,
  VENUE_TYPE_OPTIONS,
} from "@/lib/venue-meta";
import { SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export function FilterRail({
  activeCity,
  activeTypes,
  activeMinCapacity,
  activeMaxCapacity,
  activeAmenities,
  activeOwnership,
  activeSort,
}: {
  activeCity?: string;
  activeTypes: string[];
  activeMinCapacity?: number;
  activeMaxCapacity?: number;
  activeAmenities: string[];
  activeOwnership: string[];
  activeSort: string;
}) {
  const [open, setOpen] = useState(false);

  const activeCount =
    (activeCity ? 1 : 0) +
    activeTypes.length +
    (activeMinCapacity ? 1 : 0) +
    (activeMaxCapacity ? 1 : 0) +
    activeAmenities.length +
    activeOwnership.length;

  return (
    <>
      {/* Mobile: toggle button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mb-4 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm md:hidden dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
      >
        <SlidersHorizontal className="h-4 w-4" />
        Filters
        {activeCount > 0 ? (
          <span className="rounded-full bg-indigo-600 px-1.5 text-xs font-semibold text-white">
            {activeCount}
          </span>
        ) : null}
      </button>

      {/* Mobile drawer backdrop */}
      {open ? (
        <button
          type="button"
          aria-label="Close filters"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm md:hidden"
        />
      ) : null}

      <aside
        className={`${
          open
            ? "fixed inset-y-0 left-0 z-50 w-80 max-w-[85%] overflow-y-auto shadow-xl"
            : "hidden"
        } md:sticky md:top-20 md:z-0 md:block md:h-fit md:w-full md:max-w-none md:shadow-none`}
      >
        <div className="h-full rounded-none border-slate-200 bg-white md:rounded-xl md:border md:shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <form action="/venues" method="get" className="p-4">
            <input type="hidden" name="sort" value={activeSort} />

            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Filters
              </h2>
              <div className="flex items-center gap-3">
                {activeCount > 0 ? (
                  <Link
                    href="/venues"
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                  >
                    Reset all
                  </Link>
                ) : null}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-slate-400 hover:text-slate-600 md:hidden"
                  aria-label="Close filters"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <Section label="City">
              <input
                name="city"
                type="search"
                defaultValue={activeCity ?? ""}
                placeholder="Any city"
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </Section>

            <Section label="Venue type">
              <CheckboxList
                name="type"
                options={VENUE_TYPE_OPTIONS.map((v) => ({
                  value: v,
                  label: VENUE_TYPE_LABELS[v],
                }))}
                active={activeTypes}
              />
            </Section>

            <Section label="Capacity (pax)">
              <div className="flex items-center gap-2">
                <input
                  name="min_capacity"
                  type="number"
                  min={1}
                  defaultValue={activeMinCapacity ?? ""}
                  placeholder="Min"
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
                <span className="text-slate-400">–</span>
                <input
                  name="max_capacity"
                  type="number"
                  min={1}
                  defaultValue={activeMaxCapacity ?? ""}
                  placeholder="Max"
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
            </Section>

            <Section label="Amenities">
              <CheckboxList
                name="amenities"
                options={AMENITY_OPTIONS.map((a) => ({
                  value: a,
                  label: AMENITY_LABELS[a],
                }))}
                active={activeAmenities}
              />
            </Section>

            <Section label="Ownership" last>
              <CheckboxList
                name="ownership"
                options={OWNERSHIP_OPTIONS.map((o) => ({
                  value: o,
                  label: OWNERSHIP_LABELS[o],
                }))}
                active={activeOwnership}
              />
            </Section>

            <button
              type="submit"
              className="mt-4 w-full rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
            >
              Apply filters
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}

function Section({
  label,
  children,
  last = false,
}: {
  label: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div
      className={`py-4 ${last ? "" : "border-b border-slate-100 dark:border-slate-800"}`}
    >
      <p className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
        {label}
      </p>
      {children}
    </div>
  );
}

function CheckboxList({
  name,
  options,
  active,
}: {
  name: string;
  options: { value: string; label: string }[];
  active: string[];
}) {
  return (
    <div className="space-y-1.5">
      {options.map((o) => (
        <label
          key={o.value}
          className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-300"
        >
          <input
            type="checkbox"
            name={name}
            value={o.value}
            defaultChecked={active.includes(o.value)}
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-600"
          />
          {o.label}
        </label>
      ))}
    </div>
  );
}
