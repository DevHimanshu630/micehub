import { db } from "@/db";
import { supportTickets } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const STATUS_CLASSES: Record<string, string> = {
  open: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  resolved:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
};

export default async function SupportInboxPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const tickets = await db
    .select()
    .from(supportTickets)
    .where(eq(supportTickets.openedBy, user.id))
    .orderBy(desc(supportTickets.updatedAt));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            My support tickets
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {tickets.length === 0
              ? "You haven't opened any tickets."
              : `${tickets.length} ${tickets.length === 1 ? "ticket" : "tickets"}.`}
          </p>
        </div>
        <Link
          href="/support/new"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
        >
          + New ticket
        </Link>
      </div>

      {tickets.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            No tickets yet. Need help with a booking, payment, or anything else?
          </p>
          <Link
            href="/support/new"
            className="mt-4 inline-block rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            Open a ticket
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
          {tickets.map((t) => (
            <li key={t.id}>
              <Link
                href={`/support/${t.id}`}
                className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-950"
              >
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-100">
                    {t.subject}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Last update {t.updatedAt.toLocaleString("en-IN")}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASSES[t.status]}`}
                >
                  {t.status}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
