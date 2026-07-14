import Link from "next/link";
import { Check, ArrowRight, Sparkles } from "lucide-react";
import { headers } from "next/headers";
import { PublicHeader } from "@/components/shared/PublicHeader";
import { getI18n } from "@/lib/i18n/server";
import { db } from "@/lib/db";
import { plans } from "@/lib/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { mapPlanRow, DEFAULT_PLAN_DEFINITIONS, filterPublicBillingPlans } from "@/lib/billing/plans";
import { auth } from "@/lib/auth";
import { getPricingCta } from "@/lib/navigation/pricing-cta";

export const metadata = {
  title: "Planes y precios | Evora",
  description:
    "Elige el plan Evora para tu organización: eventos, Culqi, transporte, IA y comisiones transparentes.",
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
    featureCulqi: d.featureCulqi,
    featureTransport: d.featureTransport,
    featureAi: d.featureAi,
    featureExports: d.featureExports,
    isActive: true,
    sortOrder: d.sortOrder,
    currency: "PEN",
    createdAt: new Date(),
    updatedAt: new Date(),
    featureCustomBranding: false,
  }));
}

export default async function PricingPage() {
  const { locale } = await getI18n();
  const session = await auth.api.getSession({ headers: await headers() });
  const cta = getPricingCta(session?.user?.role, locale === "en" ? "en" : "es");

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

  const visible = filterPublicBillingPlans(rows).slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      <section className="border-b border-border bg-card px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            {locale === "en" ? "Pricing" : "Planes"}
          </p>
          <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            {locale === "en" ? "Plans for teams that organize" : "Planes para quienes organizan"}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            {locale === "en"
              ? "Subscriptions for organizers and entities, with a transparent platform fee per paid attendee."
              : "Suscripciones para organizadores y entidades, con comisión transparente por cada inscrito que paga."}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-6 md:grid-cols-3">
          {visible.map((raw) => {
            const plan = mapPlanRow(raw);
            const isPro = plan.slug === "pro" || plan.slug.includes("pro");
            const features = [
              plan.maxActiveEvents == null
                ? locale === "en"
                  ? "Unlimited events"
                  : "Eventos ilimitados"
                : locale === "en"
                  ? `${plan.maxActiveEvents} active events`
                  : `${plan.maxActiveEvents} eventos activos`,
              plan.maxAttendeesPerEvent == null
                ? locale === "en"
                  ? "Unlimited attendees"
                  : "Asistentes ilimitados"
                : locale === "en"
                  ? `Up to ${plan.maxAttendeesPerEvent} attendees`
                  : `Hasta ${plan.maxAttendeesPerEvent} asistentes`,
              plan.features.culqi ? "Culqi" : null,
              plan.features.transport
                ? locale === "en"
                  ? "Transport"
                  : "Transporte"
                : null,
              plan.features.ai ? "Copilot IA" : null,
              plan.features.exports
                ? locale === "en"
                  ? "Exports"
                  : "Exportaciones"
                : null,
              plan.commissionPercent > 0 || plan.commissionPerRegistration > 0
                ? locale === "en"
                  ? `Platform fee: ${plan.commissionPercent}%${plan.commissionPerRegistration > 0 ? ` + S/ ${plan.commissionPerRegistration.toFixed(2)}/attendee` : ""}`
                  : `Comisión plataforma: ${plan.commissionPercent}%${plan.commissionPerRegistration > 0 ? ` + S/ ${plan.commissionPerRegistration.toFixed(2)}/inscrito` : ""}`
                : null,
            ].filter(Boolean) as string[];

            return (
              <article
                key={plan.id}
                className={`relative flex flex-col rounded-3xl border p-6 shadow-sm ${
                  isPro
                    ? "border-primary/40 bg-primary/5"
                    : "border-border bg-card"
                }`}
              >
                {isPro ? (
                  <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">
                    {locale === "en" ? "Popular" : "Popular"}
                  </span>
                ) : null}
                <h2 className="font-display text-2xl font-semibold text-foreground">{plan.name}</h2>
                <p className="mt-2 min-h-[3rem] text-sm text-muted-foreground">
                  {plan.description}
                </p>
                <p className="mt-6 font-display text-4xl font-semibold text-foreground">
                  S/ {Number(plan.priceMonthly).toFixed(2)}
                  <span className="text-base font-normal text-muted-foreground">
                    /{locale === "en" ? "mo" : "mes"}
                  </span>
                </p>
                <ul className="mt-6 flex-1 space-y-2.5">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={cta.cardHref}
                  className={`mt-8 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition ${
                    isPro
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "border border-border bg-background hover:bg-muted"
                  }`}
                >
                  {cta.cardLabel}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </article>
            );
          })}
        </div>

        <p className="mt-10 text-center text-sm text-muted-foreground">
          {cta.footerText}{" "}
          <Link href={cta.linkHref} className="font-medium text-primary hover:underline">
            {cta.linkLabel}
          </Link>
        </p>
      </section>
    </div>
  );
}
