import { z } from "zod";

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
});

export type PropertyCreateInput = z.infer<typeof propertyCreateSchema>;
