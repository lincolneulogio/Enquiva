import { Check, X, Sparkles, Calendar, CreditCard, Bus } from "lucide-react";
import { PublicHeader } from "@/components/shared/PublicHeader";
import { PublicPageHero } from "@/components/shared/PublicPageHero";
import { ScrollToTopButton } from "@/components/shared/ScrollToTopButton";
import { getStaticI18n } from "@/lib/i18n/server";
import { db } from "@/lib/db";
import { plans } from "@/lib/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { mapPlanRow, DEFAULT_PLAN_DEFINITIONS, filterPublicBillingPlans, isRecommendedBillingPlan } from "@/lib/billing/plans";
import { getPricingFeatureLines } from "@/lib/billing/pricing-features";
import {
  PricingFooterNote,
  PricingHeroPrimaryCta,
  PricingPlanCta,
} from "@/components/pricing/PricingSessionCtas";
import { cn } from "@/lib/utils";

/** Debe ser literal: Next.js no analiza imports en segment config. */
export const revalidate = 120;

export const metadata = {
  title: "Planes y precios | Enquiva",
  description:
    "Elige el plan Enquiva para tu organización: eventos, Culqi, transporte, IA y comisiones transparentes.",
};

function fallbackPlans() {
  return DEFAULT_PLAN_DEFINITIONS.map((d) => ({
    id: d.slug,
    slug: d.slug,
    name: d.name,
    description: d.description,
    priceMonthly: d.priceMonthly,
    maxActiveEvents: d.maxActiveEvents,
    maxAttendeesPerEvent: d.maxAttendeesPerEvent,
    commissionPercent: d.commissionPercent,
    commissionPerRegistration: d.commissionPerRegistration,
    maxBroadcastsPerMonth: d.maxBroadcastsPerMonth,
    maxAiMessagesPerMonth: d.maxAiMessagesPerMonth,
    maxOrganizers: d.maxOrganizers,
    featureCulqi: d.featureCulqi,
    featureTransport: d.featureTransport,
    featureAi: d.featureAi,
    featureExports: d.featureExports,
    featureCustomBranding: d.featureCustomBranding,
    isActive: true,
    sortOrder: d.sortOrder,
    currency: "PEN",
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
}

export default async function PricingPage() {
  const { locale, t } = await getStaticI18n();

  let rows = fallbackPlans() as Array<typeof plans.$inferSelect>;

  try {
    const fromDb = await db
      .select()
      .from(plans)
      .where(and(eq(plans.isActive, true)))
      .orderBy(asc(plans.sortOrder))
      .limit(12);
    if (fromDb.length > 0) {
      rows = fromDb;
    }
  } catch (error) {
    console.error("[pricing] plans query failed, using fallback catalog", error);
  }

  const visible = filterPublicBillingPlans(rows);
  const fromPrice = visible.reduce((min, row) => {
    const value = Number(row.priceMonthly);
    if (Number.isNaN(value)) return min;
    return Math.min(min, value);
  }, Number.POSITIVE_INFINITY);
  const fromPriceLabel = Number.isFinite(fromPrice)
    ? t("public.pricing.fromPrice", { price: fromPrice.toFixed(2) })
    : null;
  const planLocale = locale === "en" ? "en" : "es";

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      <PublicPageHero
        align="center"
        badge={t("public.pricing.badge")}
        badgeIcon={Sparkles}
        title={t("public.pricing.titleStart")}
        titleHighlight={t("public.pricing.titleHighlight")}
        description={t("public.pricing.subtitle")}
        actions={
          <>
            <PricingHeroPrimaryCta />
            <a
              href="#planes"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background/80 px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
            >
              {t("public.pricing.ctaSecondary")}
            </a>
          </>
        }
        highlights={[
          {
            icon: Calendar,
            title: t("public.pricing.highlightEventsTitle"),
            description: t("public.pricing.highlightEventsDesc"),
          },
          {
            icon: CreditCard,
            title: t("public.pricing.highlightPayTitle"),
            description: t("public.pricing.highlightPayDesc"),
          },
          {
            icon: Bus,
            title: t("public.pricing.highlightTransportTitle"),
            description: t("public.pricing.highlightTransportDesc"),
          },
        ]}
      >
        {fromPriceLabel ? (
          <p className="mt-6 text-sm font-semibold text-primary">{fromPriceLabel}</p>
        ) : null}
      </PublicPageHero>

      <section id="planes" className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className={cn(
          "grid gap-6",
          visible.length === 1
            ? "max-w-md mx-auto"
            : visible.length === 2
              ? "md:grid-cols-2 max-w-4xl mx-auto"
              : "md:grid-cols-2 xl:grid-cols-3",
        )}>
          {visible.map((raw) => {
            const plan = mapPlanRow(raw);
            const recommended = isRecommendedBillingPlan(raw, visible);
            const features = getPricingFeatureLines(plan, planLocale);

            return (
              <article
                key={plan.id}
                className={cn(
                  "relative flex flex-col rounded-3xl border p-6 shadow-sm",
                  recommended
                    ? "border-primary/40 bg-primary/5"
                    : "border-border bg-card",
                )}
              >
                {recommended ? (
                  <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">
                    {t("dashboard.admin.plansRecommendedBadge")}
                  </span>
                ) : null}
                <h2 className="font-display text-2xl font-semibold text-foreground">{plan.name}</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {plan.description}
                </p>
                <p className="mt-5 font-display text-4xl font-semibold text-foreground">
                  S/ {Number(plan.priceMonthly).toFixed(2)}
                  <span className="text-base font-normal text-muted-foreground">
                    /{planLocale === "en" ? "mo" : "mes"}
                  </span>
                </p>

                <ul className="mt-6 flex-1 space-y-2.5">
                  {features.map((row) => (
                    <li
                      key={row.key}
                      className="flex items-start gap-2.5 text-sm text-foreground"
                    >
                      {row.included ? (
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={2.5} />
                      ) : (
                        <X className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/45" />
                      )}
                      <span className={cn(!row.included && "text-muted-foreground/70 line-through decoration-muted-foreground/40")}>
                        {row.text}
                      </span>
                    </li>
                  ))}
                </ul>
                <PricingPlanCta recommended={recommended} />
              </article>
            );
          })}
        </div>

        <PricingFooterNote />
      </section>

      <ScrollToTopButton />
    </div>
  );
}
