import Link from "next/link";
import { ArrowLeft, Compass, Sparkles, Ticket } from "lucide-react";
import { getI18n } from "@/lib/i18n/server";
import { getPlatformBrand } from "@/lib/brand/platform-brand";

export default async function NotFoundPage() {
  const { t } = await getI18n();
  const brand = await getPlatformBrand();

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6 py-16">
      {/* Fondo de la plataforma */}
      <div className="pointer-events-none absolute inset-0 fe-gradient-mesh" aria-hidden="true" />
      <div
        className="pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_72%)]"
        style={{
          backgroundImage:
            "radial-gradient(hsl(var(--border) / 0.8) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
        }}
        aria-hidden="true"
      />

      {/* Orbes flotantes decorativos */}
      <div
        className="fe-float pointer-events-none absolute right-[8%] top-[18%] hidden text-primary/40 lg:block"
        aria-hidden="true"
      >
        <Sparkles className="h-10 w-10" />
      </div>
      <div
        className="fe-float pointer-events-none absolute bottom-[16%] left-[10%] hidden text-accent/40 lg:block"
        style={{ animationDelay: "1.2s" }}
        aria-hidden="true"
      >
        <Ticket className="h-9 w-9" />
      </div>
      <div
        className="fe-float pointer-events-none absolute right-[16%] bottom-[26%] hidden text-primary/25 md:block"
        style={{ animationDelay: "2s" }}
        aria-hidden="true"
      >
        <Compass className="h-6 w-6" />
      </div>

      {/* Marca */}
      <Link
        href="/"
        className="absolute left-6 top-6 inline-flex items-center gap-2 text-foreground transition-opacity hover:opacity-80 sm:left-8 sm:top-8"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-accent text-primary-foreground shadow-lg shadow-primary/25">
          <Sparkles className="h-4.5 w-4.5" />
        </span>
        <span className="font-display text-lg font-semibold tracking-tight">{brand.name}</span>
      </Link>

      {/* Contenido */}
      <div className="relative z-10 flex max-w-xl flex-col items-center text-center animate-fade-in">
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          {t("notFound.code")}
        </span>

        <h1
          className="select-none bg-gradient-to-r from-primary via-accent to-primary bg-clip-text font-display text-[7rem] font-bold leading-none text-transparent drop-shadow-[0_18px_50px_hsl(var(--primary)/0.35)] sm:text-[9rem]"
          aria-hidden="true"
        >
          404
        </h1>

        <h2 className="mt-4 font-display text-2xl font-semibold text-foreground sm:text-3xl">
          {t("notFound.title")}
        </h2>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
          {t("notFound.description")}
        </p>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="fe-btn-glow inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/40"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("notFound.backHome")}
          </Link>
          <Link
            href="/events"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card/70 px-6 py-3 text-sm font-semibold text-foreground backdrop-blur transition-all hover:-translate-y-0.5 hover:bg-card hover:shadow-lg"
          >
            <Compass className="h-4 w-4 text-primary" />
            {t("notFound.explore")}
          </Link>
        </div>

        <a
          href={`mailto:${brand.supportEmail}`}
          className="mt-8 text-xs font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
        >
          {t("notFound.contact")} · {brand.supportEmail}
        </a>
      </div>
    </main>
  );
}