import { AppShell } from "@/app/_components/app-shell";
import { requireRole } from "@/lib/auth";

export default async function BookingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole("planner");
  return (
    <AppShell role="planner" email={user.email}>
      {children}
    </AppShell>
  );
}
