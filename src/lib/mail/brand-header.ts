import type { Attachment } from "nodemailer/lib/mailer";
import { BRAND } from "@/lib/brand";
import { env } from "@/env";

/** URL absoluta para assets en correos (alojados en el dominio público). */
export function emailAssetUrl(assetPath: string) {
  const base = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  return `${base}${assetPath}`;
}

/**
 * Conserva adjuntos del correo (como PDFs de tickets o códigos QR) sin adjuntar
 * el logo de la marca como archivo descargable.
 */
export function appendEmailBrandLogoAttachment(
  attachments: Attachment | Attachment[] | undefined = [],
): Attachment[] {
  return Array.isArray(attachments) ? [...attachments] : attachments ? [attachments] : [];
}

/** Encabezado de marca alineado con BrandLogo de la app (logo público + nombre). */
export function renderEmailBrandHeader(orgName?: string) {
  const displayName = orgName?.trim() || BRAND.name;
  const logoSrc = emailAssetUrl(BRAND.logo.markLg);

  return `
    <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
      <tr>
        <td style="vertical-align: middle; padding-right: 12px;">
          <img
            src="${logoSrc}"
            alt="${displayName}"
            width="42"
            height="42"
            style="display: block; height: 42px; width: auto; border: 0; outline: none; text-decoration: none;"
          />
        </td>
        <td style="vertical-align: middle; text-align: left;">
          <span style="font-size: 22px; font-weight: 700; color: #3d2914; letter-spacing: -0.5px; display: block; font-family: 'Outfit', system-ui, sans-serif;">
            ${displayName}
          </span>
        </td>
      </tr>
    </table>
  `;
}

