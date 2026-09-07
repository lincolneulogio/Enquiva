import type { ReactNode } from "react";
import { PublicHeader } from "@/components/shared/PublicHeader";
import { ScrollToTopButton } from "@/components/shared/ScrollToTopButton";
import { Footer } from "@/components/landing/Footer";
import type { LucideIcon } from "lucide-react";
import { FileText } from "lucide-react";

export type LegalSection = {
  heading?: string;
  paragraphs: ReactNode[];
  list?: ReactNode[];
};

type LegalPageProps = {
  badge: string;
  badgeIcon?: LucideIcon;
  title: string;
  titleHighlight?: string;
  updatedLabel: string;
  updatedDate?: string;
  intro: ReactNode;
  sections: LegalSection[];
};

export function LegalPage({
  badge,
  badgeIcon: BadgeIcon = FileText,
  title,
  titleHighlight,
  updatedLabel,
  updatedDate,
  intro,
  sections,
}: LegalPageProps) {
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      <section className="relative overflow-hidden border-b border-border bg-card">
        <div className="pointer-events-none absolute inset-0">
          <div className="fe-gradient-mesh absolute inset-0" />
          <div className="absolute left-1/2 top-0 h-[320px] w-[320px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-primary/10 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-3xl px-4 py-12 text-center sm:px-6 sm:py-16">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
            <BadgeIcon className="h-3.5 w-3.5" />
            {badge}
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {title}
            {titleHighlight ? (
              <>
                {" "}
                <em className="bg-gradient-to-r from-primary to-accent bg-clip-text not-italic text-transparent">
                  {titleHighlight}
                </em>
              </>
            ) : null}
          </h1>
          {updatedDate ? (
            <p className="mt-3 text-xs text-muted-foreground">
              {updatedLabel} {updatedDate}
            </p>
          ) : null}
        </div>
      </section>

      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="prose-sm rounded-2xl border border-border/80 bg-card p-6 shadow-sm sm:p-10">
          <div className="text-sm leading-relaxed text-muted-foreground">{intro}</div>

          <div className="mt-2 space-y-8">
            {sections.map((section, idx) => (
              <section key={idx}>
                {section.heading ? (
                  <h2 className="mb-3 font-display text-lg font-semibold text-foreground">
                    {section.heading}
                  </h2>
                ) : null}
                <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
                  {section.paragraphs.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
                {section.list && section.list.length > 0 ? (
                  <ul className="mt-3 space-y-2 pl-1 text-sm leading-relaxed text-muted-foreground">
                    {section.list.map((item, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}
          </div>
        </div>
      </article>

      <Footer />
      <ScrollToTopButton />
    </div>
  );
}
