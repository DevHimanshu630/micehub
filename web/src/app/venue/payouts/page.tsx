import { db } from "@/db";
import { bookings, payouts, properties } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { formatINR } from "@/lib/format";
import { formatCommissionPct } from "@/lib/payouts";
import { desc, eq } from "drizzle-orm";
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Payouts</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Money owed to you by the platform, net of the booking commission.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SummaryCard
          label="Pending release"
          amount={pendingTotal}
          accent="amber"
        />
        <SummaryCard
          label="Released so far"
          amount={releasedTotal}
          accent="emerald"
        />
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            No payouts yet. Once an event is complete, the platform admin will
            queue the payout here.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map(({ payout, booking, property }) => (
            <li
              key={payout.id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      {property.name}
                    </p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        payout.status === "released"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                      }`}
                    >
                      {payout.status}
                    </span>
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
                <div className="mt-3 border-t border-slate-200 pt-3 text-xs text-slate-600 dark:border-slate-800 dark:text-slate-400">
                  Released {payout.releasedAt?.toLocaleString("en-IN")} · UTR{" "}
                  <span className="font-mono">{payout.utr ?? "—"}</span>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  amount,
  accent,
}: {
  label: string;
  amount: number;
  accent: "amber" | "emerald";
}) {
  const accentCls =
    accent === "amber"
      ? "text-amber-700 dark:text-amber-300"
      : "text-emerald-700 dark:text-emerald-300";
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-bold tabular-nums ${accentCls}`}>
        {formatINR(amount)}
      </p>
    </div>
  );
}
