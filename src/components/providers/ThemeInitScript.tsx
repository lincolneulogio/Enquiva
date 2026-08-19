import Script from "next/script";
import { THEME_COOKIE_NAME, THEME_STORAGE_KEY } from "@/lib/theme/cookie";

/**
 * Aplica light/dark antes del primer paint, sin cookies() en el RSC del layout.
 * Evita que toda la app se vuelva dinámica por el tema.
 */
export function ThemeInitScript() {
  const js = `(function(){try{var c="${THEME_COOKIE_NAME}";var s="${THEME_STORAGE_KEY}";var m=document.cookie.match(new RegExp("(?:^|;\\\\s*)"+c+"=([^;]*)"));var t=m?decodeURIComponent(m[1]):null;if(t!=="dark"&&t!=="light"){try{t=localStorage.getItem(s);}catch(e){t=null;}}var d=t==="dark";document.documentElement.classList.toggle("dark",d);document.documentElement.style.colorScheme=d?"dark":"light";}catch(e){}})();`;

  return (
    <Script
      id="enquiva-theme-init"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{ __html: js }}
    />
  );
}
