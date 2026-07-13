import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, type Organization } from "@/lib/db/schema";
import { sendOrganizerRequestAdminEmail } from "@/lib/mail";
import type { MailLocale } from "@/lib/mail/locale-strings";
import { NotificationService, type NotificationPayload } from "@/lib/notifications/notification.service";
import { getSuperAdminUserIds } from "@/lib/notifications/notification-targets";

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
  const metadata = {
    organizationId: input.org.id,
    organizationName: input.org.name,
    requesterEmail: input.requesterEmail,
    requesterName: input.requesterName,
  };

  const payloads: NotificationPayload[] = [
    {
      userId: adminUser.id,
      type: "organizer_request",
      title,
      message,
      metadata,
    },
  ];

  const superAdminIds = await getSuperAdminUserIds({ requireAlert: "alertOrganizerRequests" });
  for (const userId of superAdminIds) {
    if (userId === adminUser.id) continue;
    payloads.push({
      userId,
      type: "organizer_request",
      title,
      message,
      metadata,
    });
  }

  await NotificationService.createMany(payloads);

  await sendOrganizerRequestAdminEmail({
    email: adminUser.email,
    name: adminUser.name,
    requesterName: input.requesterName,
    requesterEmail: input.requesterEmail,
    organizationName: input.org.name,
    locale: input.locale,
  });
}
