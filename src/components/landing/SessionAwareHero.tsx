"use client";

import { useLocale } from "@/components/providers/LocaleProvider";
import { useSession } from "@/lib/auth/client";
import { getLandingCopy } from "@/lib/navigation/landing-audience";
import { HeroSection } from "@/components/landing/HeroSection";

interface SessionAwareHeroProps {
  formattedRegistrations: string;
}

/**
 * Hero con conocimiento de sesión para adaptar CTAs si el usuario está autenticado.
 */
export function SessionAwareHero({ formattedRegistrations }: SessionAwareHeroProps) {
  const { locale, t } = useLocale();
  const { data: session } = useSession();
  const localeKey = locale === "en" ? "en" : "es";
  const copy = getLandingCopy({
    role: session?.user?.role ?? null,
    locale: localeKey,
    t,
  });

  return (
    <HeroSection
      t={t}
      locale={locale}
      copy={copy}
      formattedRegistrations={formattedRegistrations}
    />
  );
}
