import { db } from "@/db";
import { users } from "@/db/schema";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

const ROLE_CLASSES: Record<string, string> = {
  planner:
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
  venue:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  admin: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
};

export default async function AdminUsersPage() {
  const rows = await db.select().from(users).orderBy(desc(users.createdAt));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Users</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          {rows.length} {rows.length === 1 ? "user" : "users"} signed up.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
          <thead className="bg-slate-50 dark:bg-slate-950">
            <tr>
              <Th>Email</Th>
              <Th>Role</Th>
              <Th>Clerk ID</Th>
              <Th>Joined</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {rows.map((u) => (
              <tr
                key={u.id}
                className="hover:bg-slate-50 dark:hover:bg-slate-950"
              >
                <Td>
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {u.email}
                  </span>
                </Td>
                <Td>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${ROLE_CLASSES[u.role]}`}
                  >
                    {u.role}
                  </span>
                </Td>
                <Td>
                  <span className="font-mono text-xs text-slate-500">
                    {u.id}
                  </span>
                </Td>
                <Td>
                  <span className="text-xs text-slate-500">
                    {u.createdAt.toLocaleDateString("en-IN", {
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
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-2.5 text-left text-xs font-semibold tracking-wide text-slate-600 uppercase dark:text-slate-400">
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return (
    <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
      {children}
    </td>
  );
}
