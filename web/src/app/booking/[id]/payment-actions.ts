"use server";

import { db } from "@/db";
import { bookingSpaces, bookings, payments, quotes } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { razorpay, verifyRazorpaySignature } from "@/lib/razorpay";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { expireStaleHolds } from "../actions";

const ADVANCE_PERCENT = 0.2;

export type CreatePaymentOrderResult =
  | {
      ok: true;
      orderId: string;
      amountPaise: number;
      currency: "INR";
      keyId: string;
    }
  | { ok: false; error: string };

export async function createPaymentOrder(
  bookingId: string,
): Promise<CreatePaymentOrderResult> {
  const user = await requireRole("planner");
  await expireStaleHolds();

  const [row] = await db
    .select({
      booking: bookings,
      quote: quotes,
    })
    .from(bookings)
    .innerJoin(quotes, eq(quotes.id, bookings.quoteId))
    .where(and(eq(bookings.id, bookingId), eq(bookings.plannerId, user.id)))
    .limit(1);

  if (!row) return { ok: false, error: "Booking not found." };
  if (row.booking.status !== "pending_payment") {
    return {
      ok: false,
      error: `Booking is ${row.booking.status.replace("_", " ")}, cannot accept payment.`,
    };
  }
  if (row.booking.holdExpiresAt.getTime() < Date.now()) {
    return { ok: false, error: "Hold has expired. Please start over." };
  }

  // Reuse an existing 'created' Razorpay order if one was already made for this
  // booking — keeps Razorpay's dashboard tidy and avoids double-charging.
  const [existing] = await db
    .select()
    .from(payments)
    .where(
      and(eq(payments.bookingId, bookingId), eq(payments.status, "created")),
    )
    .limit(1);

  if (existing) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    if (!keyId) return { ok: false, error: "Razorpay not configured." };
    return {
      ok: true,
      orderId: existing.razorpayOrderId,
      amountPaise: existing.amountPaise,
      currency: "INR",
      keyId,
    };
  }

  const advanceRupees = Math.round(row.quote.totalAmount * ADVANCE_PERCENT);
  const amountPaise = advanceRupees * 100;

  try {
    const order = await razorpay().orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: `booking_${bookingId.slice(0, 18)}`,
      notes: {
        bookingId,
        plannerId: user.id,
      },
    });

    await db.insert(payments).values({
      bookingId,
      razorpayOrderId: order.id,
      amountPaise,
    });

    const keyId = process.env.RAZORPAY_KEY_ID;
    if (!keyId) return { ok: false, error: "Razorpay not configured." };

    return {
      ok: true,
      orderId: order.id,
      amountPaise,
      currency: "INR",
      keyId,
    };
  } catch (err) {
    console.error("Failed to create Razorpay order:", err);
    return { ok: false, error: "Could not start payment. Please try again." };
  }
}

export type VerifyPaymentResult = { ok: true } | { ok: false; error: string };

export async function verifyPayment(input: {
  bookingId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): Promise<VerifyPaymentResult> {
  const user = await requireRole("planner");

  const [row] = await db
    .select({
      booking: bookings,
      payment: payments,
    })
    .from(bookings)
    .innerJoin(payments, eq(payments.bookingId, bookings.id))
    .where(
      and(
        eq(bookings.id, input.bookingId),
        eq(bookings.plannerId, user.id),
        eq(payments.razorpayOrderId, input.razorpayOrderId),
      ),
    )
    .limit(1);

  if (!row) return { ok: false, error: "Payment record not found." };

  // Idempotency: if we've already verified this payment, return success.
  if (row.payment.status === "success") {
    revalidatePath(`/booking/${input.bookingId}`);
    revalidatePath("/venue/calendar");
    return { ok: true };
  }

  const signatureValid = await verifyRazorpaySignature({
    orderId: input.razorpayOrderId,
    paymentId: input.razorpayPaymentId,
    signature: input.razorpaySignature,
  });

  if (!signatureValid) {
    await db
      .update(payments)
      .set({ status: "failed" })
      .where(eq(payments.id, row.payment.id));
    return { ok: false, error: "Payment signature is invalid." };
  }

  // Mark payment success, flip booking + booking_spaces to confirmed.
  await db
    .update(payments)
    .set({
      status: "success",
      razorpayPaymentId: input.razorpayPaymentId,
      completedAt: new Date(),
    })
    .where(eq(payments.id, row.payment.id));

  await db
    .update(bookings)
    .set({ status: "confirmed" })
    .where(eq(bookings.id, input.bookingId));

  await db
    .update(bookingSpaces)
    .set({ status: "confirmed" })
    .where(eq(bookingSpaces.bookingId, input.bookingId));

  revalidatePath(`/booking/${input.bookingId}`);
  revalidatePath("/venue/calendar");
  revalidatePath("/dashboard");
  return { ok: true };
}
