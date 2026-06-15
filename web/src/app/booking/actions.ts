"use server";

import { db } from "@/db";
import {
  bookingSpaces,
  bookings,
  properties,
  quotes,
  rfpRecipients,
  rfps,
  spaces,
} from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { log } from "@/lib/log";
import { and, eq, lt } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const HOLD_DURATION_MS = 15 * 60 * 1000;

export type CreateBookingState = {
  formError?: string;
} | null;

/**
 * Mark stale 'pending_payment' bookings as 'expired'. Runs at the start of
 * every booking attempt and every booking read — keeps the EXCLUDE constraint
 * accurate without a separate cron job.
 */
async function expireStaleHolds(): Promise<void> {
  const now = new Date();
  const expired = await db
    .update(bookings)
    .set({ status: "expired" })
    .where(
      and(
        eq(bookings.status, "pending_payment"),
        lt(bookings.holdExpiresAt, now),
      ),
    )
    .returning({ id: bookings.id });

  if (expired.length > 0) {
    for (const b of expired) {
      await db
        .update(bookingSpaces)
        .set({ status: "expired" })
        .where(eq(bookingSpaces.bookingId, b.id));
    }
  }
}

export async function createBooking(
  quoteId: string,
): Promise<CreateBookingState> {
  const user = await requireRole("planner");
  await expireStaleHolds();

  // Load the quote + RFP + property to confirm ownership and get dates.
  const [data] = await db
    .select({
      quote: quotes,
      rfp: rfps,
      property: properties,
    })
    .from(quotes)
    .innerJoin(rfpRecipients, eq(rfpRecipients.id, quotes.rfpRecipientId))
    .innerJoin(rfps, eq(rfps.id, rfpRecipients.rfpId))
    .innerJoin(properties, eq(properties.id, rfpRecipients.propertyId))
    .where(and(eq(quotes.id, quoteId), eq(rfps.plannerId, user.id)))
    .limit(1);

  if (!data) {
    return { formError: "Quote not found or not yours." };
  }

  const holdExpiresAt = new Date(Date.now() + HOLD_DURATION_MS);

  // bookings.quote_id is UNIQUE, so at most one booking row ever exists per
  // quote. Decide what to do with it before attempting any insert.
  const [existingBooking] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.quoteId, quoteId))
    .limit(1);

  if (existingBooking) {
    // Active hold or already paid: just jump back to it.
    if (
      existingBooking.status === "pending_payment" ||
      existingBooking.status === "confirmed"
    ) {
      redirect(`/booking/${existingBooking.id}`);
    }

    // Stale ('expired') or 'cancelled': revive the SAME row instead of
    // inserting a second booking (which would violate the unique quote_id and
    // crash). Re-arm the held spaces first so the EXCLUDE constraint re-checks
    // them against any other active holds.
    try {
      await db
        .update(bookingSpaces)
        .set({ status: "pending_payment" })
        .where(eq(bookingSpaces.bookingId, existingBooking.id));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("booking_spaces_no_overlap")) {
        return {
          formError:
            "One or more spaces are already booked or held for these dates. Please pick a different venue or contact the planner.",
        };
      }
      log.error("booking.revive_failed", err, { quoteId, plannerId: user.id });
      return { formError: "Failed to create booking. Please try again." };
    }

    await db
      .update(bookings)
      .set({ status: "pending_payment", holdExpiresAt })
      .where(eq(bookings.id, existingBooking.id));

    revalidatePath("/dashboard");
    revalidatePath(`/venue/calendar`);
    redirect(`/booking/${existingBooking.id}`);
  }

  const propertySpaces = await db
    .select({ id: spaces.id })
    .from(spaces)
    .where(eq(spaces.propertyId, data.property.id));

  if (propertySpaces.length === 0) {
    return {
      formError:
        "This property has no bookable spaces. Ask the venue to add at least one.",
    };
  }

  // Attempt the insert. The EXCLUDE constraint at the DB level will throw if
  // any space is already held/confirmed for an overlapping date range.
  const [bookingRow] = await db
    .insert(bookings)
    .values({
      quoteId,
      plannerId: user.id,
      propertyId: data.property.id,
      holdExpiresAt,
    })
    .returning({ id: bookings.id });

  if (!bookingRow) {
    return { formError: "Could not create booking. Please try again." };
  }
  const bookingId = bookingRow.id;

  try {
    await db.insert(bookingSpaces).values(
      propertySpaces.map((s) => ({
        bookingId,
        spaceId: s.id,
        startDate: data.rfp.startDate,
        endDate: data.rfp.endDate,
      })),
    );
  } catch (err) {
    // Rollback the parent booking if the child insert failed.
    await db.delete(bookings).where(eq(bookings.id, bookingId));

    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("booking_spaces_no_overlap")) {
      return {
        formError:
          "One or more spaces are already booked or held for these dates. Please pick a different venue or contact the planner.",
      };
    }
    log.error("booking.create_failed", err, { quoteId, plannerId: user.id });
    return { formError: "Failed to create booking. Please try again." };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/venue/calendar`);
  redirect(`/booking/${bookingId}`);
}

export async function cancelBooking(bookingId: string): Promise<void> {
  const user = await requireRole("planner");

  await db
    .update(bookings)
    .set({ status: "cancelled" })
    .where(and(eq(bookings.id, bookingId), eq(bookings.plannerId, user.id)));

  await db
    .update(bookingSpaces)
    .set({ status: "cancelled" })
    .where(eq(bookingSpaces.bookingId, bookingId));

  revalidatePath("/dashboard");
  revalidatePath(`/booking/${bookingId}`);
  revalidatePath("/venue/calendar");
}

export { expireStaleHolds };
