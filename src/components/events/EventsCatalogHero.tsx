import { Calendar, CreditCard, QrCode, Bus, Folder } from "lucide-react";

interface EventsCatalogHeroProps {
  totalEvents: number;
  categoryLabel?: string;
}

export function EventsCatalogHero({
  totalEvents,
  categoryLabel,
}: EventsCatalogHeroProps) {
  return (
    <section className="relative w-full border-b border-border/60 bg-gradient-to-b from-[#FFF5EC]/90 via-[#FAF3EA]/40 to-background/50 px-4 pb-10 pt-10 dark:from-[#181310] dark:via-background/50 dark:to-background sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Badge superior */}
        <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#FF6B00]">
          <Calendar className="h-3.5 w-3.5" />
          <span>EVENTOS</span>
        </div>

        {/* Titular y subtítulo */}
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          Eventos <span className="text-[#FF6B00]">disponibles</span>
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
            <Folder className="h-3.5 w-3.5 text-[#FF6B00]" />
            <span>{categoryLabel ? `Categoría: ${categoryLabel}` : "Explorando todas las categorías"}</span>
          </div>
        </div>

        {/* 3 Tarjetas de Beneficios */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Tarjeta 1 */}
          <div className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card/80 p-5 shadow-2xs backdrop-blur-xs transition-all hover:border-primary/40 hover:shadow-xs">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-[#FF6B00]">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground sm:text-base">
                Pago seguro
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                Culqi, Yape, Plin u otros medios directos del organizador.
              </p>
            </div>
          </div>

          {/* Tarjeta 2 */}
          <div className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card/80 p-5 shadow-2xs backdrop-blur-xs transition-all hover:border-primary/40 hover:shadow-xs">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-[#FF6B00]">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground sm:text-base">
                Entrada con QR
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                Acceso digital inmediato al confirmar tu inscripción o pago.
              </p>
            </div>
          </div>

          {/* Tarjeta 3 */}
          <div className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card/80 p-5 shadow-2xs backdrop-blur-xs transition-all hover:border-primary/40 hover:shadow-xs">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-[#FF6B00]">
              <Bus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground sm:text-base">
                Transporte opcional
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                Reserva asientos de bus o transporte cuando el evento lo ofrezca.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
