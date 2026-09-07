import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Star, ShieldCheck, Sparkles } from "lucide-react";
import type { LandingCopy } from "@/lib/navigation/landing-audience";

interface HeroSectionProps {
  t: (key: string) => string;
  locale: string;
  copy: LandingCopy;
  formattedRegistrations?: string;
}

export function HeroSection({ t, locale, copy, formattedRegistrations }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden px-4 pb-10 pt-12 sm:px-6 lg:pb-14 lg:pt-16">
      {/* Luces de fondo sutiles */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[450px] w-[650px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute right-10 top-10 h-[280px] w-[280px] rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-4xl text-center">
        {/* 1. Pill superior con avatares apilados y calificación */}
        <div
          className="mx-auto mb-6 inline-flex items-center gap-3 rounded-full border border-border/80 bg-card/80 px-4 py-1.5 shadow-sm backdrop-blur-md"
          data-aos="fade-down"
        >
          <div className="flex -space-x-2 overflow-hidden">
            <Image
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&h=64&auto=format&fit=crop&q=80"
              alt="Usuario 1"
              width={26}
              height={26}
              className="inline-block h-6 w-6 rounded-full ring-2 ring-background object-cover"
            />
            <Image
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&auto=format&fit=crop&q=80"
              alt="Usuario 2"
              width={26}
              height={26}
              className="inline-block h-6 w-6 rounded-full ring-2 ring-background object-cover"
            />
            <Image
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&h=64&auto=format&fit=crop&q=80"
              alt="Usuario 3"
              width={26}
              height={26}
              className="inline-block h-6 w-6 rounded-full ring-2 ring-background object-cover"
            />
          </div>

          <div className="flex items-center gap-1 text-amber-500">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span className="text-xs font-semibold text-foreground">4.9/5</span>
          </div>

          <span className="text-xs text-muted-foreground">
            {formattedRegistrations && formattedRegistrations !== "0"
              ? `• ${formattedRegistrations} inscripciones procesadas`
              : "• Experiencias y eventos verificados"}
          </span>
        </div>

        {/* 2. Gran Titular con 'hoy' destacado en color primario naranja */}
        <h1
          className="mb-5 font-display text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl lg:leading-[1.1]"
        >
          Descubre, organiza y vive los{" "}
          <br className="hidden sm:inline" />
          mejores eventos{" "}
          <span className="text-primary underline decoration-primary/30 decoration-wavy underline-offset-8">
            hoy
          </span>
        </h1>

        {/* 3. Subtítulo */}
        <p
          className="mx-auto mb-8 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg"
          data-aos="fade-up"
          data-aos-delay="120"
        >
          Desde conferencias imperdibles y talleres, hasta conciertos y networking.
          Encuentra tu próxima experiencia o crea y gestiona la tuya con nosotros.
        </p>

        {/* 4. Botones de acción (CTAs) */}
        <div
          className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4"
          data-aos="fade-up"
          data-aos-delay="180"
        >
          <Link
            href="/events"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-7 py-3.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/30 transition-all duration-200 active:scale-98 hover:gap-3 hover:bg-primary/95 hover:shadow-xl hover:shadow-primary/45 hover:brightness-105 sm:w-auto"
          >
            Explorar eventos
            <ArrowRight className="h-4 w-4" />
          </Link>

          <Link
            href="/dashboard"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border/90 bg-card px-7 py-3.5 text-sm font-semibold text-foreground shadow-sm transition-all hover:bg-muted/50 sm:w-auto"
          >
            Crear un evento gratis
          </Link>
        </div>

        {/* 5. Garantía de confianza al pie */}
        <p
          className="mt-6 text-xs text-muted-foreground"
          data-aos="fade-up"
          data-aos-delay="220"
        >
          ★ 4.9/5 en satisfacción • Cancelación flexible • Tickets instantáneos con QR
        </p>
      </div>
    </section>
  );
}
