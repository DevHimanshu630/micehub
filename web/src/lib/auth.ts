import "server-only";

import { db } from "@/db";
import { users, type User } from "@/db/schema";
import { auth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export type Role = User["role"];

/** Returns the DB user row for the current Clerk user, or null. */
export async function getCurrentUser(): Promise<User | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return user ?? null;
}

/** Returns the Clerk user ID, or null if not signed in. */
export async function getCurrentClerkUserId(): Promise<string | null> {
  const { userId } = await auth();
  return userId;
}

/** Returns the current user's email from Clerk (used during onboarding). */
export async function getCurrentClerkEmail(): Promise<string | null> {
  const clerk = await currentUser();
  return clerk?.emailAddresses[0]?.emailAddress ?? null;
}

/**
 * Ensures the current user is signed in AND has completed onboarding.
 * Redirects to /sign-in or /onboarding as needed.
 */
export async function requireOnboardedUser(): Promise<User> {
  const { userId, redirectToSignIn } = await auth();
  if (!userId) redirectToSignIn();

  const user = await getCurrentUser();
  if (!user) redirect("/onboarding");
  return user;
}

/** Like requireOnboardedUser, but additionally enforces a role. */
export async function requireRole(role: Role): Promise<User> {
  const user = await requireOnboardedUser();
  if (user.role !== role) redirect(dashboardPathFor(user.role));
  return user;
}

/** Returns the dashboard path for a given role. */
export function dashboardPathFor(role: Role): string {
  switch (role) {
    case "planner":
      return "/dashboard";
    case "venue":
      return "/venue/dashboard";
    case "admin":
      return "/admin/dashboard";
  }
}
