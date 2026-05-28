import {
  Badge,
  type BadgeTone,
  PageHeader,
  TableShell,
  Td,
  Th,
} from "@/app/_components/ui";
import { db } from "@/db";
import { users } from "@/db/schema";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

const ROLE_TONES: Record<string, BadgeTone> = {
  planner: "indigo",
  venue: "emerald",
  admin: "rose",
};

export default async function AdminUsersPage() {
  const rows = await db.select().from(users).orderBy(desc(users.createdAt));

  return (
    <div>
      <PageHeader
        title="Users"
        description={`${rows.length} ${rows.length === 1 ? "user" : "users"} signed up.`}
      />

      <TableShell>
        <thead>
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
                <span className="capitalize">
                  <Badge tone={ROLE_TONES[u.role] ?? "slate"}>{u.role}</Badge>
                </span>
              </Td>
              <Td>
                <span className="font-mono text-xs text-slate-500">{u.id}</span>
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
      </TableShell>
    </div>
  );
}
