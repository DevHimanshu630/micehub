import Link from "next/link";

export function CityFilter({ activeCity }: { activeCity?: string }) {
  return (
    <form
      action="/venues"
      method="get"
      className="flex flex-col gap-2 sm:flex-row sm:items-center"
    >
      <label htmlFor="city" className="sr-only">
        Filter by city
      </label>
      <div className="relative flex-1">
        <input
          id="city"
          name="city"
          type="search"
          defaultValue={activeCity ?? ""}
          placeholder="Search by city (e.g. Mumbai, Delhi)"
          className="w-full rounded-md border border-slate-300 bg-white px-4 py-2.5 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
      </div>
      <button
        type="submit"
        className="rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
      >
        Search
      </button>
      {activeCity ? (
        <Link
          href="/venues"
          className="rounded-md px-3 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
        >
          Clear
        </Link>
      ) : null}
    </form>
  );
}
