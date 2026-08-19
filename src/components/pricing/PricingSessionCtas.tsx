"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useLocale } from "@/components/providers/LocaleProvider";
import { useSession } from "@/lib/auth/client";
import { getPricingCta } from "@/lib/navigation/pricing-cta";
import { cn } from "@/lib/utils";

export function PricingHeroPrimaryCta() {
  const { locale } = useLocale();
  const { data: session } = useSession();
  const cta = getPricingCta(session?.user?.role, locale === "en" ? "en" : "es");

  return (
    <Link
      href={cta.cardHref}
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
    >
      {cta.cardLabel}
      <ArrowRight className="h-4 w-4" />
    </Link>
  );
}

export function PricingPlanCta({ recommended }: { recommended: boolean }) {
  const { locale } = useLocale();
  const { data: session } = useSession();
  const cta = getPricingCta(session?.user?.role, locale === "en" ? "en" : "es");

  return (
    <Link
      href={cta.cardHref}
      className={cn(
        "mt-8 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition",
        recommended
          ? "bg-primary text-primary-foreground hover:bg-primary/90"
          : "border border-border bg-background hover:bg-muted",
      )}
    >
      {cta.cardLabel}
      <ArrowRight className="h-4 w-4" />
    </Link>
  );
}

export function PricingFooterNote() {
  const { locale } = useLocale();
  const { data: session } = useSession();
  const cta = getPricingCta(session?.user?.role, locale === "en" ? "en" : "es");

  return (
    <p className="mt-10 text-center text-sm text-muted-foreground">
      {cta.footerText}{" "}
      <Link href={cta.linkHref} className="font-medium text-primary hover:underline">
        {cta.linkLabel}
      </Link>
    </p>
  );
}
