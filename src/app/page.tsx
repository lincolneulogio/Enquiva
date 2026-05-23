import { Calendar, Users, Bell, Shield, Zap } from "lucide-react";
import { getPublicEvents } from "@/actions/events";
import { PublicHeader } from "@/components/shared/PublicHeader";
import { getI18n } from "@/lib/i18n/server";
import {
  HeroSection,
  EventsShowcase,
  FeaturesSection,
  Footer,
} from "@/components/landing";

export default async function HomePage() {
  const { locale, t } = await getI18n();
  const { events, totalRegistrations } = await getPublicEvents({ page: 1, limit: 6 });

  const formattedRegistrations = new Intl.NumberFormat(
    locale === "en" ? "en-US" : "es-PE"
  ).format(totalRegistrations);

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
    <div id="top" className="relative min-h-screen overflow-x-clip bg-background">
      <PublicHeader />

      <HeroSection
        t={t}
        locale={locale}
        signals={signals}
        features={features}
      />

      {/* Signals strip */}
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

      <EventsShowcase
        events={events}
        t={t}
      />

      <FeaturesSection
        t={t}
        locale={locale}
      />

      <Footer
        t={t}
      />
    </div>
  );
}
