import { z } from "zod";

export const peruPhoneRegex = /^\+519\d{8}$/;

const baseSignUpFields = {
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[0-9]/, "Must contain at least one number"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
};

export const signUpSchema = z
  .object({
    ...baseSignUpFields,
    accountType: z.enum(["member", "organizer", "entity_admin"]),
    orgName: z.string().trim().max(120).optional(),
    inviteCode: z.string().trim().max(20).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine(
    (data) => data.accountType !== "entity_admin" || (data.orgName?.trim().length ?? 0) >= 2,
    { message: "Organization name is required", path: ["orgName"] },
  )
  .refine(
    (data) =>
      data.accountType !== "organizer" || (data.inviteCode?.trim().length ?? 0) >= 4,
    { message: "Invite code is required", path: ["inviteCode"] },
  );

export const signInSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;

export function buildSignupPayload(data: SignUpInput) {
  if (data.accountType === "entity_admin") {
    return { type: "entity_admin" as const, orgName: data.orgName!.trim() };
  }
  if (data.accountType === "organizer") {
    const code = data.inviteCode?.trim();
    if (!code) throw new Error("Invite code is required");
    return {
      type: "organizer" as const,
      inviteCode: code,
    };
  }
  return { type: "member" as const };
}
