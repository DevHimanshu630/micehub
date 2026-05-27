import { db } from "@/db";
import { supportTickets, users } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import Link from "next/link";

export const dynamic = "force-dynamic";

const STATUS_CLASSES: Record<string, string> = {
  open: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  resolved:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
};

export default async function AdminSupportInboxPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const filter =
    status === "resolved" ? "resolved" : status === "all" ? "all" : "open";

  const base = db
    .select({
      ticket: supportTickets,
      openerEmail: users.email,
      openerRole: users.role,
    })
    .from(supportTickets)
    .innerJoin(users, eq(users.id, supportTickets.openedBy))
    .orderBy(desc(supportTickets.updatedAt));

  const rows =
    filter === "all"
      ? await base
      : await base.where(eq(supportTickets.status, filter));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Support inbox</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          {rows.length} {rows.length === 1 ? "ticket" : "tickets"} ({filter}).
        </p>
      </div>

      <div className="mb-4 flex gap-2">
        {(["open", "resolved", "all"] as const).map((f) => {
          const isActive = f === filter;
          const href = `/admin/support?status=${f}`;
          return (
            <Link
              key={f}
              href={href}
              className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
                isActive
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              }`}
            >
              {f}
            </Link>
          );
        })}
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Nothing here. Open tickets will appear with the most recently
            updated first.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
          {rows.map(({ ticket, openerEmail, openerRole }) => (
            <li key={ticket.id}>
              <Link
                href={`/admin/support/${ticket.id}`}
                className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-950"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900 dark:text-slate-100">
                    {ticket.subject}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    From {openerEmail}{" "}
                    <span className="capitalize">({openerRole})</span> · Updated{" "}
                    {ticket.updatedAt.toLocaleString("en-IN")}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASSES[ticket.status]}`}
                >
                  {ticket.status}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
