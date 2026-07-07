import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, type Organization } from "@/lib/db/schema";
import { sendOrganizerRequestAdminEmail } from "@/lib/mail";
import type { MailLocale } from "@/lib/mail/locale-strings";

export async function notifyEntityAdminOfOrganizerRequest(input: {
  org: Organization;
  requesterName: string;
  requesterEmail: string;
  locale?: MailLocale;
}) {
  const [adminUser] = await db
    .select({ name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, input.org.ownerId))
    .limit(1);

  if (!adminUser?.email) return;

  await sendOrganizerRequestAdminEmail({
    email: adminUser.email,
    name: adminUser.name,
    requesterName: input.requesterName,
    requesterEmail: input.requesterEmail,
    organizationName: input.org.name,
    locale: input.locale,
  });
}
