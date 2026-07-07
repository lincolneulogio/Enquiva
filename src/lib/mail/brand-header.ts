import { readFileSync } from "fs";
import path from "path";
import { BRAND } from "@/lib/brand";
import { env } from "@/env";

export const EMAIL_BRAND_LOGO_CID = "eventia-brand-logo";

/** URL absoluta para assets en correos (fallback si no hay adjunto CID). */
export function emailAssetUrl(assetPath: string) {
  const base = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  return `${base}${assetPath}`;
}

let cachedLogoAttachment: {
  filename: string;
  content: Buffer;
  cid: string;
} | null | undefined;

/** Adjunto inline del logo para clientes de correo (no depende de URL pública). */
export function getEmailBrandLogoAttachment() {
  if (cachedLogoAttachment !== undefined) return cachedLogoAttachment;

  try {
    const relativePath = BRAND.logo.markLg.replace(/^\//, "");
    const filePath = path.join(process.cwd(), "public", relativePath);
    cachedLogoAttachment = {
      filename: path.basename(filePath),
      content: readFileSync(filePath),
      cid: EMAIL_BRAND_LOGO_CID,
    };
  } catch (error) {
    console.error("[mail] No se pudo cargar el logo para correos:", error);
    cachedLogoAttachment = null;
  }

  return cachedLogoAttachment;
}

type EmailAttachment = {
  filename?: string;
  content?: Buffer | string;
  cid?: string;
};

export function appendEmailBrandLogoAttachment(
  attachments: EmailAttachment | EmailAttachment[] | undefined = [],
) {
  const list = Array.isArray(attachments) ? attachments : attachments ? [attachments] : [];
  const logo = getEmailBrandLogoAttachment();
  if (!logo) return list;

  const hasLogo = list.some((attachment) => attachment.cid === EMAIL_BRAND_LOGO_CID);

  return hasLogo ? list : [...list, logo];
}

/** Encabezado de marca alineado con BrandLogo de la app (logo + nombre). */
export function renderEmailBrandHeader() {
  const logoAttachment = getEmailBrandLogoAttachment();
  const logoSrc = logoAttachment ? `cid:${EMAIL_BRAND_LOGO_CID}` : emailAssetUrl(BRAND.logo.markLg);

  return `
    <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
      <tr>
        <td style="vertical-align: middle; padding-right: 12px;">
          <img
            src="${logoSrc}"
            alt="${BRAND.name}"
            width="42"
            height="42"
            style="display: block; height: 42px; width: auto; border: 0; outline: none; text-decoration: none;"
          />
        </td>
        <td style="vertical-align: middle; text-align: left;">
          <span style="font-size: 22px; font-weight: 700; color: #3d2914; letter-spacing: -0.5px; display: block; font-family: 'Outfit', system-ui, sans-serif;">
            ${BRAND.name}
          </span>
        </td>
      </tr>
    </table>
  `;
}
