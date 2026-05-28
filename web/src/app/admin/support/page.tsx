import { Badge, EmptyState, PageHeader } from "@/app/_components/ui";
import { db } from "@/db";
import { supportTickets, users } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { Inbox } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

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
      <PageHeader
        title="Support inbox"
        description={`${rows.length} ${rows.length === 1 ? "ticket" : "tickets"} (${filter}).`}
      />

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
        <EmptyState
          icon={Inbox}
          title="Nothing here"
          description="Open tickets will appear with the most recently updated first."
        />
      ) : (
        <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
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
                <span className="shrink-0">
                  <Badge
                    tone={ticket.status === "resolved" ? "emerald" : "amber"}
                  >
                    {ticket.status}
                  </Badge>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
