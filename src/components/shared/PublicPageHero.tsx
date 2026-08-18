import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type PublicPageHeroHighlight = {
  icon: LucideIcon;
  title: string;
  description: string;
};

type PublicPageHeroProps = {
  badge: string;
  badgeIcon?: LucideIcon;
  title: string;
  titleHighlight?: string;
  description: string;
  align?: "left" | "center";
  actions?: ReactNode;
  highlights?: PublicPageHeroHighlight[];
  children?: ReactNode;
};

export function PublicPageHero({
  badge,
  badgeIcon: BadgeIcon,
  title,
  titleHighlight,
  description,
  align = "left",
  actions,
  highlights,
  children,
}: PublicPageHeroProps) {
  const centered = align === "center";

  return (
    <section className="relative overflow-hidden border-b border-border bg-card">
      <div className="pointer-events-none absolute inset-0">
        <div className="fe-gradient-mesh absolute inset-0" />
        <div className="absolute left-1/2 top-0 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -right-16 bottom-0 h-[280px] w-[280px] rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className={cn(centered && "mx-auto max-w-3xl text-center")}>
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
            {BadgeIcon ? <BadgeIcon className="h-3.5 w-3.5" /> : null}
            {badge}
          </p>

          <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
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

          <p
            className={cn(
              "mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg",
              centered && "mx-auto",
            )}
          >
            {description}
          </p>

          {actions ? (
            <div
              className={cn(
                "mt-7 flex flex-col gap-3 sm:flex-row",
                centered && "justify-center",
              )}
            >
              {actions}
            </div>
          ) : null}

          {children}
        </div>

        {highlights && highlights.length > 0 ? (
          <div
            className={cn(
              "mt-10 grid gap-3 sm:grid-cols-3",
              centered && "mx-auto max-w-4xl",
            )}
          >
            {highlights.map(({ icon: Icon, title: itemTitle, description: itemDescription }) => (
              <article
                key={itemTitle}
                className="rounded-2xl border border-border/80 bg-background/70 p-4 shadow-xs backdrop-blur-sm"
              >
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <h2 className="text-sm font-semibold text-foreground">{itemTitle}</h2>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {itemDescription}
                </p>
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
