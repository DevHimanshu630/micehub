import Link from "next/link";

export function SearchFilters({
  activeCity,
  activeMinCapacity,
}: {
  activeCity?: string;
  activeMinCapacity?: number;
}) {
  const hasFilter = Boolean(activeCity || activeMinCapacity);

  return (
    <form
      action="/venues"
      method="get"
      className="flex flex-col gap-3 sm:flex-row sm:items-end"
    >
      <div className="flex-1">
        <label
          htmlFor="city"
          className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400"
        >
          City
        </label>
        <input
          id="city"
          name="city"
          type="search"
          defaultValue={activeCity ?? ""}
          placeholder="Mumbai, Delhi, Bengaluru..."
          className="w-full rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
      </div>
      <div className="sm:w-48">
        <label
          htmlFor="min_capacity"
          className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400"
        >
          Min capacity
        </label>
        <input
          id="min_capacity"
          name="min_capacity"
          type="number"
          min={1}
          defaultValue={activeMinCapacity ?? ""}
          placeholder="e.g. 200"
          className="w-full rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
        >
          Search
        </button>
        {hasFilter ? (
          <Link
            href="/venues"
            className="rounded-md border border-slate-300 px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            Clear
          </Link>
        ) : null}
      </div>
    </form>
  );
}
