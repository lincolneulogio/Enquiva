import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { Toaster } from "sonner";
import { LocaleProvider } from "@/components/providers/LocaleProvider";
import { AppThemeProvider } from "@/components/providers/AppThemeProvider";
import { ThemeInitScript } from "@/components/providers/ThemeInitScript";
import { SidebarCollapseBootScript } from "@/components/providers/SidebarCollapseBootScript";
import { PlatformBrandProvider } from "@/components/providers/PlatformBrandProvider";
import { AccentColorInitializer } from "@/components/dashboard/admin/AccentColorInitializer";
import { PlatformAnnouncementBannerHost } from "@/components/shared/PlatformAnnouncementBannerHost";
import { getPlatformBrand } from "@/lib/brand/platform-brand";
import {
  buildOrganizationSchema,
  buildSiteNavigationElementSchemas,
  buildWebSiteSchema,
} from "@/lib/seo/structured-data";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const brand = await getPlatformBrand();
  const defaultTitle = `${brand.name} — Eventos en Huánuco y todo el Perú`;
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "https://enquiva.site";
  const description =
    "Enquiva es la plataforma de gestión de eventos de Huánuco y todo el Perú: descubre, crea y vende entradas con tickets QR, inscripciones, pagos y transporte en un solo lugar.";
  const image = `${baseUrl}/images/og-image.png`;

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: defaultTitle,
      template: `%s | ${brand.name}`,
    },
    description,
    applicationName: brand.name,
    keywords: [
      "eventos en Huánuco",
      "eventos en Perú",
      "agenda de eventos Huánuco",
      "conciertos Huánuco",
      "talleres y seminarios Huánuco",
      "venta de entradas online",
      "tickets QR",
      "inscripciones a eventos",
      "plataforma de eventos Perú",
      "organizar eventos",
      "festivales",
      "congresos",
      "gestión de eventos",
      "transporte a eventos",
    ],
    authors: [{ name: brand.name }],
    creator: brand.name,
    icons: {
      icon: [
        { url: "/favicon.ico" },
        { url: "/images/favicon-16x16.png", sizes: "16x16", type: "image/png" },
        { url: "/images/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      ],
      apple: [{ url: "/images/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large" },
    },
    openGraph: {
      type: "website",
      locale: "es_PE",
      siteName: brand.name,
      url: baseUrl,
      title: defaultTitle,
      description,
      images: [{ url: image, width: 1200, height: 630, alt: brand.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: defaultTitle,
      description,
      images: [image],
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const brand = await getPlatformBrand();
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "https://enquiva.site";
  const structuredData = [
    buildOrganizationSchema(brand, baseUrl),
    buildWebSiteSchema(brand, baseUrl),
    ...buildSiteNavigationElementSchemas(baseUrl, brand.defaultLocale),
  ];

  return (
    <html lang={brand.defaultLocale} suppressHydrationWarning className={outfit.variable}>
      <head>
        <ThemeInitScript platformDefaultAccent={brand.defaultAccentColor} />
        <SidebarCollapseBootScript />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
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
