import { AppShell } from "@/app/_components/app-shell";
import { getCurrentUser } from "@/lib/auth";
import { VenuesPublicNav } from "./_components/public-nav";

export default async function VenuesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  // Planners use the full app shell so they don't lose their navigation
  // context when they click "Browse venues" from the sidebar. Everyone else
  // (unsigned visitors, venue owners, admins) gets the marketing-style top nav.
  if (user?.role === "planner") {
    return (
      <AppShell role="planner" email={user.email}>
        {children}
      </AppShell>
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <VenuesPublicNav signedIn={Boolean(user)} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-6 md:py-10">
        {children}
      </main>
    </div>
  );
}
