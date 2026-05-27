"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import {
  dashboardPathFor,
  getCurrentClerkEmail,
  getCurrentClerkUserId,
} from "@/lib/auth";
import { redirect } from "next/navigation";

// Server-action arguments come from the client over a serialized boundary; the
// TS parameter type is compile-time only. Validate at runtime so a crafted call
// like completeOnboarding("admin") cannot self-promote to admin.
const ALLOWED_ROLES = new Set(["planner", "venue"] as const);
type AllowedRole = "planner" | "venue";

export async function completeOnboarding(role: AllowedRole) {
  if (!ALLOWED_ROLES.has(role as AllowedRole)) {
    throw new Error("Invalid role");
  }

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
