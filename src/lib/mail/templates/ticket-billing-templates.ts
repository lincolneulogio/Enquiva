import { BRAND } from "@/lib/brand";
import { wrapInTemplate } from "./base-wrapper";

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
    
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.02); margin: 24px 0;">
      <tr>
        <td style="background: linear-gradient(135deg, #4b1ab5 0%, #7c3aed 100%); padding: 18px 24px; text-align: center;">
          <span style="font-size: 12px; font-weight: 800; color: #ffffff; text-transform: uppercase; letter-spacing: 2px; font-family: 'Outfit', sans-serif; display: block;">PASE DE ENTRADA DIGITAL</span>
        </td>
      </tr>
      <tr>
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
