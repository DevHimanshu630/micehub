import { setTicketStatus } from "@/app/support/actions";
import { ReplyForm } from "@/app/support/_components/reply-form";
import { db } from "@/db";
import { supportMessages, supportTickets, users } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function AdminSupportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!UUID_REGEX.test(id)) notFound();

  const [row] = await db
    .select({ ticket: supportTickets, openerEmail: users.email })
    .from(supportTickets)
    .innerJoin(users, eq(users.id, supportTickets.openedBy))
    .where(eq(supportTickets.id, id))
    .limit(1);

  if (!row) notFound();
  const { ticket, openerEmail } = row;

  const messages = await db
    .select({
      message: supportMessages,
      authorEmail: users.email,
      authorRole: users.role,
    })
    .from(supportMessages)
    .innerJoin(users, eq(users.id, supportMessages.fromUserId))
    .where(eq(supportMessages.ticketId, ticket.id))
    .orderBy(asc(supportMessages.createdAt));

  return (
    <div>
      <div className="mb-4">
        <Link
          href="/admin/support"
          className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
        >
          &larr; Back to inbox
        </Link>
      </div>

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              {ticket.subject}
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              From <span className="font-medium">{openerEmail}</span> · Opened{" "}
              {ticket.createdAt.toLocaleString("en-IN")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                ticket.status === "resolved"
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
              }`}
            >
              {ticket.status}
            </span>
            <form action={setTicketStatus}>
              <input type="hidden" name="id" value={ticket.id} />
              <input
                type="hidden"
                name="status"
                value={ticket.status === "open" ? "resolved" : "open"}
              />
              <button
                type="submit"
                className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                {ticket.status === "open" ? "Mark resolved" : "Reopen"}
              </button>
            </form>
          </div>
        </div>
      </div>

      <ul className="mb-6 space-y-3">
        {messages.map(({ message, authorEmail, authorRole }) => (
          <li
            key={message.id}
            className={`rounded-lg border p-4 ${
              authorRole === "admin"
                ? "border-indigo-200 bg-indigo-50 dark:border-indigo-900 dark:bg-indigo-950/30"
                : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
            }`}
          >
            <div className="mb-1 flex items-center justify-between gap-2 text-xs">
              <span className="font-medium text-slate-900 dark:text-slate-100">
                {authorEmail}
                {authorRole === "admin" ? (
                  <span className="ml-1 rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-medium text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                    MICEHub
                  </span>
                ) : null}
              </span>
              <span className="text-slate-500">
                {message.createdAt.toLocaleString("en-IN")}
              </span>
            </div>
            <p className="text-sm whitespace-pre-line text-slate-700 dark:text-slate-300">
              {message.body}
            </p>
          </li>
        ))}
      </ul>

      {ticket.status === "open" ? <ReplyForm ticketId={ticket.id} /> : null}
    </div>
  );
}
