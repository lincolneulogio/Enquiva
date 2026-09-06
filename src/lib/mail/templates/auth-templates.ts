import { BRAND } from "@/lib/brand";
import { type MailLocale } from "../locale-strings";
import { wrapInTemplate } from "./base-wrapper";

export function getVerificationCodeTemplate(
  code: string,
  greeting: string,
  orgName?: string,
  locale: MailLocale = "es",
) {
  const title = locale === "en" ? "Verify your account" : "Verifica tu cuenta";
  const bodyHtml =
    locale === "en"
      ? `
    <p style="margin: 0 0 20px 0; font-size: 15px; color: #475569; line-height: 1.6; font-family: 'Outfit', sans-serif;">
      You requested a verification code to confirm your email. Enter this 6-digit code in the app:
    </p>
    <div style="text-align: center; margin: 36px 0;">
      <div style="font-size: 38px; letter-spacing: 8px; font-weight: 800; padding: 22px 32px; background: linear-gradient(135deg, #faf5ff 0%, #f5f3ff 100%); border: 2px dashed rgba(75, 26, 181, 0.2); border-radius: 20px; display: inline-block; color: #4b1ab5; font-family: 'Outfit', sans-serif; box-shadow: 0 8px 20px -6px rgba(75, 26, 181, 0.15);">
        ${code}
      </div>
    </div>
    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 16px; padding: 16px; margin-top: 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.01);">
      <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="vertical-align: top; width: 24px; font-size: 16px;">⏱</td>
          <td style="padding-left: 8px; font-size: 13px; color: #166534; line-height: 1.5; font-weight: 600; font-family: 'Outfit', sans-serif;">
            This code expires in 15 minutes for security. Do not share it with anyone.
          </td>
        </tr>
      </table>
    </div>
  `
      : `
    <p style="margin: 0 0 20px 0; font-size: 15px; color: #475569; line-height: 1.6; font-family: 'Outfit', sans-serif;">
      Has solicitado un código de verificación para confirmar tu correo electrónico. Por favor, ingresa el siguiente código de 6 dígitos en la aplicación:
    </p>
    <div style="text-align: center; margin: 36px 0;">
      <div style="font-size: 38px; letter-spacing: 8px; font-weight: 800; padding: 22px 32px; background: linear-gradient(135deg, #faf5ff 0%, #f5f3ff 100%); border: 2px dashed rgba(75, 26, 181, 0.2); border-radius: 20px; display: inline-block; color: #4b1ab5; font-family: 'Outfit', sans-serif; box-shadow: 0 8px 20px -6px rgba(75, 26, 181, 0.15);">
        ${code}
      </div>
    </div>
    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 16px; padding: 16px; margin-top: 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.01);">
      <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="vertical-align: top; width: 24px; font-size: 16px;">⏱</td>
          <td style="padding-left: 8px; font-size: 13px; color: #166534; line-height: 1.5; font-weight: 600; font-family: 'Outfit', sans-serif;">
            Este código expira en 15 minutos por razones de seguridad. No lo compartas con nadie.
          </td>
        </tr>
      </table>
    </div>
  `;
  const footerNote =
    locale === "en"
      ? "If you did not request this registration, you can safely ignore this email."
      : "Si no has solicitado este registro, puedes ignorar este correo de forma segura.";

  return {
    subject:
      locale === "en"
        ? "Confirm your account with your verification code"
        : "Confirma tu cuenta con tu código de verificación",
    text:
      locale === "en"
        ? `${greeting}\n\nYour confirmation code is: ${code}\n\nThis code expires in 15 minutes. If you did not request it, ignore this message.`
        : `${greeting}\n\nTu código de confirmación es: ${code}\n\nEste código expira en 15 minutos. Si no lo solicitaste, ignora este mensaje.`,
    html: wrapInTemplate(title, greeting, bodyHtml, footerNote, orgName, locale),
  };
}

export function getPasswordChangedTemplate(greeting: string, orgName?: string) {
  const title = "Contraseña actualizada";
  const finalOrgName = orgName ?? BRAND.name;
  const bodyHtml = `
    <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 1px solid #bbf7d0; border-radius: 20px; padding: 24px; text-align: center; margin: 8px 0 24px 0; box-shadow: 0 4px 10px rgba(22, 101, 52, 0.05);">
      <div style="background-color: #22c55e; width: 44px; height: 44px; border-radius: 50%; display: inline-block; text-align: center; line-height: 44px; margin-bottom: 12px; box-shadow: 0 4px 10px rgba(34, 197, 94, 0.3);">
        <span style="font-size: 20px; color: #ffffff; font-weight: bold;">✓</span>
      </div>
      <p style="margin: 0; font-size: 16px; font-weight: 700; color: #14532d; font-family: 'Outfit', sans-serif;">
        ¡Tu contraseña ha sido actualizada con éxito!
      </p>
    </div>
    <p style="margin: 0 0 24px 0; font-size: 15px; color: #475569; line-height: 1.6; font-family: 'Outfit', sans-serif;">
      Te confirmamos que la contraseña asociada a tu cuenta en <strong>${finalOrgName}</strong> fue modificada correctamente y ya está activa para tu próximo inicio de sesión.
    </p>
    <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 16px; padding: 18px; margin-top: 16px;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="vertical-align: top; width: 24px; font-size: 16px;">⚠️</td>
          <td style="padding-left: 8px; font-size: 13px; color: #991b1b; line-height: 1.6; font-weight: 600; font-family: 'Outfit', sans-serif;">
            <strong>¿No fuiste tú?</strong> Si no realizaste este cambio, tu cuenta podría estar en riesgo. Por favor, ponte en contacto con nuestro equipo de soporte técnico de inmediato para bloquearla y proteger tu información.
          </td>
        </tr>
      </table>
    </div>
  `;
  const footerNote = "Esta es una notificación de seguridad automática. Por favor no la respondas.";

  return {
    subject: "Tu contraseña ha sido actualizada",
    text: `${greeting}\n\nTe confirmamos que tu contraseña fue actualizada correctamente.\n\nSi no realizaste este cambio, contacta al soporte de inmediato.`,
    html: wrapInTemplate(title, greeting, bodyHtml, footerNote, orgName),
  };
}

export function getPasswordResetTemplate(url: string, greeting: string, orgName?: string) {
  const title = "Restablecer tu contraseña";
  const finalOrgName = orgName ?? BRAND.name;
  const bodyHtml = `
    <p style="margin: 0 0 20px 0; font-size: 15px; color: #475569; line-height: 1.6; font-family: 'Outfit', sans-serif;">
      Recibimos una solicitud para restablecer la contraseña de tu cuenta en <strong>${finalOrgName}</strong>. Haz clic en el botón de abajo para definir una nueva contraseña segura:
    </p>
    <div style="text-align: center; margin: 36px 0;">
      <a href="${url}" style="background: linear-gradient(135deg, #4b1ab5 0%, #7c3aed 100%); color: #ffffff; padding: 16px 36px; font-size: 16px; font-weight: 700; text-decoration: none; border-radius: 16px; display: inline-block; box-shadow: 0 10px 20px -5px rgba(75, 26, 181, 0.3); font-family: 'Outfit', sans-serif;">
        Restablecer Contraseña
      </a>
    </div>
    <div style="background-color: #faf9ff; border: 1px solid #eef2f6; border-radius: 16px; padding: 18px; margin-top: 24px;">
      <p style="margin: 0 0 8px 0; font-size: 12px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; font-family: 'Outfit', sans-serif;">Si el botón no funciona, copia este enlace:</p>
      <p style="margin: 0; font-size: 13px; color: #4b1ab5; word-break: break-all; line-height: 1.5; font-family: 'Outfit', sans-serif;">
        <a href="${url}" style="color: #4b1ab5; text-decoration: none; font-weight: 600;">${url}</a>
      </p>
    </div>
  `;
  const footerNote = "Si tú no has solicitado restablecer tu contraseña, puedes ignorar este correo de forma segura; tu contraseña seguirá siendo la misma.";

  return {
    subject: `Restablece tu contraseña de ${finalOrgName}`,
    text: `${greeting}\n\nRecibimos una solicitud para restablecer tu contraseña. Abre este enlace: ${url}\n\nSi no lo solicitaste, ignora este mensaje.`,
    html: wrapInTemplate(title, greeting, bodyHtml, footerNote, orgName),
  };
}
