import { z } from "zod";
import { peruPhoneNineDigitsRegex } from "./phone";

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100),
  phone: z
    .union([
      z
        .string()
        .regex(
          peruPhoneNineDigitsRegex,
          "El teléfono debe tener 9 dígitos después de +51 (ej. 987654321)",
        ),
      z.literal(""),
    ])
    .optional()
    .nullable(),
  address: z
    .union([
      z
        .string()
        .trim()
        .min(6, "Address must be at least 6 characters")
        .max(100, "Address must be at most 100 characters"),
      z.literal(""),
    ])
    .optional()
    .nullable(),
  bio: z.string().max(500).optional().nullable(),
  image: z
    .string()
    .refine(
      (val) => {
        if (val === "" || val.startsWith("/")) return true;
        try {
          const u = new URL(val);
          return u.protocol === "http:" || u.protocol === "https:";
        } catch {
          return false;
        }
      },
      { message: "Invalid URL" }
    )
    .optional()
    .nullable(),
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
