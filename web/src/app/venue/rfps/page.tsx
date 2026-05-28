import {
  EmptyState,
  PageHeader,
  TableShell,
  Td,
  Th,
} from "@/app/_components/ui";
import { db } from "@/db";
import { properties, rfpRecipients, rfps, users } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { EVENT_TYPE_LABELS } from "@/lib/schemas";
import { desc, eq } from "drizzle-orm";
import { Inbox } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function VenueRfpsInboxPage() {
  const user = await requireRole("venue");

  // All RFPs sent to any property owned by this user.
  const rows = await db
    .select({
      recipient: rfpRecipients,
      rfp: rfps,
      plannerEmail: users.email,
      propertyName: properties.name,
    })
    .from(rfpRecipients)
    .innerJoin(properties, eq(properties.id, rfpRecipients.propertyId))
    .innerJoin(rfps, eq(rfps.id, rfpRecipients.rfpId))
    .innerJoin(users, eq(users.id, rfps.plannerId))
    .where(eq(properties.ownerId, user.id))
    .orderBy(desc(rfpRecipients.createdAt));

  return (
    <div>
      <PageHeader
        title="RFP inbox"
        description="Incoming requests for proposals from planners."
      />

      {rows.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No incoming RFPs yet"
          description="When a planner picks your property and sends an RFP, it will appear here."
        />
      ) : (
        <TableShell>
          <thead>
            <tr>
              <Th>Event</Th>
              <Th>Property</Th>
              <Th>Planner</Th>
              <Th>Dates</Th>
              <Th align="right">Guests</Th>
              <Th>Received</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {rows.map(({ recipient, rfp, plannerEmail, propertyName }) => (
              <tr
                key={recipient.id}
                className="hover:bg-slate-50 dark:hover:bg-slate-950"
              >
                <Td>
                  <Link
                    href={`/venue/rfps/${recipient.id}`}
                    className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                  >
                    {EVENT_TYPE_LABELS[rfp.eventType]}
                  </Link>
                </Td>
                <Td>{propertyName}</Td>
                <Td>
                  <span className="text-xs text-slate-600 dark:text-slate-400">
                    {plannerEmail}
                  </span>
                </Td>
                <Td>
                  <span className="text-xs">
                    {formatDate(rfp.startDate)} &rarr; {formatDate(rfp.endDate)}
                  </span>
                </Td>
                <Td align="right">{rfp.guestCount.toLocaleString("en-IN")}</Td>
                <Td>
                  <span className="text-xs text-slate-500">
                    {recipient.createdAt.toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
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

function formatDate(d: Date) {
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
