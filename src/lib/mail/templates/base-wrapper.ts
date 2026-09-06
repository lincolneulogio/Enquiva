import { BRAND } from "@/lib/brand";
import { renderEmailBrandHeader } from "../brand-header";
import {
  copyrightFooter,
  defaultFooterNote,
  type MailLocale,
} from "../locale-strings";

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
