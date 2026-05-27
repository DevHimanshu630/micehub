import { AppShell } from "@/app/_components/app-shell";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function SupportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  return (
    <AppShell role={user.role} email={user.email}>
      {children}
    </AppShell>
  );
}
