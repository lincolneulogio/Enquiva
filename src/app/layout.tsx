import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { Toaster } from "sonner";
import { LocaleProvider } from "@/components/providers/LocaleProvider";
import { AppThemeProvider } from "@/components/providers/AppThemeProvider";
import { ThemeInitScript } from "@/components/providers/ThemeInitScript";
import { PlatformBrandProvider } from "@/components/providers/PlatformBrandProvider";
import { AccentColorInitializer } from "@/components/dashboard/admin/AccentColorInitializer";
import { PlatformAnnouncementBannerHost } from "@/components/shared/PlatformAnnouncementBannerHost";
import { getPlatformBrand } from "@/lib/brand/platform-brand";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const brand = await getPlatformBrand();
  const defaultTitle = `${brand.name} — Plataforma de gestión de eventos`;

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
    title: {
      default: defaultTitle,
      template: `%s | ${brand.name}`,
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
      siteName: brand.name,
      title: defaultTitle,
      description:
        "Crea, gestiona y descubre eventos de todo tipo. Inscripciones, tickets QR, pagos y transporte en un solo lugar.",
      images: [{ url: "/images/og-image.png", width: 1200, height: 630, alt: brand.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: defaultTitle,
      description:
        "Crea, gestiona y descubre eventos de todo tipo. Inscripciones, tickets QR, pagos y transporte en un solo lugar.",
      images: ["/images/og-image.png"],
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const brand = await getPlatformBrand();

  return (
    <html lang={brand.defaultLocale} suppressHydrationWarning className={outfit.variable}>
      <head>
        <ThemeInitScript />
      </head>
      <body suppressHydrationWarning className="font-sans">
        <AccentColorInitializer platformDefault={brand.defaultAccentColor} />
        <PlatformBrandProvider brand={brand}>
          <LocaleProvider initialLocale={brand.defaultLocale}>
            <AppThemeProvider>
              <PlatformAnnouncementBannerHost />
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
        </PlatformBrandProvider>
      </body>
    </html>
  );
}
