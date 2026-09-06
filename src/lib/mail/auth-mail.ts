import { getSystemSettings } from "@/lib/settings";
import { env } from "@/env";
import { mailGreeting, welcomeLoginPath, type MailLocale, type WelcomeAccountType } from "./locale-strings";
import {
  getVerificationCodeTemplate,
  getWelcomeEmailTemplate,
  getPasswordChangedTemplate,
  getPasswordResetTemplate,
} from "./templates";
import { safeSendMail, fromAddress } from "./safe-send";

export async function sendVerificationCodeEmail(input: {
  email: string;
  name?: string | null;
  code: string;
  locale?: MailLocale;
}) {
  const { organizationName } = await getSystemSettings();
  const locale = input.locale ?? "es";
  const greeting = mailGreeting(locale, input.name);
  const { subject, text, html } = getVerificationCodeTemplate(
    input.code,
    greeting,
    organizationName,
    locale,
  );

  await safeSendMail({
    from: await fromAddress(),
    to: input.email,
    subject,
    text,
    html,
  });
}

export async function sendWelcomeEmail(input: {
  email: string;
  name?: string | null;
  accountType: WelcomeAccountType;
  locale?: MailLocale;
}) {
  const { organizationName, supportEmail } = await getSystemSettings();
  const locale = input.locale ?? "es";
  const greeting = mailGreeting(locale, input.name);
  const loginPath = welcomeLoginPath(input.accountType);
  const loginUrl = new URL(loginPath, env.NEXT_PUBLIC_APP_URL).toString();
  const { subject, text, html } = getWelcomeEmailTemplate({
    greeting,
    accountType: input.accountType,
    loginUrl,
    orgName: organizationName,
    supportEmail,
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

export async function sendPasswordChangedEmail(input: {
  email: string;
  name?: string | null;
}) {
  const { organizationName } = await getSystemSettings();
  const greeting = input.name ? `Hola ${input.name},` : "Hola,";
  const { subject, text, html } = getPasswordChangedTemplate(greeting, organizationName);

  await safeSendMail({
    from: await fromAddress(),
    to: input.email,
    subject,
    text,
    html,
  });
}

export async function sendPasswordResetEmail(input: {
  email: string;
  name?: string | null;
  url: string;
}) {
  const { organizationName } = await getSystemSettings();
  const greeting = input.name ? `Hola ${input.name},` : "Hola,";
  const { subject, text, html } = getPasswordResetTemplate(input.url, greeting, organizationName);

  await safeSendMail({
    from: await fromAddress(),
    to: input.email,
    subject,
    text,
    html,
  });
}
