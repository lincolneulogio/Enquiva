import { BRAND } from "@/lib/brand";
import { env } from "@/env";

/** URL absoluta para assets en correos (clientes SMTP requieren URL completa). */
export function emailAssetUrl(assetPath: string) {
  const base = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  return `${base}${assetPath}`;
}

/** Encabezado de marca alineado con BrandLogo de la app (logo + nombre). */
export function renderEmailBrandHeader() {
  const logoSrc = emailAssetUrl(BRAND.logo.markLg);

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
