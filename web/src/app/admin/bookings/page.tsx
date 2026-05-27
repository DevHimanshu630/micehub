import { db } from "@/db";
import { bookings, properties, quotes, users } from "@/db/schema";
import { formatINR } from "@/lib/format";
import { desc, eq } from "drizzle-orm";
import Link from "next/link";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  pending_payment: "Pending payment",
  confirmed: "Confirmed",
  expired: "Expired",
  cancelled: "Cancelled",
};

const STATUS_CLASSES: Record<string, string> = {
  pending_payment:
    "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  confirmed:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  expired: "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  cancelled: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
};

export default async function AdminBookingsPage() {
  const rows = await db
    .select({
      booking: bookings,
      quote: quotes,
      property: properties,
      plannerEmail: users.email,
    })
    .from(bookings)
    .innerJoin(quotes, eq(quotes.id, bookings.quoteId))
    .innerJoin(properties, eq(properties.id, bookings.propertyId))
    .innerJoin(users, eq(users.id, bookings.plannerId))
    .orderBy(desc(bookings.createdAt));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">All bookings</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          {rows.length === 0
            ? "No bookings on the platform yet."
            : `${rows.length} ${rows.length === 1 ? "booking" : "bookings"} across all venues.`}
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            No bookings yet.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-950">
              <tr>
                <Th>Booking</Th>
                <Th>Venue</Th>
                <Th>Planner</Th>
                <Th align="right">Total</Th>
                <Th>Status</Th>
                <Th>Created</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {rows.map(({ booking, quote, property, plannerEmail }) => (
                <tr
                  key={booking.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-950"
                >
                  <Td>
                    <Link
                      href={`/admin/bookings/${booking.id}`}
                      className="font-mono text-xs text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                    >
                      {booking.id.slice(0, 8)}
                    </Link>
                  </Td>
                  <Td>
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {property.name}
                    </span>
                    <p className="text-xs text-slate-500">{property.city}</p>
                  </Td>
                  <Td>
                    <span className="text-xs text-slate-600 dark:text-slate-400">
                      {plannerEmail}
                    </span>
                  </Td>
                  <Td align="right">{formatINR(quote.totalAmount)}</Td>
                  <Td>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASSES[booking.status]}`}
                    >
                      {STATUS_LABELS[booking.status]}
                    </span>
                  </Td>
                  <Td>
                    <span className="text-xs text-slate-500">
                      {booking.createdAt.toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Th({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      className={`px-4 py-2.5 text-xs font-semibold tracking-wide text-slate-600 uppercase dark:text-slate-400 ${align === "right" ? "text-right" : "text-left"}`}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <td
      className={`px-4 py-3 text-sm text-slate-700 dark:text-slate-300 ${align === "right" ? "text-right" : "text-left"}`}
    >
      {children}
    </td>
  );
}
