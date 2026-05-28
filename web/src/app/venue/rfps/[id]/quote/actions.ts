"use server";

import { db } from "@/db";
import {
  properties,
  quoteLineItems,
  quotes,
  rfpRecipients,
  spaces,
} from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { log } from "@/lib/log";
import { quoteCreateSchema } from "@/lib/schemas";
import { and, count, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type CreateQuoteState = {
  fieldErrors?: Partial<Record<"lineItems" | "notes", string[]>>;
  formError?: string;
} | null;

export async function submitQuote(
  rfpRecipientId: string,
  _prev: CreateQuoteState,
  formData: FormData,
): Promise<CreateQuoteState> {
  const user = await requireRole("venue");

  // Verify this venue owns the property tied to the recipient row.
  const [recipientRow] = await db
    .select({ id: rfpRecipients.id, propertyId: properties.id })
    .from(rfpRecipients)
    .innerJoin(properties, eq(properties.id, rfpRecipients.propertyId))
    .where(
      and(
        eq(rfpRecipients.id, rfpRecipientId),
        eq(properties.ownerId, user.id),
      ),
    )
    .limit(1);

  if (!recipientRow) {
    return { formError: "RFP not found or not assigned to your property." };
  }

  // A quote implies "I can host this event" — meaningless if the property has
  // no bookable spaces. Block here so the planner never gets stuck at booking.
  const [spaceRow] = await db
    .select({ spaceCount: count() })
    .from(spaces)
    .where(eq(spaces.propertyId, recipientRow.propertyId));

  if ((spaceRow?.spaceCount ?? 0) === 0) {
    return {
      formError:
        "Add at least one bookable space to this property before sending a quote. Go to My properties → this property → Add space.",
    };
  }

  // Block resubmission — one quote per recipient (UNIQUE constraint in DB).
  const [existing] = await db
    .select({ id: quotes.id })
    .from(quotes)
    .where(eq(quotes.rfpRecipientId, rfpRecipientId))
    .limit(1);

  if (existing) {
    return {
      formError:
        "You've already submitted a quote for this RFP. Contact the planner if you need to revise it.",
    };
  }

  const lineItemsRaw = formData.get("lineItems");
  let parsedLineItems: unknown;
  try {
    parsedLineItems =
      typeof lineItemsRaw === "string" ? JSON.parse(lineItemsRaw) : null;
  } catch {
    return { formError: "Could not read line items. Please try again." };
  }

  const parsed = quoteCreateSchema.safeParse({
    lineItems: parsedLineItems,
    notes: formData.get("notes") || null,
  });

  if (!parsed.success) {
    const flat = parsed.error.flatten();
    return {
      fieldErrors: flat.fieldErrors as never,
      formError: flat.formErrors[0],
    };
  }

  const totalAmount = parsed.data.lineItems.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );

  let newQuoteId: string;
  try {
    const [quote] = await db
      .insert(quotes)
      .values({
        rfpRecipientId,
        totalAmount,
        notes: parsed.data.notes ?? null,
      })
      .returning({ id: quotes.id });

    if (!quote) throw new Error("Quote insert returned no row");
    newQuoteId = quote.id;

    await db.insert(quoteLineItems).values(
      parsed.data.lineItems.map((item, idx) => ({
        quoteId: newQuoteId,
        label: item.label,
        unitLabel: item.unitLabel ?? null,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        lineTotal: item.unitPrice * item.quantity,
        sortOrder: idx,
      })),
    );

    await db
      .update(rfpRecipients)
      .set({ status: "responded" })
      .where(eq(rfpRecipients.id, rfpRecipientId));
  } catch (err) {
    log.error("quote.submit_failed", err, {
      rfpRecipientId,
      venueId: user.id,
    });
    return { formError: "Failed to submit quote. Please try again." };
  }

  revalidatePath(`/venue/rfps/${rfpRecipientId}`);
  revalidatePath(`/dashboard/rfps`);
  redirect(`/venue/rfps/${rfpRecipientId}`);
}
