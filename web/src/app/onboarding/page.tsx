import { dashboardPathFor, getCurrentUser } from "@/lib/auth";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { OnboardingChoices } from "./_components/onboarding-choices";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const { userId, redirectToSignIn } = await auth();
  if (!userId) redirectToSignIn();

  // If they've already onboarded, send them to their dashboard.
  const existing = await getCurrentUser();
  if (existing) redirect(dashboardPathFor(existing.role));

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-950">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Welcome to MICEHub
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            How will you use the platform?
          </p>
        </div>
        <OnboardingChoices />
        <p className="mt-6 text-center text-xs text-slate-500">
          You can&apos;t change this later without contacting support.
        </p>
      </div>
    </div>
  );
}
