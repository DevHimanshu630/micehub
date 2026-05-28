import {
  Badge,
  EmptyState,
  PageHeader,
  TableShell,
  Td,
  Th,
} from "@/app/_components/ui";
import { db } from "@/db";
import { properties } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { desc, eq } from "drizzle-orm";
import { Building2 } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const STATUS_LABELS = {
  pending_approval: "Pending approval",
  approved: "Approved",
  rejected: "Rejected",
} as const;

const STATUS_TONES = {
  pending_approval: "amber",
  approved: "emerald",
  rejected: "rose",
} as const;

export default async function VenueDashboardPage() {
  const user = await requireRole("venue");

  const myProperties = await db
    .select()
    .from(properties)
    .where(eq(properties.ownerId, user.id))
    .orderBy(desc(properties.createdAt));

  return (
    <div>
      <PageHeader
        title="My properties"
        description={`Welcome back, ${user.email}. Manage your venues below.`}
        action={
          <Link
            href="/venue/properties/new"
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            + Add property
          </Link>
        }
      />

      {myProperties.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="You haven't added any properties yet"
          description="New properties go through admin approval before appearing on the public listing."
          action={
            <Link
              href="/venue/properties/new"
              className="inline-block rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              Add your first property
            </Link>
          }
        />
      ) : (
        <TableShell>
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>City</Th>
              <Th align="right">Capacity</Th>
              <Th>Status</Th>
              <Th>Added</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {myProperties.map((p) => (
              <tr
                key={p.id}
                className="hover:bg-slate-50 dark:hover:bg-slate-950"
              >
                <Td>
                  <Link
                    href={`/venue/properties/${p.id}`}
                    className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                  >
                    {p.name}
                  </Link>
                </Td>
                <Td>{p.city}</Td>
                <Td align="right">{p.capacity.toLocaleString("en-IN")}</Td>
                <Td>
                  <Badge tone={STATUS_TONES[p.status]}>
                    {STATUS_LABELS[p.status]}
                  </Badge>
                </Td>
                <Td>
                  <span className="text-xs text-slate-500">
                    {p.createdAt.toLocaleDateString("en-IN", {
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
