"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Sparkles, Building2, Users2, ArrowRight } from "lucide-react";
import type { Event } from "@/lib/db/schema";

interface GalleryItem {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
  tag: string;
  link: string;
}

interface OrganizationSnippet {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  accentColor?: string | null;
}

interface PremierExperiencesSectionProps {
  experiences?: Event[];
  organizations?: OrganizationSnippet[];
}

export function PremierExperiencesSection({
  experiences = [],
  organizations = [],
}: PremierExperiencesSectionProps) {
  const [scrollIndex, setScrollIndex] = useState(0);

  // Mapear experiencias 100% reales de la base de datos
  const displayGallery: GalleryItem[] = experiences.map((e) => {
    return {
      id: e.id,
      title: e.title,
      category: e.category ? `${e.category.toUpperCase()} • Experiencia` : "Evento Destacado",
      imageUrl:
        e.coverImage ||
        "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80",
      tag: e.isFeatured ? "Destacado" : e.isVirtual ? "Online" : "Presencial",
      link: `/events/${e.slug}`,
    };
  });

  const handlePrev = () => {
    setScrollIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setScrollIndex((prev) => Math.max(0, Math.min(displayGallery.length - 1, prev + 1)));
  };

  // Organizaciones reales de la base de datos
  const org1 = organizations[0];
  const org2 = organizations[1];

  return (
    <section className="px-4 py-16 sm:px-6 lg:py-20">
      <div className="mx-auto max-w-7xl">
        {/* Encabezado principal */}
        <div className="mb-10 text-center" data-aos="fade-up">
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Experiencias Destacadas
          </div>
          <h2 className="font-display text-3xl font-extrabold text-foreground sm:text-4xl lg:text-5xl">
            Experiencias y eventos de primer nivel en Enquiva
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Aprende, conecta y crece con eventos diseñados por los mejores creadores y organizaciones.
          </p>
        </div>

        {/* Galería visual si hay eventos */}
        {displayGallery.length > 0 && (
          <>
            <div
              className="mb-6 flex items-center justify-between border-b border-border/70 pb-4"
              data-aos="fade-up"
              data-aos-delay="50"
            >
              <div className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-primary" />
                <h3 className="text-sm font-bold text-foreground sm:text-base">
                  Eventos recomendados de la plataforma
                </h3>
              </div>

              {displayGallery.length > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrev}
                    disabled={scrollIndex === 0}
                    aria-label="Anterior"
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-border/80 bg-card text-foreground transition-colors hover:bg-muted disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={scrollIndex >= displayGallery.length - 1}
                    aria-label="Siguiente"
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-border/80 bg-card text-foreground transition-colors hover:bg-muted disabled:opacity-40"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Cuadrícula de galería */}
            <div className="mb-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {displayGallery.map((item, idx) => (
                <Link
                  key={item.id}
                  href={item.link}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10"
                  data-aos="fade-up"
                  data-aos-delay={String(60 + idx * 50)}
                >
                  <div className="relative aspect-[16/11] w-full overflow-hidden bg-muted">
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <span className="absolute right-3 top-3 rounded-md bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur-md">
                      {item.tag}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col p-4">
                    <span className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
                      {item.category}
                    </span>
                    <h4 className="line-clamp-2 text-sm font-bold leading-snug text-foreground transition-colors group-hover:text-primary">
                      {item.title}
                    </h4>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        {/* 3 Tarjetas de Organizadores e invitación */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Card 1: Organización Top 1 o Invitar */}
          <div
            className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-6 shadow-sm transition-all hover:border-primary/40"
            data-aos="fade-up"
            data-aos-delay="80"
          >
            <div>
              <div className="mb-4 flex items-center justify-between">
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {org1 ? "Organizador Verificado" : "Comunidad Activa"}
                </span>
                <span className="text-xs text-muted-foreground">Enquiva Partner</span>
              </div>

              <div className="mb-3 flex items-center gap-3">
                {org1?.logoUrl ? (
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
                    <Image src={org1.logoUrl} alt={org1.name} fill className="object-cover" />
                  </div>
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <Building2 className="h-6 w-6" />
                  </div>
                )}
                <div>
                  <h4 className="text-base font-bold text-foreground">
                    {org1 ? org1.name : "Organizaciones Destacadas"}
                  </h4>
                  <p className="text-xs text-muted-foreground">Institución registrada</p>
                </div>
              </div>

              <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
                {org1
                  ? `Conoce los programas de eventos, conferencias y talleres organizados por ${org1.name} en la plataforma.`
                  : "Descubre instituciones y empresas que gestionan sus convocatorias con la tecnología de Enquiva."}
              </p>
            </div>

            <Link
              href="/events"
              className="inline-flex w-full items-center justify-center rounded-xl border border-border/90 bg-background px-4 py-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
            >
              Explorar eventos
            </Link>
          </div>

          {/* Card 2: Organización Top 2 o Invitar Organizador */}
          <div
            className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-6 shadow-sm transition-all hover:border-primary/40"
            data-aos="fade-up"
            data-aos-delay="120"
          >
            <div>
              <div className="mb-4 flex items-center justify-between">
                <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-500 dark:text-blue-400">
                  {org2 ? "Organizador Verificado" : "Alianzas y Redes"}
                </span>
                <span className="text-xs text-muted-foreground">Comunidad</span>
              </div>

              <div className="mb-3 flex items-center gap-3">
                {org2?.logoUrl ? (
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
                    <Image src={org2.logoUrl} alt={org2.name} fill className="object-cover" />
                  </div>
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 text-blue-500">
                    <Users2 className="h-6 w-6" />
                  </div>
                )}
                <div>
                  <h4 className="text-base font-bold text-foreground">
                    {org2 ? org2.name : "Red de Creadores"}
                  </h4>
                  <p className="text-xs text-muted-foreground">Productores y formadores</p>
                </div>
              </div>

              <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
                {org2
                  ? `Conéctate con ${org2.name} y participa en sus actividades académicas y encuentros profesionales.`
                  : "Únete a la red de creadores independientes que impulsan la cultura, tecnología y negocios en la región."}
              </p>
            </div>

            <Link
              href="/events"
              className="inline-flex w-full items-center justify-center rounded-xl border border-border/90 bg-background px-4 py-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
            >
              Ver actividades
            </Link>
          </div>

          {/* Card 3: Tarjeta oscura de captura de organizadores */}
          <div
            className="flex flex-col justify-between rounded-2xl border border-zinc-800 bg-[#121216] p-6 text-white shadow-xl transition-all hover:border-primary/60"
            data-aos="fade-up"
            data-aos-delay="160"
          >
            <div>
              <span className="mb-3 inline-block text-xs font-bold uppercase tracking-wider text-primary">
                ¿Eres organizador de eventos?
              </span>

              <h4 className="mb-3 text-lg font-bold leading-snug text-white">
                Gestiona tus inscripciones y cobra entradas con cero complicaciones
              </h4>

              <p className="mb-6 text-sm leading-relaxed text-zinc-300">
                Publica en minutos, emite tickets con QR dinámico, controla accesos con nuestra app y recibe liquidaciones automáticas.
              </p>
            </div>

            <Link
              href="/dashboard"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/30 transition-all duration-200 active:scale-98 hover:bg-primary/95 hover:shadow-xl hover:shadow-primary/45 hover:brightness-105"
            >
              Publica tu evento gratis
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
