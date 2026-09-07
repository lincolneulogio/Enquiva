"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { contactRatelimit } from "@/lib/redis";
import { getMailTransporter, getMailSender, resolveMailConfig } from "@/lib/mail/transporter";
import { isResendConfig, sendMailViaResendApi } from "@/lib/mail/resend-sender";
import { BRAND } from "@/lib/brand";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Ingresa tu nombre.").max(120),
  email: z.string().email("Ingresa un correo electrónico válido.").max(200),
  subject: z.string().trim().min(3, "Ingresa un asunto.").max(160),
  message: z.string().trim().min(10, "El mensaje debe tener al menos 10 caracteres.").max(4000),
});

export type ContactResult = {
  success: boolean;
  message: string;
  error?: string;
};

export async function submitContactAction(
  _prevState: unknown,
  formData: FormData,
): Promise<ContactResult> {
  try {
    const parsed = contactSchema.safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      subject: formData.get("subject"),
      message: formData.get("message"),
    });

    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message ?? "Revisa los campos del formulario.",
      };
    }

    // Protección anti-spam básica por IP (5 intentos / 10 min).
    try {
      const headerList = await headers();
      const ip =
        headerList.get("x-forwarded-for")?.split(",")[0].trim() ||
        headerList.get("x-real-ip") ||
        "unknown";
      const limited = await contactRatelimit.limit(ip);
      if (!limited.success) {
        return {
          success: false,
          message:
            "Has enviado demasiados mensajes. Espera unos minutos e inténtalo de nuevo.",
        };
      }
    } catch {
      // Si el rate limiter no está disponible, no bloqueamos el envío.
    }

    const config = await resolveMailConfig();
    const sender = await getMailSender();

    const html = `
      <div style="font-family: 'Outfit', sans-serif; color: #334155; max-width: 560px; margin: 0 auto; padding: 24px;">
        <h2 style="margin: 0 0 16px; font-size: 18px; color: #1e1b4b;">Nuevo mensaje desde el formulario de contacto</h2>
        <table cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 8px 0; color: #64748b; width: 110px;"><strong>Nombre</strong></td>
            <td style="padding: 8px 0;">${escapeHtml(parsed.data.name)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b;"><strong>Correo</strong></td>
            <td style="padding: 8px 0;">${escapeHtml(parsed.data.email)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b;"><strong>Asunto</strong></td>
            <td style="padding: 8px 0;">${escapeHtml(parsed.data.subject)}</td>
          </tr>
        </table>
        <hr style="margin: 16px 0; border: none; border-top: 1px solid #e2e8f0;" />
        <p style="margin: 0; font-size: 14px; line-height: 1.7; white-space: pre-wrap;">${escapeHtml(
          parsed.data.message,
        )}</p>
      </div>
    `;

    const mailOptions = {
      from: sender,
      to: BRAND.contactEmail,
      replyTo: parsed.data.email,
      subject: `[Contacto] ${parsed.data.subject}`,
      html,
    };

    if (isResendConfig(config)) {
      await sendMailViaResendApi(config, mailOptions);
    } else {
      const transporter = await getMailTransporter();
      await transporter.sendMail(mailOptions);
    }

    return {
      success: true,
      message: "¡Gracias por escribirnos! Hemos recibido tu mensaje y te responderemos pronto.",
    };
  } catch (error) {
    console.error("[contact] Error sending contact message:", error);
    return {
      success: false,
      message: "Ocurrió un error al enviar tu mensaje. Intenta nuevamente.",
    };
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
