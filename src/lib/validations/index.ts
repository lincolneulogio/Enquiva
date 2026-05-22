import { z } from "zod";

export const peruPhoneRegex = /^\+519\d{8}$/;

// ─── Auth Schemas ─────────────────────────────────────────────────────────────

export const signUpSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").max(100),
    email: z.string().trim().toLowerCase().email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[0-9]/, "Must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const signInSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

// ─── Event Schemas ────────────────────────────────────────────────────────────

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

const normalizePeruPhoneValue = (value: unknown) => {
  if (typeof value !== "string") return value;
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("51") && digits.length === 11) return `+${digits}`;
  if (digits.length === 9) return `+51${digits}`;
  return value.trim();
};

const optionalUrl = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? null : value),
  z.string().url("Ingresa una URL válida").optional().nullable()
);

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

export const paymentStatusValues = ["pending", "approved", "rejected"] as const;
export const ticketStatusValues = ["active", "used", "cancelled"] as const;

export const createPaymentSchema = z.object({
  registrationId: z.string().uuid(),
  amount: z.number().positive("Amount must be greater than zero"),
  currency: z.string().length(3, "Use ISO currency code").transform((value) => value.toUpperCase()),
  method: z.string().min(3).max(100),
  reference: z.string().max(100).optional(),
  receiptUrl: z.string().url().optional(),
  receiptFileName: z.string().max(200).optional(),
  notes: z.string().max(500).optional(),
});

export const updatePaymentStatusSchema = z.object({
  paymentId: z.string().uuid(),
  status: z.enum(paymentStatusValues),
  notes: z.string().max(500).optional(),
});

// ─── Registration Schemas ─────────────────────────────────────────────────────

export const createRegistrationSchema = z.object({
  eventId: z.string().uuid(),
  contactPhone: z.preprocess(
    normalizePeruPhoneValue,
    z.string().regex(peruPhoneRegex, "Phone must follow format +519XXXXXXXX")
  ),
  notes: z.string().max(500).optional(),
});

export const checkInSchema = z.object({
  registrationId: z.string().uuid(),
  eventId: z.string().uuid(),
});

// ─── Profile Schemas ──────────────────────────────────────────────────────────

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100),
  phone: z.preprocess(
    (value) => {
      if (typeof value === "string" && value.trim() === "") return null;
      return normalizePeruPhoneValue(value);
    },
    z
      .string()
      .regex(peruPhoneRegex, "Phone must follow format +519XXXXXXXX")
      .optional()
      .nullable()
  ),
  bio: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? null : value),
    z.string().max(500).optional().nullable()
  ),
  image: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? null : value),
    z.string().url().optional().nullable()
  ),
});

export const updatePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[0-9]/, "Must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
  });

// ─── Notification Schemas ─────────────────────────────────────────────────────

export const markNotificationsReadSchema = z.object({
  notificationIds: z.array(z.string().uuid()).optional(),
  markAll: z.boolean().optional(),
});

// ─── Type Exports ──────────────────────────────────────────────────────────────

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type EventFilterInput = z.infer<typeof eventFilterSchema>;
export type CreateRegistrationInput = z.infer<typeof createRegistrationSchema>;
export type CheckInInput = z.infer<typeof checkInSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentStatusInput = z.infer<typeof updatePaymentStatusSchema>;
