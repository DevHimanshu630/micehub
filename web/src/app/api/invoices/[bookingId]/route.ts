import { renderToBuffer } from "@react-pdf/renderer";
import { eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import {
  bookings,
  payments,
  properties,
  quoteLineItems,
  quotes,
  rfpRecipients,
  rfps,
  users,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { buildInvoiceDocument, type InvoiceData } from "@/lib/invoice";

export const runtime = "nodejs";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ bookingId: string }> },
) {
  const { bookingId } = await ctx.params;
  if (!UUID_REGEX.test(bookingId)) {
    return NextResponse.json({ error: "Invalid booking id" }, { status: 400 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const [row] = await db
    .select({
      booking: bookings,
      quote: quotes,
      property: properties,
      rfp: rfps,
      plannerEmail: users.email,
    })
    .from(bookings)
    .innerJoin(quotes, eq(quotes.id, bookings.quoteId))
    .innerJoin(rfpRecipients, eq(rfpRecipients.id, quotes.rfpRecipientId))
    .innerJoin(rfps, eq(rfps.id, rfpRecipients.rfpId))
    .innerJoin(properties, eq(properties.id, bookings.propertyId))
    .innerJoin(users, eq(users.id, bookings.plannerId))
    .where(eq(bookings.id, bookingId))
    .limit(1);

  if (!row) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  // Authorisation: planner who created the booking, venue who owns the
  // property, or any admin.
  const isPlanner = row.booking.plannerId === user.id;
  const isVenueOwner =
    user.role === "venue" && row.property.ownerId === user.id;
  const isAdmin = user.role === "admin";

  if (!isPlanner && !isVenueOwner && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [lineItems, paidPayment] = await Promise.all([
    db
      .select()
      .from(quoteLineItems)
      .where(eq(quoteLineItems.quoteId, row.quote.id)),
    db
      .select()
      .from(payments)
      .where(eq(payments.bookingId, bookingId))
      .limit(20),
  ]);

  const successPayment = paidPayment.find((p) => p.status === "success");
  const advancePaid = successPayment
    ? Math.round(successPayment.amountPaise / 100)
    : 0;

  const invoiceData: InvoiceData = {
    invoiceNumber: `INV-${bookingId.slice(0, 8).toUpperCase()}`,
    invoiceDate: new Date(),
    bookingId,
    planner: { email: row.plannerEmail },
    venue: { name: row.property.name, city: row.property.city },
    event: {
      eventType: row.rfp.eventType,
      startDate: row.rfp.startDate,
      endDate: row.rfp.endDate,
      guestCount: row.rfp.guestCount,
    },
    lineItems: lineItems.map((li) => ({
      label: li.label,
      unitLabel: li.unitLabel,
      unitPrice: li.unitPrice,
      quantity: li.quantity,
      lineTotal: li.lineTotal,
    })),
    totalAmountInclGst: row.quote.totalAmount,
    advancePaid,
    paymentReference: successPayment?.razorpayPaymentId ?? null,
  };

  const buffer = await renderToBuffer(buildInvoiceDocument(invoiceData));

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${invoiceData.invoiceNumber}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
