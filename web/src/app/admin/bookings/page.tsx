import {
  Badge,
  type BadgeTone,
  EmptyState,
  PageHeader,
  TableShell,
  Td,
  Th,
} from "@/app/_components/ui";
import { db } from "@/db";
import { bookings, properties, quotes, users } from "@/db/schema";
import { formatINR } from "@/lib/format";
import { desc, eq } from "drizzle-orm";
import { CalendarX } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  pending_payment: "Pending payment",
  confirmed: "Confirmed",
  expired: "Expired",
  cancelled: "Cancelled",
};

const STATUS_TONES: Record<string, BadgeTone> = {
  pending_payment: "amber",
  confirmed: "emerald",
  expired: "slate",
  cancelled: "rose",
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
      <PageHeader
        title="All bookings"
        description={
          rows.length === 0
            ? "No bookings on the platform yet."
            : `${rows.length} ${rows.length === 1 ? "booking" : "bookings"} across all venues.`
        }
      />

      {rows.length === 0 ? (
        <EmptyState
          icon={CalendarX}
          title="No bookings yet"
          description="Bookings made across all venues will appear here."
        />
      ) : (
        <TableShell>
          <thead>
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
                  <Badge tone={STATUS_TONES[booking.status] ?? "slate"}>
                    {STATUS_LABELS[booking.status] ?? booking.status}
                  </Badge>
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
        </TableShell>
      )}
    </div>
  );
}
