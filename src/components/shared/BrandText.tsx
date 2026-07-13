"use client";

import { Mail, MapPin } from "lucide-react";
import { usePlatformBrand } from "@/components/providers/PlatformBrandProvider";
import { displaySocialLabel } from "@/lib/brand/social";

/** Nombre de plataforma desde Settings (Superadmin). */
export function BrandText({
  className,
  as: Tag = "span",
}: {
  className?: string;
  as?: "span" | "p" | "strong";
}) {
  const { name } = usePlatformBrand();
  return <Tag className={className}>{name}</Tag>;
}

/** mailto + texto del correo de soporte (operativo / emails). */
export function SupportEmailLink({ className }: { className?: string }) {
  const { supportEmail } = usePlatformBrand();
  return (
    <a href={`mailto:${supportEmail}`} className={className}>
      {supportEmail}
    </a>
  );
}

/** Correo público de contacto (landing). */
export function ContactEmailLink({ className }: { className?: string }) {
  const { contactEmail } = usePlatformBrand();
  return (
    <a href={`mailto:${contactEmail}`} className={className}>
      {contactEmail}
    </a>
  );
}

/** Badge compacto logo + nombre (landing hero, etc.). */
export function BrandBadge({ className }: { className?: string }) {
  const { name } = usePlatformBrand();
  return (
    <span
      className={
        className ??
        "inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
      }
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/logo-mark-xs.png"
        alt={name}
        height={18}
        className="object-contain"
        style={{ height: "18px", width: "auto" }}
      />
      {name}
    </span>
  );
}

const SOCIAL_META = [
  { key: "facebook" as const, label: "Facebook", path: "M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z" },
  { key: "instagram" as const, label: "Instagram", path: "M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8A3.6 3.6 0 0 0 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6A3.6 3.6 0 0 0 16.4 4H7.6m9.65 1.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5M12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10m0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" },
  { key: "x" as const, label: "X", path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" },
  { key: "linkedIn" as const, label: "LinkedIn", path: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 114.126 0 2.063 2.063 0 01-2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" },
  { key: "youtube" as const, label: "YouTube", path: "M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.5 31.5 0 0 0 0 12a31.5 31.5 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.5 31.5 0 0 0 24 12a31.5 31.5 0 0 0-.5-5.8zM9.75 15.5v-7l6.5 3.5-6.5 3.5z" },
  { key: "whatsApp" as const, label: "WhatsApp", path: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" },
] as const;

/** Bloque de contacto público + redes (footer landing). */
export function PublicContactBlock({
  className,
  showLocation = true,
}: {
  className?: string;
  showLocation?: boolean;
}) {
  const brand = usePlatformBrand();
  const links = SOCIAL_META.map((meta) => ({
    ...meta,
    href: brand.social[meta.key],
  })).filter((item) => Boolean(item.href));

  return (
    <div className={className ?? "space-y-2.5 text-sm"}>
      <p className="inline-flex items-center gap-2 text-muted-foreground">
        <Mail className="h-4 w-4 shrink-0 text-primary" />
        <ContactEmailLink className="transition-colors hover:text-foreground" />
      </p>
      {showLocation && brand.location ? (
        <p className="inline-flex items-center gap-2 text-muted-foreground">
          <MapPin className="h-4 w-4 shrink-0 text-primary" />
          {brand.location}
        </p>
      ) : null}
      {links.map((item) => (
        <a
          key={item.key}
          href={item.href}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
        >
          <svg
            className="h-4 w-4 shrink-0 fill-current text-primary"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path d={item.path} />
          </svg>
          <span className="truncate">{displaySocialLabel(item.href)}</span>
          <span className="sr-only">{item.label}</span>
        </a>
      ))}
    </div>
  );
}

function legalHrefProps(href: string) {
  const external = /^https?:\/\//i.test(href);
  return external
    ? { href, target: "_blank" as const, rel: "noopener noreferrer" }
    : { href };
}

/** Enlaces legales configurados por Superadmin (footer / registro). */
export function LegalLinks({
  className,
  separator = "·",
  termsLabel = "Términos",
  privacyLabel = "Privacidad",
}: {
  className?: string;
  separator?: string;
  termsLabel?: string;
  privacyLabel?: string;
}) {
  const { termsUrl, privacyUrl } = usePlatformBrand();
  const items: { href: string; label: string }[] = [];
  if (termsUrl) items.push({ href: termsUrl, label: termsLabel });
  if (privacyUrl) items.push({ href: privacyUrl, label: privacyLabel });
  if (items.length === 0) return null;

  return (
    <nav
      aria-label="Legal"
      className={className ?? "inline-flex flex-wrap items-center gap-x-2 gap-y-1"}
    >
      {items.map((item, index) => (
        <span key={item.href} className="inline-flex items-center gap-x-2">
          {index > 0 ? (
            <span className="text-muted-foreground/70" aria-hidden>
              {separator}
            </span>
          ) : null}
          <a
            {...legalHrefProps(item.href)}
            className="transition-colors hover:text-foreground underline-offset-2 hover:underline"
          >
            {item.label}
          </a>
        </span>
      ))}
    </nav>
  );
}

/** Aviso de registro con enlaces a términos / privacidad cuando existen. */
export function AuthTermsNotice({
  locale = "es",
  className,
}: {
  locale?: "es" | "en";
  className?: string;
}) {
  const { termsUrl, privacyUrl } = usePlatformBrand();
  const hasTerms = Boolean(termsUrl);
  const hasPrivacy = Boolean(privacyUrl);
  const en = locale === "en";

  if (!hasTerms && !hasPrivacy) {
    return (
      <p className={className}>
        {en
          ? "By creating an account, you agree to our terms of service and privacy policy."
          : "Al crear una cuenta, aceptas nuestros términos de servicio y política de privacidad."}
      </p>
    );
  }

  const termsLink = hasTerms ? (
    <a
      {...legalHrefProps(termsUrl)}
      className="font-medium text-foreground underline-offset-2 hover:underline"
    >
      {en ? "terms of service" : "términos de servicio"}
    </a>
  ) : (
    <span>{en ? "terms of service" : "términos de servicio"}</span>
  );

  const privacyLink = hasPrivacy ? (
    <a
      {...legalHrefProps(privacyUrl)}
      className="font-medium text-foreground underline-offset-2 hover:underline"
    >
      {en ? "privacy policy" : "política de privacidad"}
    </a>
  ) : null;

  return (
    <p className={className}>
      {en ? "By creating an account, you agree to our " : "Al crear una cuenta, aceptas nuestros "}
      {termsLink}
      {privacyLink ? (
        <>
          {en ? " and " : " y "}
          {privacyLink}
        </>
      ) : null}
      .
    </p>
  );
}
