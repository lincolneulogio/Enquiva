"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Star, Mail, CheckCircle2, Globe2 } from "lucide-react";
import { BrandLogo } from "@/components/shared/BrandLogo";
import type { LandingCopy } from "@/lib/navigation/landing-audience";

interface FooterProps {
  copy?: LandingCopy;
}

export function Footer({ copy }: FooterProps = {}) {
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSubscribed(true);
      setEmail("");
    }
  };

  return (
    <footer className="border-t border-border/80 bg-[#F8F5EE] px-4 pb-12 pt-16 text-foreground transition-colors dark:bg-[#0C0C0F] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Cuadrícula superior de 5 columnas */}
        <div className="grid grid-cols-1 gap-10 pb-12 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {/* Columna 1: Marca y descripción */}
          <div className="sm:col-span-2 md:col-span-3 lg:col-span-1">
            <BrandLogo href="/" size="md" showText className="mb-4" />
            <p className="max-w-xs text-xs leading-relaxed text-muted-foreground sm:text-sm">
              Plataforma integral de gestión, venta de tickets y descubrimiento de experiencias inolvidables en Latinoamérica.
            </p>

            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-border/80 bg-card px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span>4.9 / 5.0 en satisfacción</span>
            </div>
          </div>

          {/* Columna 2: Descubre Enquiva */}
          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-foreground">
              Descubre Enquiva
            </h4>
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
            <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-foreground">
              Enquiva
            </h4>
            <ul className="space-y-2.5 text-xs text-muted-foreground sm:text-sm">
              <li>
                <Link href="/pricing" className="transition-colors hover:text-primary">
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
            <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-foreground">
              Organizadores
            </h4>
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

          {/* Columna 5: Suscripción a Boletín */}
          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-foreground">
              Boletín de Novedades
            </h4>
            <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
              Recibe invitaciones exclusivas, preventas tempranas y novedades cada semana.
            </p>

            {isSubscribed ? (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>¡Gracias por suscribirte!</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-2">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="email"
                    required
                    placeholder="tu@correo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-border/90 bg-card py-2 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground shadow-md shadow-primary/25 transition-all duration-200 active:scale-98 hover:bg-primary/95 hover:shadow-lg hover:shadow-primary/35 hover:brightness-105 cursor-pointer"
                >
                  Suscribirme
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
