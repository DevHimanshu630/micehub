import { db } from "@/db";
import { supportMessages, supportTickets, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { asc, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ReplyForm } from "../_components/reply-form";

export const dynamic = "force-dynamic";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function SupportTicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const { id } = await params;
  if (!UUID_REGEX.test(id)) notFound();

  const [ticket] = await db
    .select()
    .from(supportTickets)
    .where(eq(supportTickets.id, id))
    .limit(1);

  // Owner or admin only.
  if (!ticket || (user.role !== "admin" && ticket.openedBy !== user.id)) {
    notFound();
  }

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
          href="/support"
          className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
        >
          &larr; Back to tickets
        </Link>
      </div>

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-xl font-bold tracking-tight">{ticket.subject}</h1>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              ticket.status === "resolved"
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
            }`}
          >
            {ticket.status}
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Opened {ticket.createdAt.toLocaleString("en-IN")}
        </p>
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

      {ticket.status === "open" ? (
        <ReplyForm ticketId={ticket.id} />
      ) : (
        <div className="rounded-md bg-slate-100 px-4 py-3 text-sm text-slate-700 dark:bg-slate-900 dark:text-slate-300">
          This ticket is marked resolved. Open a new ticket if you need more
          help.
        </div>
      )}
    </div>
  );
}
