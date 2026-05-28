import {
  Badge,
  Card,
  EmptyState,
  PageHeader,
  StatCard,
} from "@/app/_components/ui";
import { db } from "@/db";
import { bookings, payouts, properties } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { formatINR } from "@/lib/format";
import { formatCommissionPct } from "@/lib/payouts";
import { desc, eq } from "drizzle-orm";
import { Clock, Wallet } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function VenuePayoutsPage() {
  const user = await requireRole("venue");

  const rows = await db
    .select({
      payout: payouts,
      booking: bookings,
      property: properties,
    })
    .from(payouts)
    .innerJoin(bookings, eq(bookings.id, payouts.bookingId))
    .innerJoin(properties, eq(properties.id, payouts.propertyId))
    .where(eq(payouts.venueOwnerId, user.id))
    .orderBy(desc(payouts.createdAt));

  const pending = rows.filter((r) => r.payout.status === "pending");
  const released = rows.filter((r) => r.payout.status === "released");
  const pendingTotal = pending.reduce((s, r) => s + r.payout.netRupees, 0);
  const releasedTotal = released.reduce((s, r) => s + r.payout.netRupees, 0);

  return (
    <div>
      <PageHeader
        title="Payouts"
        description="Money owed to you by the platform, net of the booking commission."
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard
          label="Pending release"
          value={formatINR(pendingTotal)}
          icon={Clock}
          tone="amber"
        />
        <StatCard
          label="Released so far"
          value={formatINR(releasedTotal)}
          icon={Wallet}
          tone="emerald"
        />
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No payouts yet"
          description="Once an event is complete, the platform admin will queue the payout here."
        />
      ) : (
        <ul className="space-y-3">
          {rows.map(({ payout, booking, property }) => (
            <li key={payout.id}>
              <Card>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">
                        {property.name}
                      </p>
                      <Badge
                        tone={
                          payout.status === "released" ? "emerald" : "amber"
                        }
                      >
                        {payout.status}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      Booked {booking.createdAt.toLocaleDateString("en-IN")} ·{" "}
                      <Link
                        href={`/venue/calendar`}
                        className="text-indigo-600 hover:underline dark:text-indigo-400"
                      >
                        View calendar
                      </Link>
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Gross {formatINR(payout.grossRupees)} − fee{" "}
                      {formatCommissionPct(payout.commissionBps)} (
                      {formatINR(payout.commissionRupees)})
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Net to you</p>
                    <p className="text-xl font-bold text-slate-900 tabular-nums dark:text-slate-100">
                      {formatINR(payout.netRupees)}
                    </p>
                  </div>
                </div>
                {payout.status === "released" ? (
                  <div className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-600 dark:border-slate-800 dark:text-slate-400">
                    Released {payout.releasedAt?.toLocaleString("en-IN")} · UTR{" "}
                    <span className="font-mono">{payout.utr ?? "—"}</span>
                  </div>
                ) : null}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
