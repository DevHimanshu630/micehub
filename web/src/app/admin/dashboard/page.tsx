import { db } from "@/db";
import {
  bookings,
  payments,
  payouts,
  properties,
  supportTickets,
  users,
} from "@/db/schema";
import { PageHeader, StatCard } from "@/app/_components/ui";
import { requireRole } from "@/lib/auth";
import { formatINR } from "@/lib/format";
import { count, eq, inArray, sql } from "drizzle-orm";
import {
  Building2,
  CalendarCheck,
  IndianRupee,
  LifeBuoy,
  Users,
  Wallet,
} from "lucide-react";
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
    [pendingPayouts],
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
    db
      .select({
        total: count(),
        sumNet: sql<string>`COALESCE(SUM(${payouts.netRupees}), 0)`,
      })
      .from(payouts)
      .where(eq(payouts.status, "pending")),
  ]);

  const revenueRupees = Math.floor(Number(revenueRow?.sumPaise ?? 0) / 100);
  const openTicketsCount = openTickets?.total ?? 0;
  const pendingPayoutsCount = pendingPayouts?.total ?? 0;
  const pendingPayoutsTotal = Number(pendingPayouts?.sumNet ?? 0);

  return (
    <div>
      <PageHeader title="Admin dashboard" description="Marketplace overview." />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Properties"
          value={propStats?.total ?? 0}
          href="/admin/properties"
          icon={Building2}
          tone="indigo"
        />
        <StatCard
          label="Users"
          value={userStats?.total ?? 0}
          href="/admin/users"
          icon={Users}
          tone="slate"
        />
        <StatCard
          label="Active bookings"
          value={bookingStats?.total ?? 0}
          href="/admin/bookings"
          hint="Pending payment + confirmed"
          icon={CalendarCheck}
          tone="amber"
        />
        <StatCard
          label="Revenue collected"
          value={formatINR(revenueRupees)}
          hint="Successful payments only"
          icon={IndianRupee}
          tone="emerald"
        />
      </div>

      {pendingPayoutsCount > 0 ? (
        <Link
          href="/admin/payouts?status=pending"
          className="mb-6 flex items-center gap-3 rounded-xl border border-indigo-200 bg-indigo-50 p-4 transition hover:bg-indigo-100 dark:border-indigo-900 dark:bg-indigo-950/30"
        >
          <Wallet className="h-5 w-5 shrink-0 text-indigo-600 dark:text-indigo-400" />
          <p className="text-sm font-medium text-indigo-900 dark:text-indigo-300">
            {pendingPayoutsCount} pending{" "}
            {pendingPayoutsCount === 1 ? "payout" : "payouts"} totalling{" "}
            {formatINR(pendingPayoutsTotal)} to release &rarr;
          </p>
        </Link>
      ) : null}

      {openTicketsCount > 0 ? (
        <Link
          href="/admin/support"
          className="mb-6 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 transition hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950/30"
        >
          <LifeBuoy className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
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
