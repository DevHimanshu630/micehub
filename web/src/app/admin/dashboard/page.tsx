import { db } from "@/db";
import {
  bookings,
  payments,
  properties,
  supportTickets,
  users,
} from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { formatINR } from "@/lib/format";
import { count, eq, inArray, sql } from "drizzle-orm";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  await requireRole("admin");

  const [
    [propStats],
    [userStats],
    [bookingStats],
    [revenueRow],
    [openTickets],
  ] = await Promise.all([
    db.select({ total: count() }).from(properties),
    db.select({ total: count() }).from(users),
    db
      .select({ total: count() })
      .from(bookings)
      .where(inArray(bookings.status, ["pending_payment", "confirmed"])),
    db
      .select({
        sumPaise: sql<string>`COALESCE(SUM(${payments.amountPaise}), 0)`,
      })
      .from(payments)
      .where(eq(payments.status, "success")),
    db
      .select({ total: count() })
      .from(supportTickets)
      .where(eq(supportTickets.status, "open")),
  ]);

  const revenueRupees = Math.floor(Number(revenueRow?.sumPaise ?? 0) / 100);
  const openTicketsCount = openTickets?.total ?? 0;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Admin dashboard</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Marketplace overview.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Properties"
          value={propStats?.total ?? 0}
          href="/admin/properties"
        />
        <Stat label="Users" value={userStats?.total ?? 0} href="/admin/users" />
        <Stat
          label="Active bookings"
          value={bookingStats?.total ?? 0}
          href="/admin/bookings"
          hint="Pending payment + confirmed"
        />
        <Stat
          label="Revenue collected"
          value={formatINR(revenueRupees)}
          hint="Successful payments only"
        />
      </div>

      {openTicketsCount > 0 ? (
        <Link
          href="/admin/support"
          className="mb-6 block rounded-xl border border-amber-200 bg-amber-50 p-4 transition hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950/30"
        >
          <p className="text-sm font-medium text-amber-900 dark:text-amber-300">
            {openTicketsCount} open support{" "}
            {openTicketsCount === 1 ? "ticket" : "tickets"} need attention
            &rarr;
          </p>
        </Link>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          href="/admin/properties?status=pending_approval"
          className="rounded-xl border border-slate-200 bg-white p-5 transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
        >
          <p className="text-sm font-semibold">Review pending properties</p>
          <p className="mt-1 text-xs text-slate-500">
            Approve or reject new venue listings.
          </p>
        </Link>
        <Link
          href="/admin/bookings"
          className="rounded-xl border border-slate-200 bg-white p-5 transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
        >
          <p className="text-sm font-semibold">All bookings</p>
          <p className="mt-1 text-xs text-slate-500">
            See every booking on the platform, jump to a specific one.
          </p>
        </Link>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  href,
}: {
  label: string;
  value: string | number;
  hint?: string;
  href?: string;
}) {
  const content = (
    <div className="rounded-xl border border-slate-200 bg-white p-5 transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}
