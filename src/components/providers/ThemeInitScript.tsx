import Script from "next/script";
import { THEME_COOKIE_NAME, THEME_STORAGE_KEY } from "@/lib/theme/cookie";
import {
  ACCENT_CSS_BY_MODE,
  ACCENT_OVERRIDE_KEY,
  ACCENT_STORAGE_KEY,
  DEFAULT_ACCENT_COLOR,
  isAccentColor,
} from "@/lib/brand/accent";

type ThemeInitScriptProps = {
  platformDefaultAccent?: string;
};

/**
 * Aplica light/dark y tokens de acento antes del primer paint.
 * Evita flash ámbar en cards cuando el usuario eligió otro acento.
 */
export function ThemeInitScript({
  platformDefaultAccent = DEFAULT_ACCENT_COLOR,
}: ThemeInitScriptProps) {
  const platform = isAccentColor(platformDefaultAccent)
    ? platformDefaultAccent
    : DEFAULT_ACCENT_COLOR;
  const palettes = JSON.stringify(ACCENT_CSS_BY_MODE);

  const js = `(function(){try{var c="${THEME_COOKIE_NAME}";var s="${THEME_STORAGE_KEY}";var m=document.cookie.match(new RegExp("(?:^|;\\\\s*)"+c+"=([^;]*)"));var t=m?decodeURIComponent(m[1]):null;if(t!=="dark"&&t!=="light"){try{t=localStorage.getItem(s);}catch(e){t=null;}}var d=t==="dark";var r=document.documentElement;r.classList.toggle("dark",d);r.style.colorScheme=d?"dark":"light";var palettes=${palettes};var platform=${JSON.stringify(platform)};var override=null;var saved=null;try{override=localStorage.getItem("${ACCENT_OVERRIDE_KEY}");saved=localStorage.getItem("${ACCENT_STORAGE_KEY}");}catch(e){}var accent=(override==="1"&&palettes[saved])?saved:(palettes[platform]?platform:"amber");var vars=palettes[accent][d?"dark":"light"];r.dataset.accent=accent;for(var k in vars){r.style.setProperty(k,vars[k]);}}catch(e){}})();`;

  return (
    <Script
      id="enquiva-theme-init"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{ __html: js }}
    />
  );
}
