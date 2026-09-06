import type { SendMailOptions } from "nodemailer";
import { getMailTransporter, getMailSender, resolveMailConfig } from "./transporter";
import { isResendConfig, sendMailViaResendApi } from "./resend-sender";
import { appendEmailBrandLogoAttachment } from "./brand-header";

export async function safeSendMail(options: SendMailOptions) {
  try {
    const config = await resolveMailConfig();
    if (isResendConfig(config)) {
      try {
        const res = await sendMailViaResendApi(config, options);
        return res;
      } catch (apiError) {
        console.warn(`[Resend API Warning] Failed to send via HTTP API, trying SMTP fallback:`, apiError);
      }
    }

    const transporter = await getMailTransporter();
    return await transporter.sendMail({
      ...options,
      attachments: appendEmailBrandLogoAttachment(options.attachments ?? []),
    });
  } catch (error) {
    console.error(`[Mail Error] Failed to send email to ${options.to}:`, error);
    return null;
  }
}

export async function fromAddress() {
  return getMailSender();
}
