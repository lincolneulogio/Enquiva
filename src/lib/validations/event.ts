import { z } from "zod";

export const eventCategories = [
  // 18 categorías estándar de Enquiva
  "conferences",
  "education",
  "business",
  "music",
  "sports",
  "religion",
  "arts",
  "community",
  "government",
  "charity",
  "tradeshows",
  "technology",
  "celebrations",
  "travel",
  "health",
  "corporate",
  "family",
  "other",
  // Slugs legados para retrocompatibilidad
  "worship",
  "retreat",
  "youth",
  "conference",
  "prayer",
  "bible_study",
  "outreach",
  "fellowship",
] as const;

export const eventStatusValues = [
  "draft",
  "published",
  "cancelled",
  "completed",
] as const;

export const eventModalityValues = [
  "in_person",
  "online",
  "hybrid",
] as const;

const isValidDateInput = (value: string) => !Number.isNaN(new Date(value).getTime());

export const eventScheduleSlotSchema = z.object({
  id: z.string().min(1),
  label: z.string().max(60).optional().nullable(),
  date: z
    .string()
    .min(1, "Date is required")
    .refine(isValidDateInput, { message: "Invalid date format" }),
  endDate: z
    .string()
    .optional()
    .nullable()
    .refine((value) => !value || isValidDateInput(value), {
      message: "Invalid end date format",
    }),
});

export type EventScheduleSlot = z.infer<typeof eventScheduleSlotSchema>;

const optionalUrl = z
  .string()
  .optional()
  .nullable()
  .transform((val) => (val == null || val.trim() === "" ? null : val))
  .pipe(z.string().url("Ingresa una URL válida").nullable());

export const baseEventSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  description: z
    .string()
    .refine(
      (val) => {
        // Strip HTML tags to get plain text length
        const plain = val.replace(/<[^>]*>/g, "").replace(/&[a-z]+;/gi, " ").trim();
        return plain.length >= 20;
      },
      { message: "Description must be at least 20 characters" }
    ),
  category: z.string().min(1, "Category is required"),
  eventTypeId: z.string().uuid().optional().nullable(),
  modality: z.enum(eventModalityValues).optional().nullable(),
  tags: z.array(z.string()).optional().default([]),
  schedules: z
    .array(eventScheduleSlotSchema)
    .min(1, "At least one schedule is required")
    .max(3, "Maximum 3 schedules allowed")
    .optional()
    .nullable(),
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
  latitude: z
    .union([z.string(), z.number()])
    .optional()
    .nullable()
    .transform((value) => {
      if (value === "" || value === null || value === undefined) return null;
      const num = Number(value);
      return Number.isNaN(num) ? null : num;
    })
    .pipe(z.number().min(-90).max(90).nullable()),
  longitude: z
    .union([z.string(), z.number()])
    .optional()
    .nullable()
    .transform((value) => {
      if (value === "" || value === null || value === undefined) return null;
      const num = Number(value);
      return Number.isNaN(num) ? null : num;
    })
    .pipe(z.number().min(-180).max(180).nullable()),
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
  hasCertificate: z.boolean().default(false),
  certificateTitle: z.string().max(120, "Máximo 120 caracteres").optional().nullable(),
  certificatePrice: z
    .union([z.string(), z.number()])
    .optional()
    .nullable()
    .transform((value) => {
      if (value === "" || value === null || value === undefined) return 0;
      const num = Number(value);
      return Number.isNaN(num) ? 0 : Math.max(0, num);
    })
    .default(0),
  holdMinutesCard: z.coerce.number().int().min(5).max(120).optional().default(30),
  holdHoursManual: z.coerce.number().int().min(1).max(72).optional().default(24),
  nearEventWindowHours: z.coerce.number().int().min(1).max(168).optional().default(48),
  nearEventHoldMinutes: z.coerce.number().int().min(5).max(60).optional().default(15),
  salesCutoffHoursBefore: z
    .union([z.string(), z.number()])
    .optional()
    .nullable()
    .transform((value) => {
      if (value === "" || value === null || value === undefined) return null;
      const num = Number(value);
      return Number.isNaN(num) ? null : num;
    })
    .pipe(z.number().int().min(1).max(168).nullable()),
});

export const createEventSchema = baseEventSchema
  .refine(
    (data) => !data.isVirtual || !!data.virtualLink?.trim(),
    { message: "Meeting link is required for virtual events", path: ["virtualLink"] }
  )
  .refine(
    (data) => data.isVirtual || !!data.location?.trim(),
    { message: "Venue address is required for in-person events", path: ["location"] }
  )
  .refine(
    (data) =>
      data.isVirtual ||
      data.status !== "published" ||
      (data.latitude != null && data.longitude != null),
    {
      message: "Map pin is required to publish an in-person event",
      path: ["latitude"],
    }
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
  )
  .refine(
    (data) => {
      if (data.status !== "published") return true;
      if (data.isVirtual === true) return true;
      return data.latitude != null && data.longitude != null;
    },
    {
      message: "Map pin is required to publish an in-person event",
      path: ["latitude"],
    }
  );

export const eventFilterSchema = z.object({
  category: z.string().optional(),
  type: z.string().optional(),
  modality: z.enum(["all", "in_person", "online", "hybrid"]).optional(),
  date: z
    .enum(["all", "today", "tomorrow", "this_week", "this_month", "upcoming", "past"])
    .optional(),
  price: z.enum(["all", "free", "paid"]).optional(),
  accessType: z.enum(["all", "free", "paid", "registration", "invitation"]).optional(),
  eventStatus: z.enum(["all", "upcoming", "ongoing", "completed"]).optional(),
  status: z.enum(eventStatusValues).optional(),
  search: z.string().optional(),
  location: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(12),
});

export type CreateEventInput = z.input<typeof createEventSchema>;
export type UpdateEventInput = z.input<typeof updateEventSchema>;
export type EventFilterInput = z.infer<typeof eventFilterSchema>;
