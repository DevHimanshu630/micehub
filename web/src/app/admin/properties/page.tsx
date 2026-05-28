import { StatusBadge } from "@/app/_components/status-badge";
import {
  EmptyState,
  PageHeader,
  TableShell,
  Td,
  Th,
} from "@/app/_components/ui";
import { db } from "@/db";
import { properties, users } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { Building2 } from "lucide-react";
import Link from "next/link";
import { approveProperty, rejectProperty } from "./actions";

export const dynamic = "force-dynamic";

type StatusFilter = "all" | "pending_approval" | "approved" | "rejected";

const FILTER_LABELS: Record<StatusFilter, string> = {
  all: "All",
  pending_approval: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

function parseStatusFilter(raw: string | undefined): StatusFilter {
  if (raw === "pending_approval" || raw === "approved" || raw === "rejected") {
    return raw;
  }
  return "all";
}

export default async function PropertiesListPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const filter = parseStatusFilter(status);

  const baseQuery = db
    .select({
      property: properties,
      ownerEmail: users.email,
    })
    .from(properties)
    .leftJoin(users, eq(users.id, properties.ownerId))
    .orderBy(desc(properties.createdAt));

  const rows =
    filter === "all"
      ? await baseQuery
      : await baseQuery.where(eq(properties.status, filter));

  return (
    <div>
      <PageHeader
        title="Properties"
        description={`${
          rows.length === 0
            ? "No properties match this filter."
            : `${rows.length} ${rows.length === 1 ? "property" : "properties"}`
        }${
          filter !== "all" ? ` (${FILTER_LABELS[filter].toLowerCase()})` : ""
        }`}
        action={
          <Link
            href="/admin/properties/new"
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            + Add property
          </Link>
        }
      />

      <FilterTabs active={filter} />

      {rows.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No properties to show"
          description="No properties match this filter. Try a different status or add a new property."
        />
      ) : (
        <TableShell>
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>City</Th>
              <Th align="right">Capacity</Th>
              <Th>Owner</Th>
              <Th>Status</Th>
              <Th align="right">Actions</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {rows.map(({ property: p, ownerEmail }) => (
              <tr
                key={p.id}
                className="hover:bg-slate-50 dark:hover:bg-slate-950"
              >
                <Td>
                  <div className="font-medium text-slate-900 dark:text-slate-100">
                    {p.name}
                  </div>
                  {p.description ? (
                    <div className="mt-0.5 line-clamp-1 text-xs text-slate-500">
                      {p.description}
                    </div>
                  ) : null}
                </Td>
                <Td>{p.city}</Td>
                <Td align="right">{p.capacity.toLocaleString("en-IN")}</Td>
                <Td>
                  {ownerEmail ? (
                    <span className="text-xs text-slate-600 dark:text-slate-400">
                      {ownerEmail}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </Td>
                <Td>
                  <StatusBadge status={p.status} />
                </Td>
                <Td align="right">
                  {p.status === "pending_approval" ? (
                    <div className="flex justify-end gap-2">
                      <form action={approveProperty}>
                        <input type="hidden" name="id" value={p.id} />
                        <button
                          type="submit"
                          className="rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-500"
                        >
                          Approve
                        </button>
                      </form>
                      <form action={rejectProperty}>
                        <input type="hidden" name="id" value={p.id} />
                        <button
                          type="submit"
                          className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                          Reject
                        </button>
                      </form>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}
    </div>
  );
}

function FilterTabs({ active }: { active: StatusFilter }) {
  const filters: StatusFilter[] = [
    "all",
    "pending_approval",
    "approved",
    "rejected",
  ];
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {filters.map((f) => {
        const isActive = f === active;
        const href =
          f === "all" ? "/admin/properties" : `/admin/properties?status=${f}`;
        return (
          <Link
            key={f}
            href={href}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              isActive
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            }`}
          >
            {FILTER_LABELS[f]}
          </Link>
        );
      })}
    </div>
  );
}
