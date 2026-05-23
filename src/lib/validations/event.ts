import { z } from "zod";

export const eventCategories = [
  "worship",
  "retreat",
  "youth",
  "charity",
  "conference",
  "prayer",
  "bible_study",
  "outreach",
  "fellowship",
  "other",
] as const;

export const eventStatusValues = [
  "draft",
  "published",
  "cancelled",
  "completed",
] as const;

const isValidDateInput = (value: string) => !Number.isNaN(new Date(value).getTime());

const optionalUrl = z
  .string()
  .optional()
  .nullable()
  .transform((val) => (val == null || val.trim() === "" ? null : val))
  .pipe(z.string().url("Ingresa una URL válida").nullable());

const baseEventSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  description: z.string().min(20, "Description must be at least 20 characters"),
  category: z.string().min(1, "Category is required"),
  date: z
    .string()
    .min(1, "Date is required")
    .refine(isValidDateInput, { message: "Invalid date format" })
    .refine(
      (val) => {
        const eventDate = new Date(val);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return eventDate >= today;
      },
      { message: "Event date cannot be in the past" }
    ),
  endDate: z
    .string()
    .optional()
    .nullable()
    .refine((value) => !value || isValidDateInput(value), {
      message: "Invalid end date format",
    }),
  location: z.string().max(300).optional().nullable(),
  locationUrl: optionalUrl,
  isVirtual: z.boolean().default(false),
  virtualLink: optionalUrl,
  capacity: z.number().int().positive().optional().nullable(),
  coverImage: optionalUrl,
  price: z
    .union([z.string(), z.number()])
    .optional()
    .nullable()
    .transform((value) => {
      if (value === "" || value === null || value === undefined) return null;
      const num = Number(value);
      return Number.isNaN(num) ? null : num;
    })
    .pipe(z.number().positive("El precio debe ser mayor a 0").nullable()),
  status: z.enum(eventStatusValues).default("draft"),
  isFeatured: z.boolean().default(false),
  hasTransport: z.boolean().default(false),
});

export const createEventSchema = baseEventSchema
  .refine(
    (data) => !data.isVirtual || !!data.virtualLink?.trim(),
    { message: "Meeting link is required for virtual events", path: ["virtualLink"] }
  )
  .refine(
    (data) => data.isVirtual || !!data.location?.trim(),
    { message: "Venue address is required for in-person events", path: ["location"] }
  );

export const updateEventSchema = baseEventSchema
  .partial()
  .refine(
    (data) => !data.isVirtual || !!data.virtualLink?.trim(),
    { message: "Meeting link is required for virtual events", path: ["virtualLink"] }
  )
  .refine(
    (data) => data.isVirtual === undefined || data.isVirtual || !!data.location?.trim(),
    { message: "Venue address is required for in-person events", path: ["location"] }
  );

export const eventFilterSchema = z.object({
  category: z.string().optional(),
  status: z.enum(eventStatusValues).optional(),
  search: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(50).default(12),
});

export type CreateEventInput = z.input<typeof createEventSchema>;
export type UpdateEventInput = z.input<typeof updateEventSchema>;
export type EventFilterInput = z.infer<typeof eventFilterSchema>;
