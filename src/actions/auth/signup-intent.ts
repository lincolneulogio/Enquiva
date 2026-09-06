import { z } from "zod";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, verifications } from "@/lib/db/schema";
import { OrganizationService, type SignupIntentPayload } from "@/lib/organizations/organization.service";
import { claimPlatformOwner } from "@/lib/auth/platform-bootstrap";
import type { Locale } from "@/lib/i18n/core";

export const signupIntentPayloadSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("member") }),
  z.object({ type: z.literal("platform_owner") }),
  z.object({
    type: z.literal("organizer"),
    inviteCode: z.string().trim().min(4).max(20).optional(),
  }),
  z.object({
    type: z.literal("entity_admin"),
    orgName: z.string().trim().min(2).max(120),
  }),
]);

export function signupIntentIdentifier(email: string) {
  return `signup-intent:${email.toLowerCase()}`;
}

export async function storeSignupIntent(email: string, payload: SignupIntentPayload) {
  const identifier = signupIntentIdentifier(email);
  await db.delete(verifications).where(eq(verifications.identifier, identifier));
  await db.insert(verifications).values({
    id: randomUUID(),
    identifier,
    value: OrganizationService.serializeSignupIntent(payload),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });
}

export async function peekSignupIntent(email: string): Promise<SignupIntentPayload> {
  const identifier = signupIntentIdentifier(email);
  const [row] = await db
    .select()
    .from(verifications)
    .where(eq(verifications.identifier, identifier))
    .limit(1);

  if (!row || row.expiresAt < new Date()) {
    return { type: "member" };
  }

  return OrganizationService.parseSignupIntent(row.value);
}

export async function consumeSignupIntent(email: string): Promise<SignupIntentPayload> {
  const identifier = signupIntentIdentifier(email);
  const [row] = await db
    .select()
    .from(verifications)
    .where(eq(verifications.identifier, identifier))
    .limit(1);

  if (!row || row.expiresAt < new Date()) {
    await db.delete(verifications).where(eq(verifications.identifier, identifier));
    return { type: "member" };
  }

  await db.delete(verifications).where(eq(verifications.identifier, identifier));
  return OrganizationService.parseSignupIntent(row.value);
}

export function resolveAccountType(signupIntent: SignupIntentPayload) {
  const hasOrganizerInvite =
    signupIntent.type === "organizer" && Boolean(signupIntent.inviteCode?.trim());

  if (signupIntent.type === "platform_owner") return "platform_owner" as const;
  if (signupIntent.type === "entity_admin") return "entity_admin" as const;
  if (signupIntent.type === "organizer") {
    return hasOrganizerInvite ? ("organizer_pending" as const) : ("organizer" as const);
  }
  return "member" as const;
}

export async function applySignupIntent(input: {
  userId: string;
  userRole: string | null;
  userName: string | null;
  email: string;
  signupIntent: SignupIntentPayload;
  locale: Locale;
}) {
  const { userId, userRole, userName, email, signupIntent, locale } = input;
  let joinedOrg: Awaited<
    ReturnType<typeof OrganizationService.requestJoinOrganizationAsOrganizer>
  > | null = null;

  if (signupIntent.type === "platform_owner") {
    await claimPlatformOwner(userId);
  } else if (userRole === "member" || userRole === "admin" || userRole === "organizer") {
    // member = alta fresca; admin/organizer = reintento tras fallo parcial
    if (signupIntent.type === "entity_admin") {
      const [existing] = await db
        .select({ organizationId: users.organizationId, role: users.role })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!existing?.organizationId || existing.role !== "admin") {
        await OrganizationService.createOrganizationForAdmin({
          name: signupIntent.orgName,
          ownerUserId: userId,
        });
      }
    } else if (signupIntent.type === "organizer" && userRole === "member") {
      const inviteCode = signupIntent.inviteCode?.trim();
      if (inviteCode) {
        joinedOrg = await OrganizationService.requestJoinOrganizationAsOrganizer({
          userId,
          inviteCode,
        });
      } else {
        await OrganizationService.activateIndependentOrganizer({ userId });
      }
    }
  }

  if (joinedOrg) {
    const { notifyEntityAdminOfOrganizerRequest } = await import(
      "@/lib/organizations/organizer-request-notifications"
    );
    await notifyEntityAdminOfOrganizerRequest({
      org: joinedOrg,
      requesterName: userName ?? email,
      requesterEmail: email,
      locale,
    });
  }
}
