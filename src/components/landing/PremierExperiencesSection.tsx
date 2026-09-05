"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Sparkles, Building2, Users2, ArrowRight } from "lucide-react";

interface GalleryItem {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
  tag: string;
  link: string;
}

const GALLERY_ITEMS: GalleryItem[] = [
  {
    id: "exp-1",
    title: "Creando el futuro del cine digital y producción virtual",
    category: "Masterclass • Cine Tech",
    tag: "Exclusivo",
    imageUrl:
      "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&auto=format&fit=crop&q=80",
    link: "/events",
  },
  {
    id: "exp-2",
    title: "Metodologías ágiles en producción audiovisual y streaming",
    category: "Taller práctico • Workflow",
    tag: "Certificado",
    imageUrl:
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80",
    link: "/events",
  },
  {
    id: "exp-3",
    title: "Inteligencia artificial aplicada a efectos visuales y render",
    category: "Conferencia • VFX & AI",
    tag: "Tendencia",
    imageUrl:
      "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80",
    link: "/events",
  },
  {
    id: "exp-4",
    title: "Renderizado 3D en tiempo real con Unreal Engine 5",
    category: "Masterclass • Motores 3D",
    tag: "Avanzado",
    imageUrl:
      "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80",
    link: "/events",
  },
];

export function PremierExperiencesSection() {
  const [scrollIndex, setScrollIndex] = useState(0);

  const handlePrev = () => {
    setScrollIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setScrollIndex((prev) => Math.min(GALLERY_ITEMS.length - 1, prev + 1));
  };

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
            Aprende, conecta y crece con eventos diseñados por los mejores creadores de la industria.
          </p>
        </div>

        {/* Sub-header con categoría actual y botones de navegación de carrusel */}
        <div
          className="mb-6 flex items-center justify-between border-b border-border/70 pb-4"
          data-aos="fade-up"
          data-aos-delay="50"
        >
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-primary" />
            <h3 className="text-sm font-bold text-foreground sm:text-base">
              Cinema Tech & AI para desarrolladores
            </h3>
          </div>

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
              disabled={scrollIndex >= GALLERY_ITEMS.length - 1}
              aria-label="Siguiente"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border/80 bg-card text-foreground transition-colors hover:bg-muted disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Fila de 4 tarjetas de galería visual */}
        <div className="mb-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {GALLERY_ITEMS.map((item, idx) => (
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

        {/* 3 Tarjetas promocionales y de organizadores inferiores */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Card 1: Patrocinador / Conferencia */}
          <div
            className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-6 shadow-sm transition-all hover:border-primary/40"
            data-aos="fade-up"
            data-aos-delay="80"
          >
            <div>
              <div className="mb-4 flex items-center justify-between">
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  Patrocinado • Conferencia
                </span>
                <span className="text-xs text-muted-foreground">Tech Partner</span>
              </div>

              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-foreground">
                    Centro de Inteligencia Artificial
                  </h4>
                  <p className="text-xs text-muted-foreground">Comunidad de I+D y software</p>
                </div>
              </div>

              <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
                Descubre las investigaciones pioneras, programas de aceleración y becas para creadores de software e inteligencia artificial.
              </p>
            </div>

            <Link
              href="/events"
              className="inline-flex w-full items-center justify-center rounded-xl border border-border/90 bg-background px-4 py-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
            >
              Ver patrocinador
            </Link>
          </div>

          {/* Card 2: Comunidad / Taller */}
          <div
            className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-6 shadow-sm transition-all hover:border-primary/40"
            data-aos="fade-up"
            data-aos-delay="120"
          >
            <div>
              <div className="mb-4 flex items-center justify-between">
                <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-500 dark:text-blue-400">
                  Comunidad • Taller
                </span>
                <span className="text-xs text-muted-foreground">1.2k Miembros</span>
              </div>

              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 text-blue-500">
                  <Users2 className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-foreground">
                    Creative Producers Alliance
                  </h4>
                  <p className="text-xs text-muted-foreground">Red de productores y directores</p>
                </div>
              </div>

              <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
                Comunidad activa de más de 1,200 creadores de contenido, productores de eventos y técnicos con encuentros mensuales y networking.
              </p>
            </div>

            <Link
              href="/events"
              className="inline-flex w-full items-center justify-center rounded-xl border border-border/90 bg-background px-4 py-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
            >
              Explorar comunidad
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
