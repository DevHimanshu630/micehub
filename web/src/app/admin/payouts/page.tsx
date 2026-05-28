import { Badge, Card, PageHeader } from "@/app/_components/ui";
import { db } from "@/db";
import { bookings, payouts, properties, users } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { formatINR } from "@/lib/format";
import { formatCommissionPct } from "@/lib/payouts";
import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { ReleasePayoutForm } from "./_components/release-form";

export const dynamic = "force-dynamic";

const TABS = ["pending", "released"] as const;
type Tab = (typeof TABS)[number];

export default async function AdminPayoutsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireRole("admin");
  const { status } = await searchParams;
  const activeTab: Tab = TABS.includes(status as Tab)
    ? (status as Tab)
    : "pending";

  const rows = await db
    .select({
      payout: payouts,
      booking: bookings,
      property: properties,
      ownerEmail: users.email,
    })
    .from(payouts)
    .innerJoin(bookings, eq(bookings.id, payouts.bookingId))
    .innerJoin(properties, eq(properties.id, payouts.propertyId))
    .leftJoin(users, eq(users.id, payouts.venueOwnerId))
    .where(eq(payouts.status, activeTab))
    .orderBy(
      activeTab === "pending"
        ? desc(payouts.createdAt)
        : desc(payouts.releasedAt),
    );

  const totalNet = rows.reduce((sum, r) => sum + r.payout.netRupees, 0);

  return (
    <div>
      <PageHeader
        title="Venue payouts"
        description="Release money to venues after their event is complete. Manual bank transfer for now — Razorpay Route integration is planned."
      />

      <div className="mb-4 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        {TABS.map((t) => {
          const isActive = t === activeTab;
          return (
            <Link
              key={t}
              href={`/admin/payouts?status=${t}`}
              className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${
                isActive
                  ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                  : "border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              }`}
            >
              {t === "pending" ? "Pending" : "Released"}
            </Link>
          );
        })}
      </div>

      <div className="mb-4 flex items-baseline justify-between text-sm">
        <p className="text-slate-600 dark:text-slate-400">
          {rows.length === 0
            ? activeTab === "pending"
              ? "No payouts pending. Mark a confirmed booking complete to create one."
              : "No payouts released yet."
            : `${rows.length} ${rows.length === 1 ? "payout" : "payouts"}`}
        </p>
        {rows.length > 0 ? (
          <p className="text-slate-600 dark:text-slate-400">
            {activeTab === "pending" ? "To release" : "Released total"}:{" "}
            <span className="font-semibold text-slate-900 tabular-nums dark:text-slate-100">
              {formatINR(totalNet)}
            </span>
          </p>
        ) : null}
      </div>

      {rows.length === 0 ? null : (
        <ul className="space-y-3">
          {rows.map(({ payout, booking, property, ownerEmail }) => (
            <li key={payout.id}>
              <Card>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/bookings/${booking.id}`}
                        className="font-semibold text-slate-900 hover:text-indigo-600 dark:text-slate-100"
                      >
                        {property.name}
                      </Link>
                      <span className="text-xs text-slate-500">
                        · {property.city}
                      </span>
                      <Badge
                        tone={
                          payout.status === "released" ? "emerald" : "amber"
                        }
                      >
                        {payout.status}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      Owner: {ownerEmail ?? "— (admin-seeded)"}
                    </p>
                    <p className="mt-1 font-mono text-[11px] text-slate-500">
                      booking {booking.id}
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-3 sm:w-80 sm:flex-shrink-0">
                    <Money label="Gross" value={payout.grossRupees} />
                    <Money
                      label={`Fee (${formatCommissionPct(payout.commissionBps)})`}
                      value={-payout.commissionRupees}
                    />
                    <Money label="Net" value={payout.netRupees} emphasize />
                  </div>
                </div>

                {payout.status === "pending" ? (
                  <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-800">
                    <ReleasePayoutForm
                      payoutId={payout.id}
                      netRupees={payout.netRupees}
                    />
                  </div>
                ) : (
                  <div className="mt-4 grid grid-cols-1 gap-2 border-t border-slate-200 pt-4 text-xs text-slate-600 sm:grid-cols-2 dark:border-slate-800 dark:text-slate-400">
                    <p>
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        UTR:
                      </span>{" "}
                      <span className="font-mono">{payout.utr ?? "—"}</span>
                    </p>
                    <p>
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        Released:
                      </span>{" "}
                      {payout.releasedAt
                        ? payout.releasedAt.toLocaleString("en-IN")
                        : "—"}
                    </p>
                    {payout.note ? (
                      <p className="sm:col-span-2">
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          Note:
                        </span>{" "}
                        {payout.note}
                      </p>
                    ) : null}
                  </div>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Money({
  label,
  value,
  emphasize = false,
}: {
  label: string;
  value: number;
  emphasize?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] font-medium tracking-wide text-slate-500 uppercase">
        {label}
      </p>
      <p
        className={`mt-0.5 text-sm tabular-nums ${
          emphasize
            ? "font-bold text-slate-900 dark:text-slate-100"
            : "font-medium text-slate-700 dark:text-slate-300"
        }`}
      >
        {value < 0 ? `−${formatINR(Math.abs(value))}` : formatINR(value)}
      </p>
    </div>
  );
}
