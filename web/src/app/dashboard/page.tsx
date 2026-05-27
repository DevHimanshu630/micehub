import { requireRole } from "@/lib/auth";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PlannerDashboardPage() {
  const user = await requireRole("planner");

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-600 text-sm font-bold text-white">
              M
            </div>
            <span className="text-base font-semibold">MICEHub</span>
            <span className="ml-2 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              Planner
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/venues"
              className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            >
              Browse venues
            </Link>
            <UserButton />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Welcome, {user.email}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Your RFPs and bookings will appear here.
          </p>
        </div>

        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            You haven&apos;t sent any RFPs yet.
          </p>
          <p className="mt-2 text-xs text-slate-500">
            RFP sending arrives in Step 6 of the build plan.
          </p>
          <Link
            href="/venues"
            className="mt-6 inline-block rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            Browse venues
          </Link>
        </div>
      </main>
    </div>
  );
}
