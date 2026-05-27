"use server";

import { db } from "@/db";
import { bookings, payouts, properties, quotes } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { log } from "@/lib/log";
import { calculatePayout, DEFAULT_COMMISSION_BPS } from "@/lib/payouts";
import { payoutReleaseSchema } from "@/lib/schemas";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

/**
 * Admin-only: marks a confirmed booking as event-complete and creates the
 * matching pending payout row. Safe to call twice — if a payout already
 * exists for the booking the second call is a no-op.
 */
export async function markBookingComplete(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/sign-in");

  const id = formData.get("bookingId");
  if (typeof id !== "string" || !id) throw new Error("Missing booking id");

  const [row] = await db
    .select({
      booking: bookings,
      quote: quotes,
      property: properties,
    })
    .from(bookings)
    .innerJoin(quotes, eq(quotes.id, bookings.quoteId))
    .innerJoin(properties, eq(properties.id, bookings.propertyId))
    .where(eq(bookings.id, id))
    .limit(1);

  if (!row) throw new Error("Booking not found");
  if (row.booking.status !== "confirmed") {
    throw new Error("Only confirmed bookings can be marked complete");
  }

  const breakdown = calculatePayout(
    row.quote.totalAmount,
    DEFAULT_COMMISSION_BPS,
  );

  // Mark booking complete + create payout. Done sequentially because Neon's
  // HTTP driver doesn't support multi-statement transactions. The UNIQUE
  // constraint on payouts.booking_id is the real safety net; the existence
  // check below just keeps the happy path tidy.
  await db
    .update(bookings)
    .set({ eventCompletedAt: new Date() })
    .where(eq(bookings.id, id));

  const [existing] = await db
    .select({ id: payouts.id })
    .from(payouts)
    .where(eq(payouts.bookingId, id))
    .limit(1);

  if (!existing) {
    await db.insert(payouts).values({
      bookingId: id,
      propertyId: row.property.id,
      venueOwnerId: row.property.ownerId,
      grossRupees: breakdown.grossRupees,
      commissionRupees: breakdown.commissionRupees,
      netRupees: breakdown.netRupees,
      commissionBps: breakdown.commissionBps,
    });
  }

  revalidatePath("/admin/payouts");
  revalidatePath(`/admin/bookings/${id}`);
  revalidatePath("/admin/dashboard");
  revalidatePath("/venue/payouts");
}

export type ReleasePayoutState = {
  fieldErrors?: Partial<Record<"utr" | "note", string[]>>;
  formError?: string;
} | null;

/**
 * Admin-only: records that the venue has been paid out (manual bank transfer
 * for MVP; Razorpay Route integration is a future step). Stores the UTR
 * provided by the admin so there's an audit trail.
 */
export async function releasePayout(
  payoutId: string,
  _prev: ReleasePayoutState,
  formData: FormData,
): Promise<ReleasePayoutState> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/sign-in");

  const parsed = payoutReleaseSchema.safeParse({
    utr: formData.get("utr"),
    note: formData.get("note"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as never };
  }

  const [existing] = await db
    .select()
    .from(payouts)
    .where(eq(payouts.id, payoutId))
    .limit(1);

  if (!existing) return { formError: "Payout not found." };
  if (existing.status === "released") {
    return { formError: "This payout has already been released." };
  }

  try {
    await db
      .update(payouts)
      .set({
        status: "released",
        utr: parsed.data.utr,
        note: parsed.data.note ?? null,
        releasedAt: new Date(),
        releasedBy: user.id,
      })
      .where(eq(payouts.id, payoutId));
  } catch (err) {
    log.error("payout.release_failed", err, { payoutId, adminId: user.id });
    return { formError: "Failed to release payout. Please try again." };
  }

  revalidatePath("/admin/payouts");
  revalidatePath(`/admin/bookings/${existing.bookingId}`);
  revalidatePath("/admin/dashboard");
  revalidatePath("/venue/payouts");
  return null;
}
