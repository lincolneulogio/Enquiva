import type { PlatformBrand } from "@/lib/brand/platform-brand";

type JsonLd = Record<string, unknown>;

function absoluteUrl(base: string, path?: string): string {
  const root = base.replace(/\/$/, "");
  if (!path) return root;
  return `${root}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Datos estructurados para que Google muestre el resultado de marca
 * (logo + sitelinks + ficha) al buscar el nombre de la empresa.
 * El logo debe medir al menos 112x112 px; icon192 es el asset válido.
 */
export function buildOrganizationSchema(
  brand: PlatformBrand,
  baseUrl: string,
): JsonLd {
  const sameAs = [
    brand.social.facebook,
    brand.social.instagram,
    brand.social.x,
    brand.social.linkedIn,
    brand.social.youtube,
    brand.social.whatsApp,
  ].filter(Boolean);

  const logoUrl = absoluteUrl(baseUrl, brand.logo.icon192);
  const email = brand.contactEmail || brand.supportEmail;

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: brand.name,
    url: baseUrl,
    logo: {
      "@type": "ImageObject",
      url: logoUrl,
      width: 192,
      height: 192,
    },
    ...(email ? { email } : {}),
    ...(brand.location ? { areaServed: brand.location } : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: brand.supportEmail,
      availableLanguage: ["es", "en"],
    },
  };
}

export function buildWebSiteSchema(
  brand: PlatformBrand,
  baseUrl: string,
): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: brand.name,
    url: baseUrl,
    inLanguage: brand.defaultLocale === "en" ? "en" : "es",
    publisher: buildOrganizationSchema(brand, baseUrl),
  };
}

const MAIN_NAV_ES = [
  { name: "Inicio", href: "/" },
  { name: "Eventos", href: "/events" },
  { name: "Precios", href: "/pricing" },
  { name: "Crear cuenta", href: "/register" },
  { name: "Iniciar sesión", href: "/login" },
];

const MAIN_NAV_EN = [
  { name: "Home", href: "/" },
  { name: "Events", href: "/events" },
  { name: "Pricing", href: "/pricing" },
  { name: "Sign up", href: "/register" },
  { name: "Log in", href: "/login" },
];

/**
 * Sitelinks: filas de enlaces que Google muestra bajo el resultado principal.
 * Google los calcula de forma automática, pero `SiteNavigationElement`
 * + una navegación clara y enlazada desde la home ayudan a que aparezcan.
 */
export function buildSiteNavigationElementSchemas(
  baseUrl: string,
  locale: "es" | "en",
): JsonLd[] {
  const nav = locale === "en" ? MAIN_NAV_EN : MAIN_NAV_ES;
  return nav.map((item) => ({
    "@context": "https://schema.org",
    "@type": "SiteNavigationElement",
    name: item.name,
    url: absoluteUrl(baseUrl, item.href),
  }));
}