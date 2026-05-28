import { z } from "zod";
import {
  AMENITY_OPTIONS,
  OWNERSHIP_OPTIONS,
  SPACE_OFFERING_OPTIONS,
  VENUE_TYPE_OPTIONS,
} from "./venue-meta";

export const propertyCreateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(200, "Name is too long"),
  city: z
    .string()
    .trim()
    .min(2, "City is required")
    .max(100, "City name is too long"),
  address: z
    .string()
    .trim()
    .max(300, "Address is too long")
    .nullable()
    .optional(),
  capacity: z
    .number({ message: "Capacity must be a number" })
    .int("Capacity must be a whole number")
    .positive("Capacity must be greater than zero")
    .max(100000, "Capacity is unrealistically high"),
  description: z
    .string()
    .trim()
    .max(2000, "Description is too long")
    .nullable()
    .optional(),
  venueType: z.enum(VENUE_TYPE_OPTIONS, { message: "Pick a venue type" }),
  ownership: z.enum(OWNERSHIP_OPTIONS, { message: "Pick an ownership type" }),
  amenities: z.array(z.enum(AMENITY_OPTIONS)).max(AMENITY_OPTIONS.length),
});

export type PropertyCreateInput = z.infer<typeof propertyCreateSchema>;

export const spaceCreateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Space name must be at least 2 characters")
    .max(100, "Space name is too long"),
  capacity: z
    .number({ message: "Capacity must be a number" })
    .int("Capacity must be a whole number")
    .positive("Capacity must be greater than zero")
    .max(50000, "Capacity is unrealistically high"),
  description: z
    .string()
    .trim()
    .max(1000, "Description is too long")
    .nullable()
    .optional(),
  offerings: z
    .array(z.enum(SPACE_OFFERING_OPTIONS))
    .max(SPACE_OFFERING_OPTIONS.length),
});

export type SpaceCreateInput = z.infer<typeof spaceCreateSchema>;

export const EVENT_TYPE_OPTIONS = [
  "conference",
  "exhibition",
  "wedding",
  "training",
  "other",
] as const;

export type EventType = (typeof EVENT_TYPE_OPTIONS)[number];

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  conference: "Conference",
  exhibition: "Exhibition",
  wedding: "Wedding",
  training: "Training",
  other: "Other",
};

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
  .transform((s) => new Date(`${s}T00:00:00Z`))
  .refine((d) => !Number.isNaN(d.getTime()), "Invalid date");

export const rfpCreateSchema = z
  .object({
    eventType: z.enum(EVENT_TYPE_OPTIONS, { message: "Pick an event type" }),
    startDate: dateString,
    endDate: dateString,
    guestCount: z
      .number({ message: "Guest count must be a number" })
      .int("Guest count must be a whole number")
      .positive("Guest count must be greater than zero")
      .max(100000, "Guest count is unrealistically high"),
    fbNotes: z.string().trim().max(2000).nullable().optional(),
    avNotes: z.string().trim().max(2000).nullable().optional(),
    otherNotes: z.string().trim().max(2000).nullable().optional(),
    venueIds: z
      .array(z.string().uuid("Invalid venue id"))
      .min(1, "Pick at least one venue")
      .max(20, "Select fewer than 20 venues at a time"),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "End date must be on or after start date",
    path: ["endDate"],
  });

export type RfpCreateInput = z.infer<typeof rfpCreateSchema>;

export const quoteLineItemSchema = z.object({
  label: z
    .string()
    .trim()
    .min(2, "Label must be at least 2 characters")
    .max(200, "Label is too long"),
  unitLabel: z.string().trim().max(50).nullable().optional(),
  unitPrice: z
    .number({ message: "Unit price must be a number" })
    .int("Use whole rupees only (no paise)")
    .nonnegative("Unit price cannot be negative")
    .max(100_000_000, "Unit price is unrealistically high"),
  quantity: z
    .number({ message: "Quantity must be a number" })
    .int("Quantity must be a whole number")
    .positive("Quantity must be at least 1")
    .max(100_000, "Quantity is unrealistically high"),
});

export type QuoteLineItemInput = z.infer<typeof quoteLineItemSchema>;

export const quoteCreateSchema = z.object({
  lineItems: z
    .array(quoteLineItemSchema)
    .min(1, "Add at least one line item")
    .max(50, "Use 50 line items or fewer"),
  notes: z
    .string()
    .trim()
    .max(2000, "Notes are too long")
    .nullable()
    .optional(),
});

export type QuoteCreateInput = z.infer<typeof quoteCreateSchema>;

export const supportTicketCreateSchema = z.object({
  subject: z
    .string()
    .trim()
    .min(4, "Subject must be at least 4 characters")
    .max(200, "Subject is too long"),
  body: z
    .string()
    .trim()
    .min(10, "Please describe the issue (at least 10 characters)")
    .max(5000, "Message is too long"),
});

export type SupportTicketCreateInput = z.infer<
  typeof supportTicketCreateSchema
>;

export const supportReplySchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "Reply cannot be empty")
    .max(5000, "Reply is too long"),
});

export type SupportReplyInput = z.infer<typeof supportReplySchema>;

export const payoutReleaseSchema = z.object({
  utr: z
    .string()
    .trim()
    .min(6, "UTR / reference must be at least 6 characters")
    .max(50, "UTR is too long"),
  note: z.string().trim().max(500, "Note is too long").nullable().optional(),
});

export type PayoutReleaseInput = z.infer<typeof payoutReleaseSchema>;
