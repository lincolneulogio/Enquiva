import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { Toaster } from "sonner";
import { LocaleProvider } from "@/components/providers/LocaleProvider";
import { AppThemeProvider } from "@/components/providers/AppThemeProvider";
import { getLocale } from "@/lib/i18n/server";
import "./globals.css";
import "sweetalert2/dist/sweetalert2.min.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "FaithEvents — Plataforma de eventos comunitarios",
    template: "%s | FaithEvents",
  },
  description:
    "Gestiona y descubre eventos comunitarios y de fe con facilidad. Regístrate, conecta y crezcan juntos.",
  keywords: ["fe", "comunidad", "eventos", "iglesia", "adoración", "retiro"],
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
        <LocaleProvider initialLocale={locale}>
          <AppThemeProvider>
            {children}
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
          </AppThemeProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
