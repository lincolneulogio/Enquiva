import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin, Ticket } from "lucide-react";
import type { Event } from "@/lib/db/schema";

interface LaunchItem {
  id: string;
  slug: string;
  badge: string;
  badgeColor: string;
  title: string;
  locationAndDate: string;
  priceNote: string;
  remainingSlots?: string;
  imageUrl: string;
  actionLabel: string;
  actionVariant: "primary" | "dark";
}

interface UpcomingLaunchesSectionProps {
  dbEvents?: Array<Event & { attendeeCount?: number }>;
}

export function UpcomingLaunchesSection({ dbEvents = [] }: UpcomingLaunchesSectionProps) {
  if (dbEvents.length === 0) {
    return null;
  }

  // Mapear eventos 100% reales de la base de datos
  const displayItems: LaunchItem[] = dbEvents.map((e, idx) => {
    const isFree = !e.price || Number(e.price) === 0;
    const priceFormatted = isFree ? "Entrada Libre" : `Desde S/ ${Number(e.price).toFixed(2)}`;

    const eventDate = e.date ? new Date(e.date) : new Date();
    const dateFormatted = eventDate.toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "long",
    });
    const locationName = e.location || (e.isVirtual ? "Evento Virtual" : "Lima, PE");

    const remaining =
      e.capacity != null ? Math.max(0, e.capacity - (e.attendeeCount ?? 0)) : null;

    let badge = "PRÓXIMO LANZAMIENTO";
    let badgeColor = "bg-primary/15 text-primary border-primary/30";

    if (e.isFeatured) {
      badge = "DESTACADO";
      badgeColor = "bg-primary/15 text-primary border-primary/30";
    } else if (remaining != null && remaining <= 20) {
      badge = "ÚLTIMOS CUPOS";
      badgeColor = "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30";
    } else if (isFree) {
      badge = "ENTRADA LIBRE";
      badgeColor = "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
    }

    return {
      id: e.id,
      slug: e.slug,
      badge,
      badgeColor,
      title: e.title,
      locationAndDate: `${locationName} • ${dateFormatted}`,
      priceNote: priceFormatted,
      remainingSlots:
        remaining != null ? `Quedan ${remaining} cupos` : isFree ? "Registro libre" : undefined,
      imageUrl:
        e.coverImage ||
        "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&auto=format&fit=crop&q=80",
      actionLabel: isFree ? "Inscribirme" : "Ver tickets",
      actionVariant: idx === 0 || e.isFeatured ? "primary" : "dark",
    };
  });

  return (
    <section className="px-4 py-14 sm:px-6 lg:py-18">
      <div className="mx-auto max-w-7xl">
        {/* Encabezado y enlace derecho */}
        <div
          className="mb-8 flex flex-col justify-between gap-4 border-b border-border/70 pb-5 sm:flex-row sm:items-end"
          data-aos="fade-up"
        >
          <div>
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-0.5 text-xs font-semibold uppercase tracking-wider text-primary">
              <Ticket className="h-3 w-3" />
              Lanzamientos y Tickets
            </div>
            <h2 className="font-display text-2xl font-extrabold text-foreground sm:text-3xl lg:text-4xl">
              Recomendados y Próximos Lanzamientos
            </h2>
            <p className="mt-1 text-sm text-muted-foreground sm:text-base">
              Los eventos más esperados con venta anticipada y beneficios exclusivos.
            </p>
          </div>

          <Link
            href="/events"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:underline hover:underline-offset-4"
          >
            <span>Explora todos los lanzamientos</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Lista vertical de tiras horizontales */}
        <div className="space-y-4">
          {displayItems.map((item, idx) => (
            <div
              key={item.id}
              className="group flex flex-col items-start justify-between gap-4 rounded-2xl border border-border/80 bg-card p-4 shadow-sm transition-all duration-300 hover:border-primary/50 hover:shadow-md sm:flex-row sm:items-center sm:p-5"
              data-aos="fade-up"
              data-aos-delay={String(60 + idx * 50)}
            >
              {/* Lado izquierdo: Thumbnail + Info */}
              <div className="flex w-full items-center gap-4 sm:w-auto">
                <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-muted sm:h-20 sm:w-28">
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    fill
                    sizes="112px"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span
                      className={`inline-block rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  </div>

                  <h3 className="line-clamp-1 font-display text-sm font-bold text-foreground transition-colors group-hover:text-primary sm:text-base">
                    <Link href={`/events/${item.slug}`}>{item.title}</Link>
                  </h3>

                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 shrink-0 text-primary" />
                    <span className="line-clamp-1">{item.locationAndDate}</span>
                  </p>
                </div>
              </div>

              {/* Lado derecho: Precio + Botón */}
              <div className="flex w-full items-center justify-between gap-4 border-t border-border/60 pt-3 sm:w-auto sm:justify-end sm:border-t-0 sm:pt-0">
                <div className="text-left sm:text-right">
                  <p className="text-sm font-bold text-foreground">{item.priceNote}</p>
                  {item.remainingSlots && (
                    <p className="text-[11px] font-medium text-primary">
                      {item.remainingSlots}
                    </p>
                  )}
                </div>

                <Link
                  href={`/events/${item.slug}`}
                  className={`inline-flex shrink-0 items-center justify-center rounded-full px-6 py-2 text-xs font-bold transition-all duration-200 active:scale-95 ${
                    item.actionVariant === "primary"
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/30 hover:bg-primary/95 hover:shadow-lg hover:shadow-primary/40 hover:brightness-105"
                      : "bg-foreground text-background hover:bg-foreground/90"
                  }`}
                >
                  {item.actionLabel}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
