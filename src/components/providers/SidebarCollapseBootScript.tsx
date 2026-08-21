import Script from "next/script";
import { SIDEBAR_COLLAPSE_BOOT_SCRIPT } from "@/lib/navigation/sidebar-collapse";

/**
 * Aplica el ancho del sidebar (colapsado/expandido) antes del primer paint.
 * Debe vivir en un Server Component / Script beforeInteractive — no en Client Components.
 */
export function SidebarCollapseBootScript() {
  return (
    <Script
      id="enquiva-sidebar-collapse-boot"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{ __html: SIDEBAR_COLLAPSE_BOOT_SCRIPT }}
    />
  );
}
