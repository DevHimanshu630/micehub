import Link from "next/link";

export default function VenuesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-600 text-sm font-bold text-white">
              M
            </div>
            <span className="text-base font-semibold">MICEHub</span>
          </Link>
          <nav className="flex items-center gap-5 text-sm">
            <Link
              href="/venues"
              className="font-medium text-slate-900 dark:text-slate-100"
            >
              Browse venues
            </Link>
            <Link
              href="/admin/properties"
              className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            >
              Admin
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        {children}
      </main>
    </div>
  );
}
