"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Star, Mail, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { BrandLogo } from "@/components/shared/BrandLogo";
import type { LandingCopy } from "@/lib/navigation/landing-audience";
import { subscribeToNewsletterAction } from "@/actions/marketing";

interface FooterProps {
  copy?: LandingCopy;
}

export function Footer({ copy }: FooterProps = {}) {
  const [email, setEmail] = useState("");
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<{
    submitted: boolean;
    success: boolean;
    message: string;
  } | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email.trim()) return;

    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        const res = await subscribeToNewsletterAction(null, formData);
        setStatus({
          submitted: true,
          success: res.success,
          message: res.message,
        });
        if (res.success) {
          setEmail("");
        }
      } catch {
        setStatus({
          submitted: true,
          success: false,
          message: "Ocurrió un error inesperado. Intenta de nuevo.",
        });
      }
    });
  };

  return (
    <footer className="relative border-t border-border/70 bg-secondary/35 px-4 pb-12 pt-16 text-foreground transition-colors dark:bg-card/25 sm:px-6 lg:px-8">
      {/* Línea luminosa superior con el tono de acento activo */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

      <div className="mx-auto max-w-7xl">
        {/* Cuadrícula superior de 5 columnas */}
        <div className="grid grid-cols-1 gap-10 pb-12 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {/* Columna 1: Marca y descripción */}
          <div className="sm:col-span-2 md:col-span-3 lg:col-span-1">
            <BrandLogo href="/" size="md" showText className="mb-4" />
            <p className="max-w-xs text-xs leading-relaxed text-muted-foreground sm:text-sm">
              Plataforma integral de gestión, venta de tickets y descubrimiento de experiencias inolvidables en Latinoamérica.
            </p>

            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-card/90 px-3 py-1.5 text-xs font-semibold text-foreground shadow-2xs">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span>4.9 / 5.0 en satisfacción</span>
            </div>
          </div>

          {/* Columna 2: Descubre Enquiva */}
          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-wider text-foreground">
              Descubre Enquiva
            </p>
            <ul className="space-y-2.5 text-xs text-muted-foreground sm:text-sm">
              <li>
                <Link href="/events" className="transition-colors hover:text-primary">
                  Guía de eventos
                </Link>
              </li>
              <li>
                <Link href="/events?category=tech" className="transition-colors hover:text-primary">
                  Tecnología y Devs
                </Link>
              </li>
              <li>
                <Link href="/events?category=business" className="transition-colors hover:text-primary">
                  Negocios y Startups
                </Link>
              </li>
              <li>
                <Link href="/events?category=art" className="transition-colors hover:text-primary">
                  Arte y Festivales
                </Link>
              </li>
              <li>
                <Link href="/events" className="transition-colors hover:text-primary">
                  Venta de tickets QR
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 3: Enquiva Institucional */}
          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-wider text-foreground">
              Enquiva
            </p>
            <ul className="space-y-2.5 text-xs text-muted-foreground sm:text-sm">
              <li>
                <Link href="/about" className="transition-colors hover:text-primary">
                  Sobre nosotros
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="transition-colors hover:text-primary">
                  Planes y Precios
                </Link>
              </li>
              <li>
                <Link href="/contact" className="transition-colors hover:text-primary">
                  Contacto & Soporte
                </Link>
              </li>
              <li>
                <Link href="/terms" className="transition-colors hover:text-primary">
                  Términos y condiciones
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="transition-colors hover:text-primary">
                  Política de privacidad
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 4: Organizadores */}
          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-wider text-foreground">
              Organizadores
            </p>
            <ul className="space-y-2.5 text-xs text-muted-foreground sm:text-sm">
              <li>
                <Link href="/dashboard" className="transition-colors hover:text-primary">
                  Crear un evento
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="transition-colors hover:text-primary">
                  Solución de Ticketing
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="transition-colors hover:text-primary">
                  Control de Accesos QR
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="transition-colors hover:text-primary">
                  Comisiones y Cobros
                </Link>
              </li>
              <li>
                <Link href="/contact" className="transition-colors hover:text-primary">
                  Atención empresarial
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 5: Suscripción a Boletín Dinámico */}
          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-wider text-foreground">
              Boletín de Novedades
            </p>
            <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
              Recibe invitaciones exclusivas, preventas tempranas y novedades cada semana.
            </p>

            {status?.success ? (
              <div className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 p-3 text-xs font-semibold text-primary animate-in fade-in">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{status.message}</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-2">
                <input type="hidden" name="source" value="home_footer" />
                <input
                  type="text"
                  name="name"
                  maxLength={120}
                  disabled={isPending}
                  placeholder="Tu nombre y apellido (opcional)"
                  className="w-full rounded-xl border border-border/90 bg-card px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                />
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="email"
                    name="email"
                    required
                    disabled={isPending}
                    placeholder="tu@correo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-border/90 bg-card py-2 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                  />
                </div>

                {status?.submitted && !status.success && (
                  <div className="flex items-center gap-1.5 text-[11px] text-rose-600 dark:text-rose-400">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    <span>{status.message}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground shadow-md shadow-primary/25 transition-all duration-200 active:scale-98 hover:bg-primary/95 hover:shadow-lg hover:shadow-primary/35 hover:brightness-105 cursor-pointer disabled:opacity-50"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Suscribiendo...</span>
                    </>
                  ) : (
                    <span>Suscribirme</span>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Barra inferior de copyright y enlaces finales */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-border/70 pt-8 text-xs text-muted-foreground sm:flex-row">
          <p>© 2026 Enquiva Inc. Todos los derechos reservados.</p>
          <div className="flex flex-wrap items-center gap-6">
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacidad
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Términos
            </Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">
              Ayuda
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
