import { db } from "@/db";
import { properties, users } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { count } from "drizzle-orm";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  await requireRole("admin");

  const [[propertyStats], [userStats]] = await Promise.all([
    db.select({ total: count() }).from(properties),
    db.select({ total: count() }).from(users),
  ]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Admin dashboard</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Marketplace overview. All bookings will appear here.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Properties" value={propertyStats?.total ?? 0} />
        <Stat label="Users" value={userStats?.total ?? 0} />
        <Stat label="Bookings" value={0} hint="Arrives in Step 8" />
        <Stat label="Revenue" value="₹0" hint="Arrives in Step 9" />
      </div>

      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Booking list, support tickets, and payout queue will appear here as we
          build them.
        </p>
        <Link
          href="/admin/properties"
          className="mt-6 inline-block rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
        >
          Manage properties
        </Link>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}
