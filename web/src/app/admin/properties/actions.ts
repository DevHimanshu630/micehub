"use server";

import { db } from "@/db";
import { properties } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { propertyCreateSchema } from "@/lib/schemas";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

type FieldErrors = Partial<
  Record<"name" | "city" | "capacity" | "description", string[]>
>;

export type CreatePropertyState = {
  fieldErrors?: FieldErrors;
  formError?: string;
} | null;

export async function createProperty(
  _prev: CreatePropertyState,
  formData: FormData,
): Promise<CreatePropertyState> {
  await requireRole("admin");

  const rawCapacity = formData.get("capacity");
  const capacity =
    typeof rawCapacity === "string" && rawCapacity.trim() !== ""
      ? Number(rawCapacity)
      : NaN;

  const parsed = propertyCreateSchema.safeParse({
    name: formData.get("name"),
    city: formData.get("city"),
    capacity,
    description: formData.get("description") || null,
  });

  if (!parsed.success) {
    const flat = parsed.error.flatten();
    return { fieldErrors: flat.fieldErrors as FieldErrors };
  }

  try {
    // Admin-created properties are auto-approved.
    await db.insert(properties).values({ ...parsed.data, status: "approved" });
  } catch (err) {
    console.error("Failed to insert property:", err);
    return { formError: "Failed to save property. Please try again." };
  }

  revalidatePath("/admin/properties");
  redirect("/admin/properties");
}

export async function approveProperty(formData: FormData) {
  await requireRole("admin");
  const id = formData.get("id");
  if (typeof id !== "string" || !id) throw new Error("Missing property id");

  await db
    .update(properties)
    .set({ status: "approved" })
    .where(eq(properties.id, id));

  revalidatePath("/admin/properties");
  revalidatePath("/venues");
}

export async function rejectProperty(formData: FormData) {
  await requireRole("admin");
  const id = formData.get("id");
  if (typeof id !== "string" || !id) throw new Error("Missing property id");

  await db
    .update(properties)
    .set({ status: "rejected" })
    .where(eq(properties.id, id));

  revalidatePath("/admin/properties");
  revalidatePath("/venues");
}
