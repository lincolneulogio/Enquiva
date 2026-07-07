import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, type Organization } from "@/lib/db/schema";
import { sendOrganizerRequestAdminEmail } from "@/lib/mail";
import type { MailLocale } from "@/lib/mail/locale-strings";
import { NotificationService } from "@/lib/notifications/notification.service";

export async function notifyEntityAdminOfOrganizerRequest(input: {
  org: Organization;
  requesterName: string;
  requesterEmail: string;
  locale?: MailLocale;
}) {
  const [adminUser] = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, input.org.ownerId))
    .limit(1);

  if (!adminUser?.email) return;

  const title = "Nueva solicitud de organizador";
  const message = `${input.requesterName} (${input.requesterEmail}) solicitó unirse a ${input.org.name} como organizador.`;

  await NotificationService.create({
    userId: adminUser.id,
    type: "organizer_request",
    title,
    message,
    metadata: {
      organizationId: input.org.id,
      organizationName: input.org.name,
      requesterEmail: input.requesterEmail,
      requesterName: input.requesterName,
    },
  });

  await sendOrganizerRequestAdminEmail({
    email: adminUser.email,
    name: adminUser.name,
    requesterName: input.requesterName,
    requesterEmail: input.requesterEmail,
    organizationName: input.org.name,
    locale: input.locale,
  });
}
