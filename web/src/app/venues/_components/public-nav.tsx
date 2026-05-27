import { UserButton } from "@clerk/nextjs";
import { LayoutDashboard, LifeBuoy, Search } from "lucide-react";
import Link from "next/link";

/**
 * Top navigation for the public-facing /venues area. Used when the visitor is
 * either signed-out or signed in as a non-planner role. Planners get the full
 * AppShell sidebar instead — see venues/layout.tsx.
 */
export function VenuesPublicNav({ signedIn }: { signedIn: boolean }) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-600 text-sm font-bold text-white">
            M
          </div>
          <span className="text-base font-semibold tracking-tight">
            MICEHub
          </span>
        </Link>

        <nav className="flex items-center gap-1 text-sm md:gap-2">
          <Link
            href="/venues"
            className="flex items-center gap-1.5 rounded-md bg-indigo-50 px-3 py-1.5 font-medium text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300"
          >
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Browse venues</span>
          </Link>
          {signedIn ? (
            <>
              <Link
                href="/post-auth"
                className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
              <Link
                href="/support"
                className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <LifeBuoy className="h-4 w-4" />
                <span className="hidden sm:inline">Help</span>
              </Link>
              <div className="ml-2">
                <UserButton />
              </div>
            </>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="hidden rounded-md px-3 py-1.5 text-slate-600 hover:bg-slate-100 sm:inline dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="rounded-md bg-indigo-600 px-3 py-1.5 font-semibold text-white shadow-sm hover:bg-indigo-500"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
