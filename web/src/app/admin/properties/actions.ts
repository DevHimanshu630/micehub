"use server";

import { db } from "@/db";
import { properties } from "@/db/schema";
import { propertyCreateSchema } from "@/lib/schemas";
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
    await db.insert(properties).values(parsed.data);
  } catch (err) {
    console.error("Failed to insert property:", err);
    return { formError: "Failed to save property. Please try again." };
  }

  revalidatePath("/admin/properties");
  redirect("/admin/properties");
}
