import { Calendar, CreditCard, QrCode, Bus, Folder, ShieldCheck } from "lucide-react";

export interface EventsCatalogHeroProps {
  totalEvents: number;
  categoryLabel?: string;
  hasCulqi?: boolean;
  hasTransport?: boolean;
  hasQrTickets?: boolean;
}

export function EventsCatalogHero({
  totalEvents,
  categoryLabel,
  hasCulqi = false,
  hasTransport = true,
  hasQrTickets = true,
}: EventsCatalogHeroProps) {
  // Construir tarjetas de beneficios dinámicamente según la configuración de la plataforma
  const benefitCards = [
    {
      id: "payment",
      icon: CreditCard,
      title: "Pago seguro",
      description: hasCulqi
        ? "Checkout online con Culqi, tarjetas bancarias, Yape y billeteras digitales."
        : "Múltiples métodos de pago directo: Yape, Plin, transferencia o efectivo.",
      badge: hasCulqi ? "Culqi Activo" : "Medios Locales",
      badgeColor: "bg-primary/10 text-primary border-primary/20",
    },
    {
      id: "qr",
      icon: QrCode,
      title: "Entrada con QR",
      description: hasQrTickets
        ? "Acceso digital inmediato con código QR dinámico antifraude al confirmar tu inscripción."
        : "Validación digital de ticket para ingreso ágil en puerta.",
      badge: "Garantizado",
      badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    },
    hasTransport
      ? {
          id: "transport",
          icon: Bus,
          title: "Transporte opcional",
          description:
            "Reserva asientos de bus o movilidad coordinada para los eventos que lo ofrezcan.",
          badge: "Rutas Activas",
          badgeColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
        }
      : {
          id: "guarantee",
          icon: ShieldCheck,
          title: "Garantía y Soporte",
          description:
            "Atención personalizada al asistente y soporte en tiempo real ante cualquier duda.",
          badge: "Soporte 24/7",
          badgeColor: "bg-primary/10 text-primary border-primary/20",
        },
  ];

  return (
    <section className="relative w-full border-b border-border/60 bg-gradient-to-b from-primary/[0.04] via-background to-background px-4 pb-10 pt-10 dark:from-primary/[0.06] dark:via-background/50 dark:to-background sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Badge superior */}
        <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-primary">
          <Calendar className="h-3.5 w-3.5" />
          <span>EVENTOS</span>
        </div>

        {/* Titular y subtítulo */}
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          Eventos <span className="text-primary">disponibles</span>
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Descubre los próximos eventos cerca de ti, reserva tu cupo en segundos y conéctate con nuevas experiencias.
        </p>

        {/* Píldoras de estado */}
        <div className="mt-6 flex flex-wrap items-center gap-2.5">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/90 px-3.5 py-1.5 text-xs font-semibold text-foreground shadow-2xs">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{totalEvents} eventos disponibles</span>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/90 px-3.5 py-1.5 text-xs font-semibold text-foreground shadow-2xs">
            <Folder className="h-3.5 w-3.5 text-primary" />
            <span>{categoryLabel ? `Categoría: ${categoryLabel}` : "Explorando todas las categorías"}</span>
          </div>
        </div>

        {/* Tarjetas dinámicas de Beneficios */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {benefitCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card/80 p-5 shadow-2xs backdrop-blur-xs transition-all hover:border-primary/40 hover:shadow-xs"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${card.badgeColor}`}
                  >
                    {card.badge}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-foreground sm:text-base">
                    {card.title}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                    {card.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
