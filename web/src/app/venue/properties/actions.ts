"use server";

import { db } from "@/db";
import { properties, spaces } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { log } from "@/lib/log";
import { propertyCreateSchema, spaceCreateSchema } from "@/lib/schemas";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type FieldErrors<K extends string> = Partial<Record<K, string[]>>;

export type CreateVenuePropertyState = {
  fieldErrors?: FieldErrors<
    | "name"
    | "city"
    | "address"
    | "capacity"
    | "description"
    | "venueType"
    | "ownership"
    | "amenities"
  >;
  formError?: string;
} | null;

export async function createVenueProperty(
  _prev: CreateVenuePropertyState,
  formData: FormData,
): Promise<CreateVenuePropertyState> {
  const user = await requireRole("venue");

  const rawCapacity = formData.get("capacity");
  const capacity =
    typeof rawCapacity === "string" && rawCapacity.trim() !== ""
      ? Number(rawCapacity)
      : NaN;

  const parsed = propertyCreateSchema.safeParse({
    name: formData.get("name"),
    city: formData.get("city"),
    address: formData.get("address") || null,
    capacity,
    description: formData.get("description") || null,
    venueType: formData.get("venueType"),
    ownership: formData.get("ownership"),
    amenities: formData.getAll("amenities"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as never };
  }

  let newId: string;
  try {
    const [row] = await db
      .insert(properties)
      .values({
        ...parsed.data,
        ownerId: user.id,
        // status defaults to 'pending_approval'
      })
      .returning({ id: properties.id });
    if (!row) throw new Error("Insert returned no row");
    newId = row.id;
  } catch (err) {
    log.error("venue.property_insert_failed", err, { venueId: user.id });
    return { formError: "Failed to save property. Please try again." };
  }

  revalidatePath("/venue/dashboard");
  redirect(`/venue/properties/${newId}`);
}

export type CreateSpaceState = {
  fieldErrors?: FieldErrors<"name" | "capacity" | "description" | "offerings">;
  formError?: string;
} | null;

export async function createSpace(
  propertyId: string,
  _prev: CreateSpaceState,
  formData: FormData,
): Promise<CreateSpaceState> {
  const user = await requireRole("venue");

  // Ensure the venue owns this property before letting them add a space to it.
  const [property] = await db
    .select({ id: properties.id })
    .from(properties)
    .where(and(eq(properties.id, propertyId), eq(properties.ownerId, user.id)))
    .limit(1);

  if (!property) {
    return { formError: "Property not found or not owned by you." };
  }

  const rawCapacity = formData.get("capacity");
  const capacity =
    typeof rawCapacity === "string" && rawCapacity.trim() !== ""
      ? Number(rawCapacity)
      : NaN;

  const parsed = spaceCreateSchema.safeParse({
    name: formData.get("name"),
    capacity,
    description: formData.get("description") || null,
    offerings: formData.getAll("offerings"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as never };
  }

  try {
    await db.insert(spaces).values({ propertyId, ...parsed.data });
  } catch (err) {
    log.error("venue.space_insert_failed", err, {
      propertyId,
      venueId: user.id,
    });
    return { formError: "Failed to save space. Please try again." };
  }

  revalidatePath(`/venue/properties/${propertyId}`);
  redirect(`/venue/properties/${propertyId}`);
}
