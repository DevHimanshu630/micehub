import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-gradient-to-b from-slate-50 to-white text-slate-900 dark:from-slate-950 dark:to-black dark:text-slate-100">
      <header className="flex items-center justify-between px-6 py-6 sm:px-12">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 font-bold text-white">
            M
          </div>
          <span className="text-lg font-semibold tracking-tight">MICEHub</span>
        </div>
        <nav className="flex items-center gap-4 text-sm">
          <Link
            href="/venues"
            className="font-medium text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
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
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center sm:px-12">
        <div className="max-w-3xl">
          <span className="mb-6 inline-block rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
            India&apos;s MICE booking platform
          </span>
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Book the perfect venue for your{" "}
            <span className="text-indigo-600 dark:text-indigo-400">
              conferences, meetings, and events
            </span>
            .
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 sm:text-xl dark:text-slate-400">
            Send one RFP to multiple venues. Compare quotes side-by-side.
            Confirm bookings instantly with secure payments and automatic GST
            invoices.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/venues"
              className="rounded-md bg-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-indigo-500"
            >
              Browse venues
            </Link>
            <a
              href="#features"
              className="rounded-md border border-slate-300 px-6 py-3 text-base font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
            >
              Learn more
            </a>
          </div>

          <div
            id="features"
            className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-3"
          >
            <Feature
              title="One RFP, many quotes"
              body="Reach 100+ verified venues across India in a single click."
            />
            <Feature
              title="Real-time availability"
              body="No double-bookings. Hold a slot for 15 minutes while you decide."
            />
            <Feature
              title="GST invoices built-in"
              body="Automatic invoices, payments via UPI / card / netbanking."
            />
          </div>
        </div>
      </main>

      <footer className="px-6 py-8 text-center text-sm text-slate-500 sm:px-12">
        &copy; {new Date().getFullYear()} MICEHub. Building the future of MICE
        booking in India.
      </footer>
    </div>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 text-left dark:border-slate-800 dark:bg-slate-900">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
        {title}
      </h3>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{body}</p>
    </div>
  );
}
