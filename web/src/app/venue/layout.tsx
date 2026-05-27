import { requireRole } from "@/lib/auth";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

export default async function VenueLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("venue");

  return (
    <div className="flex flex-1 flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-600 text-sm font-bold text-white">
                M
              </div>
              <span className="text-base font-semibold">MICEHub</span>
            </Link>
            <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              Venue
            </span>
          </div>
          <div className="flex items-center gap-5 text-sm">
            <nav className="flex items-center gap-4">
              <Link
                href="/venue/dashboard"
                className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              >
                My properties
              </Link>
              <Link
                href="/venue/rfps"
                className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              >
                RFP inbox
              </Link>
              <Link
                href="/venue/calendar"
                className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              >
                Calendar
              </Link>
              <Link
                href="/venue/payouts"
                className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              >
                Payouts
              </Link>
              <Link
                href="/support"
                className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              >
                Help
              </Link>
            </nav>
            <UserButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        {children}
      </main>
    </div>
  );
}
