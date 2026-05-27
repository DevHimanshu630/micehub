import { StatusBadge } from "@/app/_components/status-badge";
import { db } from "@/db";
import { properties } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { desc, eq } from "drizzle-orm";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function VenueDashboardPage() {
  const user = await requireRole("venue");

  const myProperties = await db
    .select()
    .from(properties)
    .where(eq(properties.ownerId, user.id))
    .orderBy(desc(properties.createdAt));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My properties</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Welcome back, {user.email}. Manage your venues below.
          </p>
        </div>
        <Link
          href="/venue/properties/new"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
        >
          + Add property
        </Link>
      </div>

      {myProperties.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            You haven&apos;t added any properties yet.
          </p>
          <p className="mt-2 text-xs text-slate-500">
            New properties go through admin approval before appearing on the
            public listing.
          </p>
          <Link
            href="/venue/properties/new"
            className="mt-6 inline-block rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            Add your first property
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-950">
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
                    <StatusBadge status={p.status} />
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
