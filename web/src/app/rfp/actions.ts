"use server";

import { db } from "@/db";
import { properties, rfpRecipients, rfps } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { rfpCreateSchema } from "@/lib/schemas";
import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type CreateRfpState = {
  fieldErrors?: Partial<
    Record<
      | "eventType"
      | "startDate"
      | "endDate"
      | "guestCount"
      | "fbNotes"
      | "avNotes"
      | "otherNotes"
      | "venueIds",
      string[]
    >
  >;
  formError?: string;
} | null;

export async function createRfp(
  _prev: CreateRfpState,
  formData: FormData,
): Promise<CreateRfpState> {
  const user = await requireRole("planner");

  const rawGuestCount = formData.get("guestCount");
  const guestCount =
    typeof rawGuestCount === "string" && rawGuestCount.trim() !== ""
      ? Number(rawGuestCount)
      : NaN;

  const venueIdsRaw = formData.get("venueIds");
  const venueIds =
    typeof venueIdsRaw === "string" && venueIdsRaw.trim() !== ""
      ? venueIdsRaw
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

  const parsed = rfpCreateSchema.safeParse({
    eventType: formData.get("eventType"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    guestCount,
    fbNotes: formData.get("fbNotes") || null,
    avNotes: formData.get("avNotes") || null,
    otherNotes: formData.get("otherNotes") || null,
    venueIds,
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as never };
  }

  // Validate that all selected venues exist and are approved.
  const validVenues = await db
    .select({ id: properties.id })
    .from(properties)
    .where(
      and(
        inArray(properties.id, parsed.data.venueIds),
        eq(properties.status, "approved"),
      ),
    );

  if (validVenues.length !== parsed.data.venueIds.length) {
    return {
      formError:
        "One or more selected venues are no longer available. Please refresh and re-select.",
    };
  }

  let newRfpId: string;
  try {
    const [rfp] = await db
      .insert(rfps)
      .values({
        plannerId: user.id,
        eventType: parsed.data.eventType,
        startDate: parsed.data.startDate,
        endDate: parsed.data.endDate,
        guestCount: parsed.data.guestCount,
        fbNotes: parsed.data.fbNotes ?? null,
        avNotes: parsed.data.avNotes ?? null,
        otherNotes: parsed.data.otherNotes ?? null,
      })
      .returning({ id: rfps.id });

    if (!rfp) throw new Error("RFP insert returned no row");
    newRfpId = rfp.id;

    await db.insert(rfpRecipients).values(
      validVenues.map((v) => ({
        rfpId: newRfpId,
        propertyId: v.id,
      })),
    );
  } catch (err) {
    console.error("Failed to create RFP:", err);
    return { formError: "Failed to send RFP. Please try again." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/venue/rfps");
  redirect(`/dashboard/rfps/${newRfpId}`);
}
