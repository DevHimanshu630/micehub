import { db } from "@/db";
import { properties, rfpRecipients, rfps, users } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { EVENT_TYPE_LABELS } from "@/lib/schemas";
import { desc, eq } from "drizzle-orm";
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">RFP inbox</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Incoming requests for proposals from planners.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            No incoming RFPs yet.
          </p>
          <p className="mt-2 text-xs text-slate-500">
            When a planner picks your property and sends an RFP, it will appear
            here.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-950">
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
                      {formatDate(rfp.startDate)} &rarr;{" "}
                      {formatDate(rfp.endDate)}
                    </span>
                  </Td>
                  <Td align="right">
                    {rfp.guestCount.toLocaleString("en-IN")}
                  </Td>
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
          </table>
        </div>
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
