"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import {
  dashboardPathFor,
  getCurrentClerkEmail,
  getCurrentClerkUserId,
} from "@/lib/auth";
import { redirect } from "next/navigation";

export async function completeOnboarding(role: "planner" | "venue") {
  const userId = await getCurrentClerkUserId();
  if (!userId) redirect("/sign-in");

  const email = await getCurrentClerkEmail();
  if (!email) throw new Error("No email on Clerk user");

  // Idempotent upsert: if a row already exists for this user, do nothing.
  await db
    .insert(users)
    .values({ id: userId, email, role })
    .onConflictDoNothing({ target: users.id });

  redirect(dashboardPathFor(role));
}
