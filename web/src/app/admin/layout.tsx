import { AppShell } from "@/app/_components/app-shell";
import { requireRole } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole("admin");
  return (
    <AppShell role="admin" email={user.email}>
      {children}
    </AppShell>
  );
}
