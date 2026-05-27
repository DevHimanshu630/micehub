import { AppShell } from "@/app/_components/app-shell";
import { requireRole } from "@/lib/auth";

export default async function VenueLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole("venue");
  return (
    <AppShell role="venue" email={user.email}>
      {children}
    </AppShell>
  );
}
