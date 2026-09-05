"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Calendar, MapPin, Sparkles, Tag, CheckCircle2 } from "lucide-react";
import type { Event } from "@/lib/db/schema";
import type { Locale } from "@/lib/i18n/core";

export interface DisplayEvent {
  id: string;
  slug: string;
  title: string;
  category: string;
  categoryLabel: string;
  description: string;
  dateStr: string;
  locationStr: string;
  priceStr: string;
  imageUrl: string;
  badge?: string;
  actionLabel: string;
  actionVariant: "primary" | "dark";
}

const FALLBACK_EVENTS: DisplayEvent[] = [
  {
    id: "fb-1",
    slug: "ai-dev-summit-2026",
    title: "AI & Dev Summit 2026: The Future of Agents",
    category: "tech",
    categoryLabel: "Tecnología & Devs",
    description:
      "La cumbre líder sobre inteligencia artificial, agentes autónomos y arquitecturas modernas en la nube.",
    dateStr: "15 OCT • 09:00 AM",
    locationStr: "Lima, PE",
    priceStr: "S/ 89",
    imageUrl:
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80",
    badge: "En vivo",
    actionLabel: "Ver evento",
    actionVariant: "dark",
  },
  {
    id: "fb-2",
    slug: "startup-acceleration-forum",
    title: "Startup Acceleration & Angel Forum",
    category: "business",
    categoryLabel: "Negocios y Startups",
    description:
      "Conoce a inversores ángeles, fondos de venture capital y fundadores de startups de alto crecimiento.",
    dateStr: "22 OCT • 06:30 PM",
    locationStr: "San Isidro",
    priceStr: "Entrada libre",
    imageUrl:
      "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=80",
    badge: "Networking",
    actionLabel: "Inscribirme",
    actionVariant: "primary",
  },
  {
    id: "fb-3",
    slug: "lima-music-fest-noche-electronica",
    title: "Lima Music Fest: Noche Electrónica & Arte Visual",
    category: "art",
    categoryLabel: "Arte y Entretenimiento",
    description:
      "Una experiencia inmersiva con DJs internacionales, mapping 3D y sonido envolvente de última generación.",
    dateStr: "05 NOV • 08:00 PM",
    locationStr: "Arena 1",
    priceStr: "Desde S/ 120",
    imageUrl:
      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80",
    badge: "Música en vivo",
    actionLabel: "Ver evento",
    actionVariant: "dark",
  },
  {
    id: "fb-4",
    slug: "fintech-digital-banking-2026",
    title: "FinTech & Digital Banking: Open Finance & DeFi",
    category: "business",
    categoryLabel: "Negocios y Startups",
    description:
      "Las claves de la banca abierta, pagos instantáneos con QR, tokenización y regulación financiera 2026.",
    dateStr: "12 NOV • 10:00 AM",
    locationStr: "Online / Híbrido",
    priceStr: "S/ 49",
    imageUrl:
      "https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=800&auto=format&fit=crop&q=80",
    badge: "Conferencia",
    actionLabel: "Ver evento",
    actionVariant: "dark",
  },
  {
    id: "fb-5",
    slug: "product-design-ux-conference",
    title: "Product Design & UX Conference: Interfaces del Futuro",
    category: "tech",
    categoryLabel: "Tecnología y Devs",
    description:
      "Sistemas de diseño a escala, micro-animaciones fluidas y accesibilidad web que impulsan la retención.",
    dateStr: "18 NOV • 04:00 PM",
    locationStr: "Miraflores",
    priceStr: "S/ 75",
    imageUrl:
      "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&auto=format&fit=crop&q=80",
    badge: "Taller interactivo",
    actionLabel: "Ver evento",
    actionVariant: "primary",
  },
  {
    id: "fb-6",
    slug: "gourmet-coffee-wine-expo",
    title: "Gourmet Food, Specialty Coffee & Wine Expo",
    category: "art",
    categoryLabel: "Arte y Entretenimiento",
    description:
      "Feria culinaria con catas guiadas de café de especialidad, degustaciones de vino y masterclasses de chefs.",
    dateStr: "28 NOV • 12:00 PM",
    locationStr: "Barranco",
    priceStr: "S/ 95",
    imageUrl:
      "https://images.unsplash.com/photo-1555244162-803834f70033?w=800&auto=format&fit=crop&q=80",
    badge: "Feria Gastronómica",
    actionLabel: "Ver evento",
    actionVariant: "dark",
  },
];

interface EventsCatalogSectionProps {
  dbEvents?: Array<Event & { attendeeCount?: number }>;
  locale?: Locale;
}

export function EventsCatalogSection({ dbEvents = [] }: EventsCatalogSectionProps) {
  const [activeTab, setActiveTab] = useState<string>("featured");

  // Transformar eventos reales de la base de datos a formato de visualización uniforme
  const transformedDbEvents: DisplayEvent[] = dbEvents.map((e, idx) => {
    const isFree = !e.price || Number(e.price) === 0;
    const priceFormatted = isFree ? "Entrada libre" : `S/ ${Number(e.price).toFixed(2)}`;
    const eventDate = e.date ? new Date(e.date) : new Date();
    const dateFormatted = eventDate.toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "short",
    }).toUpperCase();
    const timeFormatted = eventDate.toLocaleTimeString("es-PE", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    return {
      id: e.id,
      slug: e.slug,
      title: e.title,
      category: e.category?.toLowerCase() || "general",
      categoryLabel: e.category ? e.category.replace(/_/g, " ") : "Evento",
      description: e.description || "Descubre todos los detalles e inscríbete hoy.",
      dateStr: `${dateFormatted} • ${timeFormatted}`,
      locationStr: e.location || (e.isVirtual ? "Online" : "Lima, PE"),
      priceStr: priceFormatted,
      imageUrl:
        e.coverImage ||
        FALLBACK_EVENTS[idx % FALLBACK_EVENTS.length].imageUrl,
      badge: e.isFeatured ? "Destacado" : e.isVirtual ? "Online" : "Presencial",
      actionLabel: "Ver evento",
      actionVariant: idx % 2 === 0 ? "primary" : "dark",
    };
  });

  // Combinar los eventos reales de la DB con los eventos de fallback para garantizar siempre 6 tarjetas completas
  const combinedEvents: DisplayEvent[] = [...transformedDbEvents];
  for (const fallback of FALLBACK_EVENTS) {
    if (combinedEvents.length >= 6) break;
    if (!combinedEvents.some((e) => e.slug === fallback.slug)) {
      combinedEvents.push(fallback);
    }
  }

  // Filtrar según píldora seleccionada
  const filteredEvents = combinedEvents.filter((ev) => {
    if (activeTab === "featured") return true;
    if (activeTab === "tech") return ev.category.includes("tech") || ev.category.includes("tecnologia");
    if (activeTab === "business") return ev.category.includes("business") || ev.category.includes("negocios");
    if (activeTab === "art") return ev.category.includes("art") || ev.category.includes("entretenimiento");
    return true;
  });

  const displayList = filteredEvents.slice(0, 6);

  const tabs = [
    { id: "featured", label: "★ Destacados de la semana" },
    { id: "tech", label: "Tecnología y Devs" },
    { id: "business", label: "Negocios y Startups" },
    { id: "art", label: "Arte y Entretenimiento" },
  ];

  return (
    <section className="px-4 pb-16 pt-2 sm:px-6 lg:pb-24">
      <div
        className="mx-auto max-w-7xl rounded-3xl border border-border/75 bg-card/60 p-6 shadow-xl backdrop-blur-md sm:p-8 lg:p-10"
        data-aos="fade-up"
      >
        {/* Píldoras de filtrado horizontal */}
        <div className="mb-8 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-full px-5 py-2 text-xs font-semibold transition-all duration-200 sm:text-sm ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "border border-border/80 bg-card text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Cuadrícula de 6 tarjetas (2 filas x 3 columnas) */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {displayList.map((event, idx) => (
            <div
              key={event.id}
              className="group flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10"
              data-aos="fade-up"
              data-aos-delay={String(60 + idx * 50)}
            >
              {/* Imagen con badges superiores */}
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
                <Image
                  src={event.imageUrl}
                  alt={event.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                {/* Badge de fecha o categoría sobre la imagen */}
                <div className="absolute left-3 top-3 flex items-center gap-1.5">
                  <span className="rounded-md bg-black/60 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur-md">
                    {event.dateStr}
                  </span>
                </div>

                {event.badge && (
                  <div className="absolute right-3 top-3">
                    <span className="rounded-md bg-primary/90 px-2 py-1 text-[11px] font-semibold text-primary-foreground shadow-sm">
                      {event.badge}
                    </span>
                  </div>
                )}
              </div>

              {/* Contenido de la tarjeta */}
              <div className="flex flex-1 flex-col p-5">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary">
                  {event.categoryLabel}
                </p>

                <h3 className="mb-2 line-clamp-2 font-display text-base font-bold text-foreground transition-colors group-hover:text-primary sm:text-lg">
                  <Link href={`/events/${event.slug}`}>{event.title}</Link>
                </h3>

                <p className="mb-4 line-clamp-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                  {event.description}
                </p>

                {/* Pie de tarjeta con precio/ubicación y botón */}
                <div className="mt-auto flex items-center justify-between border-t border-border/70 pt-3">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    <span>{event.locationStr}</span>
                    <span className="text-muted-foreground">•</span>
                    <span className="font-semibold text-primary">{event.priceStr}</span>
                  </div>

                  <Link
                    href={`/events/${event.slug}`}
                    className={`inline-flex items-center rounded-full px-4 py-1.5 text-xs font-bold transition-all duration-200 active:scale-95 ${
                      event.actionVariant === "primary"
                        ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25 hover:bg-primary/95 hover:shadow-md hover:shadow-primary/35 hover:brightness-105"
                        : "bg-foreground text-background hover:bg-foreground/90"
                    }`}
                  >
                    {event.actionLabel}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Enlace inferior de catálogo completo */}
        <div className="mt-10 text-center">
          <Link
            href="/events"
            className="inline-flex items-center gap-2 text-sm font-semibold text-foreground transition-colors hover:text-primary"
          >
            <span>Explora todos los eventos y encuentra tu próxima experiencia.</span>
            <span className="inline-flex items-center text-primary underline underline-offset-4">
              Ver catálogo completo <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
