import { dashboardPathFor, getCurrentUser } from "@/lib/auth";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * Landing page after Clerk sign-in or sign-up completes.
 * If user has a role in our DB, send them to their dashboard.
 * Otherwise, send them to onboarding to pick a role.
 */
export default async function PostAuthPage() {
  const { userId, redirectToSignIn } = await auth();
  if (!userId) redirectToSignIn();

  const user = await getCurrentUser();
  if (!user) redirect("/onboarding");
  redirect(dashboardPathFor(user.role));
}
