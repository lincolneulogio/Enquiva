export function getVerificationCodeTemplate(code: string, greeting: string) {
  return {
    subject: "Confirma tu cuenta con el código de 6 dígitos",
    text: `${greeting}\n\nTu código de confirmación es: ${code}\n\nEste código expira en 15 minutos. Si no lo solicitaste, ignora este mensaje.`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
        <p>${greeting}</p>
        <p>Tu código de confirmación es:</p>
        <div style="font-size:32px;letter-spacing:6px;font-weight:700;padding:18px 24px;background:#f3f4f6;border-radius:14px;display:inline-block">${code}</div>
        <p style="margin-top:20px">Este código expira en 15 minutos. Si no lo solicitaste, ignora este mensaje.</p>
      </div>
    `,
  };
}

export function getPasswordChangedTemplate(greeting: string) {
  return {
    subject: "Tu contraseña ha sido actualizada",
    text: `${greeting}\n\nTe confirmamos que tu contraseña fue actualizada correctamente.\n\nSi no realizaste este cambio, contacta al soporte de inmediato.`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
        <p>${greeting}</p>
        <p>Te confirmamos que tu contraseña fue <strong>actualizada correctamente</strong>.</p>
        <p style="margin-top:16px;padding:12px 16px;background:#fef2f2;border-radius:10px;font-size:13px;color:#991b1b">
          ⚠ Si no realizaste este cambio, contacta al soporte de inmediato.
        </p>
      </div>
    `,
  };
}

export function getPasswordResetTemplate(url: string, greeting: string) {
  return {
    subject: "Restablece tu contraseña",
    text: `${greeting}\n\nRecibimos una solicitud para restablecer tu contraseña. Abre este enlace: ${url}\n\nSi no lo solicitaste, ignora este mensaje.`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
        <p>${greeting}</p>
        <p>Recibimos una solicitud para restablecer tu contraseña.</p>
        <p><a href="${url}">Restablecer contraseña</a></p>
        <p style="margin-top:20px">Si no lo solicitaste, ignora este mensaje.</p>
      </div>
    `,
  };
}

export function getTicketTemplate(opts: {
  eventTitle: string;
  code?: string;
  qrDataUrl?: string;
  ticketUrl: string;
  greeting: string;
}) {
  const qrHtml = opts.qrDataUrl
    ? `<div style="margin:12px 0"><img src="${opts.qrDataUrl}" alt="QR" style="width:220px;height:220px;border-radius:12px"/></div>`
    : "";

  return {
    subject: `Tu ticket para ${opts.eventTitle}`,
    text: `${opts.greeting}\n\nAdjuntamos tu ticket para: ${opts.eventTitle}\n\nAccede: ${opts.ticketUrl}`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
        <p>${opts.greeting}</p>
        <p>Adjuntamos tu ticket para: <strong>${opts.eventTitle}</strong></p>
        ${qrHtml}
        <p>Código del ticket: <strong>${opts.code ?? "-"}</strong></p>
        <p><a href="${opts.ticketUrl}">Ver ticket online</a></p>
      </div>
    `,
  };
}
