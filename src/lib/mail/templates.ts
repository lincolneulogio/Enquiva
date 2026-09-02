import {
  broadcastFooterNote,
  copyrightFooter,
  customNotificationFooter,
  defaultFooterNote,
  mailGreeting,
  organizerApprovedEmailCopy,
  organizerRejectedEmailCopy,
  organizerRequestAdminEmailCopy,
  welcomeEmailCopy,
  type MailLocale,
  type WelcomeAccountType,
} from "./locale-strings";
import { BRAND } from "@/lib/brand";
import { renderEmailBrandHeader } from "./brand-header";

export function wrapInTemplate(
  title: string,
  greeting: string,
  bodyHtml: string,
  footerNote?: string,
  orgName?: string,
  locale: MailLocale = "es",
) {
  const finalOrgName = orgName ?? BRAND.name;
  const resolvedFooter = footerNote ?? defaultFooterNote(locale);
  const copyright = copyrightFooter(locale, finalOrgName);
  return `
    <!DOCTYPE html>
    <html lang="${locale}">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
      <style>
        @media only screen and (max-width: 600px) {
          .card-container {
            border-radius: 16px !important;
            margin: 10px !important;
            width: 95% !important;
          }
          .content-padding {
            padding: 32px 20px 28px 20px !important;
          }
          .header-padding {
            padding: 28px 20px !important;
          }
        }
      </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #faf9ff; font-family: 'Outfit', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #faf9ff; padding: 40px 10px; background-image: radial-gradient(circle at top right, rgba(75, 26, 181, 0.03), transparent 400px), radial-gradient(circle at bottom left, rgba(235, 46, 122, 0.03), transparent 400px);">
        <tr>
          <td align="center">
            <!-- Card Container -->
            <table border="0" cellpadding="0" cellspacing="0" width="100%" class="card-container" style="max-width: 520px; background-color: #ffffff; border-radius: 28px; overflow: hidden; box-shadow: 0 20px 40px -15px rgba(75, 26, 181, 0.08), 0 1px 3px rgba(75, 26, 181, 0.02); border: 1px solid rgba(75, 26, 181, 0.06);">
              
              <!-- Brand Header -->
              <tr>
                <td class="header-padding" style="background-color: #f5efe6; padding: 32px 32px; text-align: center; border-bottom: 1px solid rgba(61, 41, 20, 0.08);">
                  ${renderEmailBrandHeader(orgName)}
                </td>
              </tr>

              <!-- Main Content -->
              <tr>
                <td class="content-padding" style="padding: 44px 36px 36px 36px; background-color: #ffffff;">
                  <h2 style="margin: 0 0 20px 0; font-size: 22px; font-weight: 800; color: #1e1b4b; letter-spacing: -0.5px; line-height: 1.3; font-family: 'Outfit', sans-serif;">${title}</h2>
                  <p style="margin: 0 0 24px 0; font-size: 16px; font-weight: 500; color: #475569; line-height: 1.6; font-family: 'Outfit', sans-serif;">${greeting}</p>
                  
                  <!-- Dynamic Body Content -->
                  ${bodyHtml}
                  
                </td>
              </tr>

              <!-- Footer/Security Note -->
              <tr>
                <td style="padding: 0 36px 36px 36px; background-color: #ffffff;">
                  <div style="border-top: 1px solid #f1f5f9; padding-top: 24px;">
                    <p style="margin: 0; font-size: 13px; color: #64748b; line-height: 1.6; text-align: center; font-family: 'Outfit', sans-serif;">
                      ${resolvedFooter}
                    </p>
                    <p style="margin: 16px 0 0 0; font-size: 11px; color: #94a3b8; text-align: center; font-family: 'Outfit', sans-serif; letter-spacing: 0.5px; text-transform: uppercase;">
                      ${copyright}
                    </p>
                  </div>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

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

export function getTicketTemplate(opts: {
  eventTitle: string;
  code?: string;
  qrDataUrl?: string;
  ticketUrl: string;
  greeting: string;
  orgName?: string;
}) {
  const title = "¡Tu Entrada está Lista!";
  
  const qrHtml = opts.qrDataUrl
    ? `
      <div style="text-align: center; margin: 24px 0;">
        <div style="display: inline-block; padding: 16px; background-color: #ffffff; border: 1px solid rgba(75, 26, 181, 0.1); border-radius: 24px; box-shadow: 0 10px 25px -5px rgba(75, 26, 181, 0.05); text-align: center;">
          <img src="${opts.qrDataUrl.startsWith("data:image/") ? "cid:qrcode" : opts.qrDataUrl}" alt="Código QR de la Entrada" style="width: 190px; height: 190px; display: block; border-radius: 12px; margin: 0 auto;" />
          <span style="font-size: 11px; color: #94a3b8; font-family: 'Outfit', sans-serif; display: block; margin-top: 10px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase;">Escanea en la entrada</span>
        </div>
      </div>
    `
    : "";

  const bodyHtml = `
    <p style="margin: 0 0 20px 0; font-size: 15px; color: #475569; line-height: 1.6; font-family: 'Outfit', sans-serif;">
      ¡Tu inscripción ha sido confirmada con éxito! Tu pase de entrada digital para el evento ya está disponible:
    </p>
    
    <!-- Virtual Ticket Container -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.02); margin: 24px 0;">
      <tr>
        <!-- Ticket Header Banner -->
        <td style="background: linear-gradient(135deg, #4b1ab5 0%, #7c3aed 100%); padding: 18px 24px; text-align: center;">
          <span style="font-size: 12px; font-weight: 800; color: #ffffff; text-transform: uppercase; letter-spacing: 2px; font-family: 'Outfit', sans-serif; display: block;">PASE DE ENTRADA DIGITAL</span>
        </td>
      </tr>
      <tr>
        <!-- Ticket Info Body -->
        <td style="padding: 28px 24px; background-color: #fafcff;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td align="center">
                <span style="font-size: 11px; font-weight: 700; color: #8b5cf6; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 6px; font-family: 'Outfit', sans-serif;">Evento Confirmado</span>
                <span style="font-size: 20px; font-weight: 800; color: #1e1b4b; display: block; line-height: 1.4; font-family: 'Outfit', sans-serif; max-width: 320px; margin: 0 auto;">${opts.eventTitle}</span>
              </td>
            </tr>
            
            ${opts.code ? `
              <tr>
                <td style="padding-top: 20px; text-align: center;">
                  <!-- Perforation line inside card -->
                  <div style="border-top: 2px dashed #cbd5e1; height: 1px; margin: 0 0 20px 0;"></div>
                  
                  <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 6px; font-family: 'Outfit', sans-serif;">Código del Ticket</span>
                  <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 10px 20px; display: inline-block; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                    <span style="font-size: 20px; font-weight: 800; color: #4b1ab5; letter-spacing: 1.5px; font-family: 'Outfit', sans-serif;">${opts.code}</span>
                  </div>
                </td>
              </tr>
            ` : ""}
          </table>
          
          ${qrHtml}
        </td>
      </tr>
    </table>

    <div style="text-align: center; margin: 32px 0 16px 0;">
      <a href="${opts.ticketUrl}" style="background: linear-gradient(135deg, #4b1ab5 0%, #7c3aed 100%); color: #ffffff; padding: 16px 36px; font-size: 15px; font-weight: 700; text-decoration: none; border-radius: 16px; display: inline-block; box-shadow: 0 10px 20px -5px rgba(75, 26, 181, 0.3); font-family: 'Outfit', sans-serif;">
        Ver mi Ticket Online
      </a>
    </div>
  `;
  
  const footerNote = "Presenta este código QR en tu teléfono o impreso el día del ingreso al evento. ¡Disfruta la experiencia!";

  return {
    subject: `Tu ticket para ${opts.eventTitle}`,
    text: `${opts.greeting}\n\nAdjuntamos tu ticket para: ${opts.eventTitle}\n\nAccede: ${opts.ticketUrl}`,
    html: wrapInTemplate(title, opts.greeting, bodyHtml, footerNote, opts.orgName),
  };
}

export function getSubscriptionRenewalReminderTemplate(opts: {
  greeting: string;
  planName: string;
  daysRemaining: number;
  renewalDate: string;
  billingUrl: string;
  autoRenewEnabled: boolean;
  orgName?: string;
}) {
  const title = "Tu plan vence pronto";
  const autoRenewNote = opts.autoRenewEnabled
    ? "Tienes la <strong>renovación automática</strong> activada: intentaremos cobrar con tu tarjeta guardada en la fecha de vencimiento."
    : "Renueva manualmente desde tu panel para evitar perder funciones de pago.";

  const bodyHtml = `
    <p style="font-size: 15px; color: #334155; line-height: 1.6; margin-bottom: 20px; font-family: 'Outfit', sans-serif;">
      Tu plan <strong>${opts.planName}</strong> vence en <strong>${opts.daysRemaining} día(s)</strong> (${opts.renewalDate}).
    </p>
    <p style="font-size: 14px; color: #64748b; line-height: 1.6; margin-bottom: 24px; font-family: 'Outfit', sans-serif;">
      ${autoRenewNote}
    </p>
    <div style="text-align: center; margin: 28px 0;">
      <a href="${opts.billingUrl}" style="background: linear-gradient(135deg, #4b1ab5 0%, #7c3aed 100%); color: #ffffff; padding: 14px 32px; font-size: 15px; font-weight: 700; text-decoration: none; border-radius: 14px; display: inline-block; font-family: 'Outfit', sans-serif;">
        Ir a Mi plan
      </a>
    </div>
  `;

  return {
    subject: `${opts.planName} vence en ${opts.daysRemaining} día(s) — ${BRAND.name}`,
    text: `${opts.greeting}\n\nTu plan ${opts.planName} vence el ${opts.renewalDate} (${opts.daysRemaining} días).\n\nRenueva aquí: ${opts.billingUrl}`,
    html: wrapInTemplate(title, opts.greeting, bodyHtml, undefined, opts.orgName),
  };
}

export function getBroadcastEmailTemplate(opts: {
  subject: string;
  message: string;
  eventTitle: string;
  greeting: string;
  orgName?: string;
  locale?: MailLocale;
}) {
  const locale = opts.locale ?? "es";
  const bodyHtml = `
    <div style="font-size: 15px; color: #475569; line-height: 1.6; font-family: 'Outfit', sans-serif; white-space: pre-wrap;">
      ${opts.message}
    </div>
  `;
  const footerNote = broadcastFooterNote(locale, opts.eventTitle);
  const emailSubject =
    locale === "en"
      ? `[${opts.eventTitle}] ${opts.subject}`
      : `[${opts.eventTitle}] ${opts.subject}`;

  return {
    subject: emailSubject,
    text: `${opts.greeting}\n\n${opts.message}\n\n---\n${footerNote}`,
    html: wrapInTemplate(opts.subject, opts.greeting, bodyHtml, footerNote, opts.orgName, locale),
  };
}

export function getCustomNotificationEmailTemplate(opts: {
  subject: string;
  body: string;
  greeting: string;
  orgName?: string;
  locale?: MailLocale;
}) {
  const locale = opts.locale ?? "es";
  const bodyHtml = `
    <p style="font-size: 14px; white-space: pre-line; color: #475569; line-height: 1.6; font-family: 'Outfit', sans-serif;">
      ${opts.body}
    </p>
  `;
  const footerNote = customNotificationFooter(locale, opts.orgName ?? BRAND.name);

  return {
    subject: opts.subject,
    text: `${opts.greeting}\n\n${opts.body}`,
    html: wrapInTemplate(opts.subject, opts.greeting, bodyHtml, footerNote, opts.orgName, locale),
  };
}

export function getWelcomeEmailTemplate(opts: {
  greeting: string;
  accountType: WelcomeAccountType;
  loginUrl: string;
  orgName?: string;
  supportEmail?: string;
  locale?: MailLocale;
}) {
  const locale = opts.locale ?? "es";
  const copy = welcomeEmailCopy(locale, opts.accountType);
  const supportEmail = opts.supportEmail?.trim() || BRAND.supportEmail;

  const stepsHtml = copy.steps
    .map(
      (step, index) => `
        <tr>
          <td style="vertical-align: top; width: 28px; padding: 6px 0;">
            <div style="width: 24px; height: 24px; border-radius: 50%; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: #ffffff; font-size: 12px; font-weight: 700; line-height: 24px; text-align: center; font-family: 'Outfit', sans-serif;">
              ${index + 1}
            </div>
          </td>
          <td style="padding: 6px 0 6px 10px; font-size: 14px; color: #475569; line-height: 1.6; font-family: 'Outfit', sans-serif;">
            ${step}
          </td>
        </tr>
      `,
    )
    .join("");

  const bodyHtml = `
    <p style="margin: 0 0 20px 0; font-size: 15px; color: #475569; line-height: 1.6; font-family: 'Outfit', sans-serif;">
      ${copy.intro}
    </p>
    <div style="background-color: #fff7ed; border: 1px solid #fed7aa; border-radius: 20px; padding: 20px 22px; margin: 24px 0;">
      <p style="margin: 0 0 14px 0; font-size: 13px; font-weight: 700; color: #9a3412; text-transform: uppercase; letter-spacing: 0.5px; font-family: 'Outfit', sans-serif;">
        ${locale === "en" ? "Next steps" : "Próximos pasos"}
      </p>
      <table border="0" cellpadding="0" cellspacing="0" width="100%">
        ${stepsHtml}
      </table>
    </div>
    <div style="text-align: center; margin: 32px 0 8px 0;">
      <a href="${opts.loginUrl}" style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: #ffffff; padding: 16px 36px; font-size: 16px; font-weight: 700; text-decoration: none; border-radius: 16px; display: inline-block; box-shadow: 0 10px 20px -5px rgba(234, 88, 12, 0.3); font-family: 'Outfit', sans-serif;">
        ${copy.cta}
      </a>
    </div>
  `;

  const footerNote =
    locale === "en"
      ? `Need help? Write to us at <a href="mailto:${supportEmail}" style="color:#ea580c;text-decoration:none;">${supportEmail}</a>`
      : `¿Necesitas ayuda? Escríbenos a <a href="mailto:${supportEmail}" style="color:#ea580c;text-decoration:none;">${supportEmail}</a>`;

  const textSteps = copy.steps.map((step, i) => `${i + 1}. ${step}`).join("\n");

  return {
    subject: copy.subject,
    text: `${opts.greeting}\n\n${copy.intro}\n\n${locale === "en" ? "Next steps" : "Próximos pasos"}:\n${textSteps}\n\n${copy.cta}: ${opts.loginUrl}\n\n${locale === "en" ? "Need help?" : "¿Necesitas ayuda?"} ${supportEmail}`,
    html: wrapInTemplate(copy.title, opts.greeting, bodyHtml, footerNote, opts.orgName, locale),
  };
}

function organizerStatusEmailTemplate(opts: {
  greeting: string;
  subject: string;
  title: string;
  bodyHtml: string;
  cta?: string;
  ctaUrl?: string;
  orgName?: string;
  locale?: MailLocale;
}) {
  const locale = opts.locale ?? "es";
  const ctaBlock =
    opts.cta && opts.ctaUrl
      ? `<div style="text-align: center; margin: 32px 0 8px 0;">
      <a href="${opts.ctaUrl}" style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: #ffffff; padding: 16px 36px; font-size: 16px; font-weight: 700; text-decoration: none; border-radius: 16px; display: inline-block; box-shadow: 0 10px 20px -5px rgba(234, 88, 12, 0.3); font-family: 'Outfit', sans-serif;">
        ${opts.cta}
      </a>
    </div>`
      : "";

  const bodyHtml = `${opts.bodyHtml}${ctaBlock}`;

  return {
    subject: opts.subject,
    text: `${opts.greeting}\n\n${opts.bodyHtml.replace(/<[^>]+>/g, "")}`,
    html: wrapInTemplate(opts.title, opts.greeting, bodyHtml, defaultFooterNote(locale), opts.orgName, locale),
  };
}

export function getOrganizerRequestAdminEmailTemplate(opts: {
  greeting: string;
  requesterName: string;
  requesterEmail: string;
  organizationName: string;
  teamUrl: string;
  orgName?: string;
  locale?: MailLocale;
}) {
  const locale = opts.locale ?? "es";
  const copy = organizerRequestAdminEmailCopy(locale, {
    requesterName: opts.requesterName,
    requesterEmail: opts.requesterEmail,
    organizationName: opts.organizationName,
  });

  return organizerStatusEmailTemplate({
    greeting: opts.greeting,
    subject: copy.subject,
    title: copy.title,
    bodyHtml: `${copy.body}<p style="margin-top: 20px; font-size: 14px; color: #475569;">${locale === "en" ? "Open the Team page to review the request." : "Abre la página Equipo para revisar la solicitud."}</p>`,
    cta: locale === "en" ? "Review request" : "Revisar solicitud",
    ctaUrl: opts.teamUrl,
    orgName: opts.orgName,
    locale,
  });
}

export function getOrganizerApprovedEmailTemplate(opts: {
  greeting: string;
  organizationName: string;
  loginUrl: string;
  orgName?: string;
  locale?: MailLocale;
}) {
  const locale = opts.locale ?? "es";
  const copy = organizerApprovedEmailCopy(locale, { organizationName: opts.organizationName });

  return organizerStatusEmailTemplate({
    greeting: opts.greeting,
    subject: copy.subject,
    title: copy.title,
    bodyHtml: copy.body,
    cta: copy.cta,
    ctaUrl: opts.loginUrl,
    orgName: opts.orgName,
    locale,
  });
}

export function getOrganizerRejectedEmailTemplate(opts: {
  greeting: string;
  organizationName: string;
  orgName?: string;
  locale?: MailLocale;
}) {
  const locale = opts.locale ?? "es";
  const copy = organizerRejectedEmailCopy(locale, { organizationName: opts.organizationName });

  return organizerStatusEmailTemplate({
    greeting: opts.greeting,
    subject: copy.subject,
    title: copy.title,
    bodyHtml: copy.body,
    orgName: opts.orgName,
    locale,
  });
}
