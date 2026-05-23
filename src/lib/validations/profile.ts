import { z } from "zod";
import { peruPhoneRegex } from "./auth";

const normalizePeruPhoneValue = (value: unknown) => {
  if (typeof value !== "string") return value;
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("51") && digits.length === 11) return `+${digits}`;
  if (digits.length === 9) return `+51${digits}`;
  return value.trim();
};

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

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
