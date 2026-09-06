import { getSystemSettings } from "@/lib/settings";
import { env } from "@/env";
import { mailGreeting, type MailLocale } from "./locale-strings";
import {
  getOrganizerRequestAdminEmailTemplate,
  getOrganizerApprovedEmailTemplate,
  getOrganizerRejectedEmailTemplate,
} from "./templates";
import { safeSendMail, fromAddress } from "./safe-send";

export async function sendOrganizerRequestAdminEmail(input: {
  email: string;
  name?: string | null;
  requesterName: string;
  requesterEmail: string;
  organizationName: string;
  locale?: MailLocale;
}) {
  const { organizationName } = await getSystemSettings();
  const locale = input.locale ?? "es";
  const greeting = mailGreeting(locale, input.name);
  const teamUrl = new URL("/admin/team", env.NEXT_PUBLIC_APP_URL).toString();
  const { subject, text, html } = getOrganizerRequestAdminEmailTemplate({
    greeting,
    requesterName: input.requesterName,
    requesterEmail: input.requesterEmail,
    organizationName: input.organizationName,
    teamUrl,
    orgName: organizationName,
    locale,
  });

  await safeSendMail({
    from: await fromAddress(),
    to: input.email,
    subject,
    text,
    html,
  });
}

export async function sendOrganizerApprovedEmail(input: {
  email: string;
  name?: string | null;
  organizationName: string;
  locale?: MailLocale;
}) {
  const { organizationName } = await getSystemSettings();
  const locale = input.locale ?? "es";
  const greeting = mailGreeting(locale, input.name);
  const loginUrl = new URL("/login", env.NEXT_PUBLIC_APP_URL).toString();
  const { subject, text, html } = getOrganizerApprovedEmailTemplate({
    greeting,
    organizationName: input.organizationName,
    loginUrl,
    orgName: organizationName,
    locale,
  });

  await safeSendMail({
    from: await fromAddress(),
    to: input.email,
    subject,
    text,
    html,
  });
}

export async function sendOrganizerRejectedEmail(input: {
  email: string;
  name?: string | null;
  organizationName: string;
  locale?: MailLocale;
}) {
  const { organizationName } = await getSystemSettings();
  const locale = input.locale ?? "es";
  const greeting = mailGreeting(locale, input.name);
  const { subject, text, html } = getOrganizerRejectedEmailTemplate({
    greeting,
    organizationName: input.organizationName,
    orgName: organizationName,
    locale,
  });

  await safeSendMail({
    from: await fromAddress(),
    to: input.email,
    subject,
    text,
    html,
  });
}
