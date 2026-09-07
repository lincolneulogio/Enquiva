import type { SendMailOptions } from "nodemailer";
import type { ResolvedMailConfig } from "./transporter";
import { appendEmailBrandLogoAttachment } from "./brand-header";

export function isResendConfig(config: ResolvedMailConfig): boolean {
  if (!config) return false;
  const host = (config.host || "").toLowerCase();
  const pass = (config.pass || "").trim();
  const user = (config.user || "").toLowerCase().trim();
  return host.includes("resend") || pass.startsWith("re_") || user === "resend";
}

export async function verifyResendApiKey(apiKey: string): Promise<{ ok: boolean; error?: string }> {
  const cleanKey = apiKey.trim();
  if (!cleanKey) {
    return { ok: false, error: "La API Key de Resend está vacía." };
  }

  try {
    const res = await fetch("https://api.resend.com/api-keys", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${cleanKey}`,
      },
      signal: AbortSignal.timeout(8000),
    });

    if (res.ok) {
      return { ok: true };
    }

    if (res.status === 401 || res.status === 403) {
      return {
        ok: false,
        error: "API Key de Resend inválida o sin permisos de envío (Error 401/403).",
      };
    }

    const data = await res.json().catch(() => ({}));
    const message = (data as { message?: string })?.message || `Error ${res.status} al validar con Resend.`;
    return { ok: false, error: message };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Timeout o error de conexión al conectar con Resend API.",
    };
  }
}

export async function sendMailViaResendApi(
  config: ResolvedMailConfig,
  options: SendMailOptions,
): Promise<{ id: string }> {
  const apiKey = config.pass.trim();
  if (!apiKey) {
    throw new Error("No se proporcionó API Key de Resend.");
  }

  const from =
    typeof options.from === "string"
      ? options.from
      : options.from && typeof options.from === "object" && "address" in options.from
        ? `"${options.from.name || config.fromName}" <${options.from.address}>`
        : `"${config.fromName}" <${config.fromEmail}>`;

  const toList: string[] = [];
  if (typeof options.to === "string") {
    toList.push(...options.to.split(",").map((s) => s.trim()).filter(Boolean));
  } else if (Array.isArray(options.to)) {
    for (const item of options.to) {
      if (typeof item === "string") toList.push(item);
      else if (item && typeof item === "object" && "address" in item) toList.push(item.address);
    }
  }

  const allAttachments = appendEmailBrandLogoAttachment(options.attachments ?? []);
  const formattedAttachments = allAttachments.map((att) => {
    let contentBase64 = "";
    if (Buffer.isBuffer(att.content)) {
      contentBase64 = att.content.toString("base64");
    } else if (typeof att.content === "string") {
      contentBase64 = att.content.startsWith("data:")
        ? att.content.replace(/^data:[^;]+;base64,/, "")
        : Buffer.from(att.content).toString("base64");
    }

    return {
      filename: att.filename || "attachment",
      content: contentBase64,
      cid: att.cid,
    };
  });

  const payload: Record<string, unknown> = {
    from,
    to: toList,
    subject: options.subject || "",
    html: options.html ? String(options.html) : undefined,
    text: options.text ? String(options.text) : undefined,
  };

  if (formattedAttachments.length > 0) {
    payload.attachments = formattedAttachments;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(12000),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg =
      (data as { message?: string })?.message ||
      (data as { name?: string })?.name ||
      `Error HTTP ${response.status} al enviar correo con Resend.`;
    throw new Error(errorMsg);
  }

  return data as { id: string };
}
