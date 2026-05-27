import { db } from "@/db";
import { properties } from "@/db/schema";
import { desc } from "drizzle-orm";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PropertiesListPage() {
  const rows = await db
    .select()
    .from(properties)
    .orderBy(desc(properties.createdAt));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Properties</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {rows.length === 0
              ? "No properties yet. Add the first one to get started."
              : `${rows.length} ${rows.length === 1 ? "property" : "properties"} in the database.`}
          </p>
        </div>
        <Link
          href="/admin/properties/new"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
        >
          + Add property
        </Link>
      </div>

      {rows.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-950">
              <tr>
                <Th>Name</Th>
                <Th>City</Th>
                <Th align="right">Capacity</Th>
                <Th>Added</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {rows.map((p) => (
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

function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
      <p className="text-sm text-slate-600 dark:text-slate-400">
        No properties yet.
      </p>
      <Link
        href="/admin/properties/new"
        className="mt-4 inline-block rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
      >
        Add your first property
      </Link>
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
      className={`px-4 py-2.5 text-xs font-semibold tracking-wide text-slate-600 uppercase dark:text-slate-400 ${
        align === "right" ? "text-right" : "text-left"
      }`}
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
      className={`px-4 py-3 text-sm text-slate-700 dark:text-slate-300 ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </td>
  );
}
