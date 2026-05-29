import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { Toaster } from "sonner";
import { LocaleProvider } from "@/components/providers/LocaleProvider";
import { AppThemeProvider } from "@/components/providers/AppThemeProvider";
import { AOSProvider } from "@/components/providers/AOSProvider";
import { LenisProvider } from "@/components/providers/LenisProvider";
import { getLocale } from "@/lib/i18n/server";
import { AccentColorInitializer } from "@/components/dashboard/admin/AccentColorInitializer";
import { AICopilot } from "@/components/dashboard/IACopilot/AICopilot";
import "./globals.css";
import "aos/dist/aos.css";
import "lenis/dist/lenis.css";
import "sweetalert2/dist/sweetalert2.min.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Encuentro de Fe — Plataforma de eventos cristianos",
    template: "%s | Encuentro de Fe",
  },
  description:
    "Gestiona y descubre eventos cristianos con facilidad. Regístrate, conecta y crezcan juntos.",
  keywords: ["fe", "comunidad", "eventos", "iglesia", "adoración", "retiro"],
  manifest: "/manifest.json",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();

  return (
    <html lang={locale} suppressHydrationWarning className={outfit.variable}>
      <body suppressHydrationWarning className="font-sans">
        <AccentColorInitializer />
        <LocaleProvider initialLocale={locale}>
          <AppThemeProvider>
            <LenisProvider>
              <AOSProvider>
                {children}
                <AICopilot />
                <Toaster
                  position="bottom-right"
                  richColors
                  expand
                  toastOptions={{
                    style: {
                      fontFamily: "var(--font-outfit), sans-serif",
                    },
                  }}
                />
              </AOSProvider>
            </LenisProvider>
          </AppThemeProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
