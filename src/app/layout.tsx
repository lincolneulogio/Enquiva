import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { Toaster } from "sonner";
import { LocaleProvider } from "@/components/providers/LocaleProvider";
import { AppThemeProvider } from "@/components/providers/AppThemeProvider";
import { AOSProvider } from "@/components/providers/AOSProvider";
import { LenisProvider } from "@/components/providers/LenisProvider";
import { getLocale } from "@/lib/i18n/server";
import { AccentColorInitializer } from "@/components/dashboard/admin/AccentColorInitializer";
import { BRAND } from "@/lib/brand";
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
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "Eventia — Plataforma de gestión de eventos",
    template: "%s | Eventia",
  },
  description:
    "Crea, gestiona y descubre eventos de todo tipo. Inscripciones, tickets QR, pagos y transporte en un solo lugar.",
  keywords: ["eventos", "gestión", "tickets", "inscripciones", "organizadores", "comunidad"],
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/images/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/images/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/images/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    locale: "es_PE",
    siteName: BRAND.name,
    title: "Eventia — Plataforma de gestión de eventos",
    description:
      "Crea, gestiona y descubre eventos de todo tipo. Inscripciones, tickets QR, pagos y transporte en un solo lugar.",
    images: [{ url: "/images/og-image.png", width: 1200, height: 630, alt: "Eventia" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Eventia — Plataforma de gestión de eventos",
    description:
      "Crea, gestiona y descubre eventos de todo tipo. Inscripciones, tickets QR, pagos y transporte en un solo lugar.",
    images: ["/images/og-image.png"],
  },
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
