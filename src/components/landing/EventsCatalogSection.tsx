"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin, Calendar, Sparkles, Users } from "lucide-react";
import type { Event, Category } from "@/lib/db/schema";
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
  attendeeCount: number;
}

export interface EventsCatalogSectionProps {
  dbEvents?: Array<Event & { attendeeCount?: number }>;
  categories?: Pick<Category, "slug" | "label" | "colorClass">[];
  locale?: Locale;
}

export function EventsCatalogSection({
  dbEvents = [],
  categories = [],
  locale = "es",
}: EventsCatalogSectionProps) {
  const [activeTab, setActiveTab] = useState<string>("featured");

  // Transformar eventos 100% reales de la base de datos
  const transformedDbEvents: DisplayEvent[] = dbEvents.map((e, idx) => {
    const isFree = !e.price || Number(e.price) === 0;
    const priceFormatted = isFree
      ? "Entrada libre"
      : `S/ ${Number(e.price).toFixed(2)}`;
    const eventDate = e.date ? new Date(e.date) : new Date();
    const dateFormatted = eventDate
      .toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "short",
      })
      .toUpperCase();
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
      description:
        e.description || "Descubre todos los detalles e inscríbete hoy.",
      dateStr: `${dateFormatted} • ${timeFormatted}`,
      locationStr: e.location || (e.isVirtual ? "Online" : "Lima, PE"),
      priceStr: priceFormatted,
      imageUrl:
        e.coverImage ||
        "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80",
      badge: e.isFeatured ? "Destacado" : e.isVirtual ? "Online" : "Presencial",
      actionLabel: "Ver evento",
      actionVariant: idx % 2 === 0 ? "primary" : "dark",
      attendeeCount: e.attendeeCount ?? 0,
    };
  });

  // Filtrar según píldora seleccionada
  const filteredEvents = transformedDbEvents.filter((ev) => {
    if (activeTab === "featured") return true;
    return ev.category.toLowerCase().includes(activeTab.toLowerCase());
  });

  const displayList = filteredEvents.slice(0, 6);

  // Construir pestañas dinámicas desde la base de datos
  const tabs = [
    { id: "featured", label: "★ Destacados de la semana" },
    ...categories.map((c) => ({ id: c.slug, label: c.label })),
  ];

  return (
    <section className="px-4 pb-16 pt-2 sm:px-6 lg:pb-24">
      <div
        className="mx-auto max-w-7xl rounded-3xl border border-border/75 bg-card/60 p-6 shadow-xl backdrop-blur-md sm:p-8 lg:p-10"
        data-aos="fade-up"
      >
        {/* Píldoras de filtrado horizontal dinámicas */}
        {tabs.length > 1 && (
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
        )}

        {/* Cuadrícula de tarjetas reales */}
        {displayList.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {displayList.map((event, idx) => (
              <div
                key={event.id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm  hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10"
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

                  {/* Badge de fecha sobre la imagen */}
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
                  <div className="flex justify-between items-center">
                    <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-primary">
                      {event.categoryLabel}
                    </p>

                    <span className="font-semibold text-primary text-xl mb-4">
                      {event.priceStr}
                    </span>
                  </div>

                  <h3 className="mb-2 line-clamp-2 font-display text-base font-bold text-foreground transition-colors group-hover:text-primary sm:text-lg">
                    <Link href={`/events/${event.slug}`}>{event.title}</Link>
                  </h3>

                  <p className="mb-4 line-clamp-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                    {event.description}
                  </p>

                  {/* Pie de tarjeta con precio/ubicación y botón */}
                  <div className="mt-auto border-t border-border/70 pt-3">
                    {/* Ubicación */}
                    <div className="flex w-full items-start gap-1.5 text-xs font-medium text-foreground">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />

                      <span className="min-w-0 flex-1 whitespace-normal break-words leading-relaxed">
                        {event.locationStr}
                      </span>
                    </div>

                    {/* Inscritos + Botón */}
                    <div className="mt-3 flex items-center justify-between">
                      {/* Cantidad de inscritos */}
                      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        <span>
                          {event.attendeeCount}{" "}
                          {locale === "en"
                            ? event.attendeeCount === 1
                              ? "attendee"
                              : "attendees"
                            : event.attendeeCount === 1
                              ? "inscrito"
                              : "inscritos"}
                        </span>
                      </div>

                      {/* Botón */}
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
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Calendar className="h-6 w-6" />
            </div>
            <p className="text-base font-bold text-foreground">
              No hay eventos en esta categoría en este momento
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Explora otras categorías o regresa a ver los destacados de la
              semana.
            </p>
            <button
              type="button"
              onClick={() => setActiveTab("featured")}
              className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-4 py-2 text-xs font-bold text-primary transition-colors hover:bg-primary/20"
            >
              Ver todos los destacados
            </button>
          </div>
        )}

        {/* Enlace inferior de catálogo completo */}
        <div className="mt-10 text-center">
          <Link
            href="/events"
            className="inline-flex items-center gap-2 text-sm font-semibold text-foreground transition-colors hover:text-primary"
          >
            <span className="flex items-center">
              Explora todos los eventos y encuentra tu próxima experiencia.
              <ArrowRight className="ml-4 h-4 w-4" />
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
