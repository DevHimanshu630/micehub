"use server";

import { db } from "@/db";
import { supportMessages, supportTickets } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { log } from "@/lib/log";
import { supportReplySchema, supportTicketCreateSchema } from "@/lib/schemas";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type CreateTicketState = {
  fieldErrors?: Partial<Record<"subject" | "body", string[]>>;
  formError?: string;
} | null;

export async function createTicket(
  _prev: CreateTicketState,
  formData: FormData,
): Promise<CreateTicketState> {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const parsed = supportTicketCreateSchema.safeParse({
    subject: formData.get("subject"),
    body: formData.get("body"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as never };
  }

  let newTicketId: string;
  try {
    const [t] = await db
      .insert(supportTickets)
      .values({ openedBy: user.id, subject: parsed.data.subject })
      .returning({ id: supportTickets.id });
    if (!t) throw new Error("Insert returned no row");
    newTicketId = t.id;

    await db.insert(supportMessages).values({
      ticketId: newTicketId,
      fromUserId: user.id,
      body: parsed.data.body,
    });
  } catch (err) {
    log.error("support.ticket_create_failed", err, { userId: user.id });
    return { formError: "Failed to open ticket. Please try again." };
  }

  revalidatePath("/support");
  revalidatePath("/admin/support");
  redirect(`/support/${newTicketId}`);
}

export type ReplyState = {
  fieldError?: string;
  formError?: string;
} | null;

export async function postReply(
  ticketId: string,
  _prev: ReplyState,
  formData: FormData,
): Promise<ReplyState> {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  // The ticket opener and any admin can post replies.
  const [ticket] = await db
    .select()
    .from(supportTickets)
    .where(eq(supportTickets.id, ticketId))
    .limit(1);

  if (!ticket) return { formError: "Ticket not found." };
  if (user.role !== "admin" && ticket.openedBy !== user.id) {
    return { formError: "Ticket not found." };
  }

  const parsed = supportReplySchema.safeParse({
    body: formData.get("body"),
  });
  if (!parsed.success) {
    return { fieldError: parsed.error.flatten().fieldErrors.body?.[0] };
  }

  try {
    await db.insert(supportMessages).values({
      ticketId,
      fromUserId: user.id,
      body: parsed.data.body,
    });
    await db
      .update(supportTickets)
      .set({ updatedAt: new Date() })
      .where(eq(supportTickets.id, ticketId));
  } catch (err) {
    log.error("support.reply_failed", err, { ticketId, userId: user.id });
    return { formError: "Failed to send reply." };
  }

  revalidatePath(`/support/${ticketId}`);
  revalidatePath(`/admin/support/${ticketId}`);
  revalidatePath("/admin/support");
  return null;
}

export async function setTicketStatus(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/sign-in");

  const id = formData.get("id");
  const status = formData.get("status");
  if (typeof id !== "string" || !id) throw new Error("Missing ticket id");
  if (status !== "open" && status !== "resolved") {
    throw new Error("Invalid status");
  }

  await db
    .update(supportTickets)
    .set({
      status,
      resolvedAt: status === "resolved" ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(supportTickets.id, id));

  revalidatePath(`/admin/support/${id}`);
  revalidatePath(`/support/${id}`);
  revalidatePath("/admin/support");
  revalidatePath("/support");
}
