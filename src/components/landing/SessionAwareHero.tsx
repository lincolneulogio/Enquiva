"use client";

import { Bell, Calendar, Shield, Users, Zap } from "lucide-react";
import { useLocale } from "@/components/providers/LocaleProvider";
import { useSession } from "@/lib/auth/client";
import { getLandingCopy } from "@/lib/navigation/landing-audience";
import { HeroSection } from "@/components/landing/HeroSection";

interface SessionAwareHeroProps {
  formattedRegistrations: string;
}

/**
 * Hero cacheable: HTML inicial de invitado; si hay sesión, actualiza copy/CTAs en cliente.
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

  const features = [
    {
      icon: Calendar,
      title: t("public.home.features.smartManagementTitle"),
      desc: t("public.home.features.smartManagementDesc"),
    },
    {
      icon: Users,
      title: t("public.home.features.attendeeRegistrationTitle"),
      desc: t("public.home.features.attendeeRegistrationDesc"),
    },
    {
      icon: Bell,
      title: t("public.home.features.realtimeNotificationsTitle"),
      desc: t("public.home.features.realtimeNotificationsDesc"),
    },
    {
      icon: Shield,
      title: t("public.home.features.roleBasedAccessTitle"),
      desc: t("public.home.features.roleBasedAccessDesc"),
    },
    {
      icon: Zap,
      title: t("public.home.features.lightningFastTitle"),
      desc: t("public.home.features.lightningFastDesc"),
    },
  ];

  const signals = [
    { icon: Calendar, value: "24/7", label: t("common.overview") },
    { icon: Users, value: formattedRegistrations, label: t("common.registrations") },
    { icon: Bell, value: "Live", label: t("common.notifications") },
    { icon: Shield, value: "RBAC", label: t("public.home.features.roleBasedAccessTitle") },
  ];

  return (
    <>
      <HeroSection t={t} locale={locale} copy={copy} signals={signals} features={features} />

      <section className="px-4 py-8 sm:px-6" data-aos="fade-up" data-aos-delay="60">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-3 rounded-2xl border border-border/80 bg-card/70 p-3 backdrop-blur-sm">
          {signals.map(({ icon: Icon, value, label }) => (
            <div
              key={label}
              className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-background/80 px-3 py-2 text-sm"
            >
              <Icon className="h-4 w-4 text-primary" />
              <span className="font-semibold text-foreground">{value}</span>
              <span className="text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
