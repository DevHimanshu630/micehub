import { ArrowUpDown, MapPin, Search, Users, X } from "lucide-react";
import Link from "next/link";

export type SortKey = "newest" | "name_asc" | "capacity_desc" | "capacity_asc";

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "newest", label: "Recently added" },
  { value: "name_asc", label: "Name (A → Z)" },
  { value: "capacity_desc", label: "Capacity (high → low)" },
  { value: "capacity_asc", label: "Capacity (low → high)" },
];

export function SearchFilters({
  activeCity,
  activeMinCapacity,
  activeMaxCapacity,
  activeSort,
}: {
  activeCity?: string;
  activeMinCapacity?: number;
  activeMaxCapacity?: number;
  activeSort: SortKey;
}) {
  const hasFilter = Boolean(
    activeCity ||
    activeMinCapacity ||
    activeMaxCapacity ||
    activeSort !== "newest",
  );

  return (
    <form
      action="/venues"
      method="get"
      className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm md:p-4 dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
        <FilterField
          icon={<MapPin className="h-4 w-4" />}
          label="City"
          className="md:col-span-4"
        >
          <input
            id="city"
            name="city"
            type="search"
            defaultValue={activeCity ?? ""}
            placeholder="Mumbai, Delhi, Bengaluru…"
            className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-slate-100"
          />
        </FilterField>

        <FilterField
          icon={<Users className="h-4 w-4" />}
          label="Min capacity"
          className="md:col-span-2"
        >
          <input
            id="min_capacity"
            name="min_capacity"
            type="number"
            min={1}
            defaultValue={activeMinCapacity ?? ""}
            placeholder="200"
            className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-slate-100"
          />
        </FilterField>

        <FilterField
          icon={<Users className="h-4 w-4" />}
          label="Max capacity"
          className="md:col-span-2"
        >
          <input
            id="max_capacity"
            name="max_capacity"
            type="number"
            min={1}
            defaultValue={activeMaxCapacity ?? ""}
            placeholder="No limit"
            className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-slate-100"
          />
        </FilterField>

        <FilterField
          icon={<ArrowUpDown className="h-4 w-4" />}
          label="Sort by"
          className="md:col-span-2"
        >
          <select
            id="sort"
            name="sort"
            defaultValue={activeSort}
            className="w-full cursor-pointer bg-transparent text-sm text-slate-900 focus:outline-none dark:text-slate-100"
          >
            {SORT_OPTIONS.map((opt) => (
              <option
                key={opt.value}
                value={opt.value}
                className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100"
              >
                {opt.label}
              </option>
            ))}
          </select>
        </FilterField>

        <div className="flex items-stretch gap-2 md:col-span-2">
          <button
            type="submit"
            className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            <Search className="h-4 w-4" />
            Search
          </button>
          {hasFilter ? (
            <Link
              href="/venues"
              aria-label="Clear filters"
              className="flex items-center justify-center rounded-md border border-slate-300 px-3 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <X className="h-4 w-4" />
            </Link>
          ) : null}
        </div>
      </div>
    </form>
  );
}

function FilterField({
  icon,
  label,
  children,
  className = "",
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label
      className={`flex flex-col rounded-md border border-slate-200 bg-white px-3 py-2 transition focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 dark:border-slate-700 dark:bg-slate-950 dark:focus-within:ring-indigo-950 ${className}`}
    >
      <span className="flex items-center gap-1.5 text-[10px] font-semibold tracking-wide text-slate-500 uppercase">
        <span className="text-slate-400">{icon}</span>
        {label}
      </span>
      <div className="mt-0.5">{children}</div>
    </label>
  );
}
