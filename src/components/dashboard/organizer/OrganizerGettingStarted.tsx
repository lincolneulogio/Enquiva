import Link from "next/link";
import { Calendar, CreditCard, Rocket, Share2 } from "lucide-react";
import { getI18n } from "@/lib/i18n/server";

const steps = [
  { titleKey: "gettingStartedStep1Title", descKey: "gettingStartedStep1Desc", href: "/organizer/events/new", icon: Calendar },
  { titleKey: "gettingStartedStep2Title", descKey: "gettingStartedStep2Desc", href: "/organizer/payments", icon: CreditCard },
  { titleKey: "gettingStartedStep3Title", descKey: "gettingStartedStep3Desc", href: "/organizer/events", icon: Share2 },
] as const;

export async function OrganizerGettingStarted() {
  const { t } = await getI18n();

  return (
    <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-6 sm:p-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
          <Rocket className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="font-display text-lg font-semibold text-foreground">
            {t("dashboard.organizer.gettingStartedTitle")}
          </h2>
          <p className="text-sm text-muted-foreground">{t("dashboard.organizer.gettingStartedIntro")}</p>
        </div>
      </div>

      <ol className="space-y-3">
        {steps.map(({ titleKey, descKey, href, icon: Icon }, index) => (
          <li key={titleKey}>
            <Link
              href={href}
              className="flex items-start gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-card/80"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 font-medium text-foreground">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  {t(`dashboard.organizer.${titleKey}`)}
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {t(`dashboard.organizer.${descKey}`)}
                </p>
              </div>
              <span className="text-sm text-primary">→</span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
