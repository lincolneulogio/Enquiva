import { Bus, AlertTriangle, Route, MapPin, Clock, ArrowRight } from "lucide-react";
import type { TransportRoute } from "@/lib/db/schema";

interface EventTransportSectionProps {
  routes: TransportRoute[];
  locale: string;
}

export function EventTransportSection({ routes, locale }: EventTransportSectionProps) {
  if (!routes || routes.length === 0) return null;

  const formatRouteDateTime = (dateStr: Date | string | null) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    return date.toLocaleDateString(locale === "en" ? "en-US" : "es-PE", {
      weekday: "long",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="space-y-6 rounded-3xl border border-blue-500/20 bg-gradient-to-br from-blue-50/50 via-background to-indigo-50/30 p-6 shadow-md backdrop-blur-sm sm:p-8 dark:from-blue-950/10 dark:via-background dark:to-indigo-950/5">
      <div className="flex flex-col gap-4 border-b border-border/60 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h3 className="font-display text-lg font-bold text-foreground sm:text-xl flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
              <Bus className="h-4 w-4" />
            </span>
            Servicio de Transporte
          </h3>
          <p className="text-xs text-muted-foreground">
            Coordinado de forma segura para garantizar tu traslado.
          </p>
        </div>
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200/30 bg-blue-500/10 px-3.5 py-1 text-xs font-bold text-blue-600 shadow-sm dark:text-blue-400">
            <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            Costo Adicional
          </span>
        </div>
      </div>

      {/* Warning Alert */}
      <div className="flex items-start gap-3 rounded-2xl border border-amber-200/50 bg-amber-50/85 p-4 shadow-sm dark:border-amber-900/30 dark:bg-amber-950/20">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
        <div className="space-y-1 text-xs leading-relaxed text-amber-900 dark:text-amber-200">
          <p className="font-bold text-amber-800 dark:text-amber-400">
            ¡El transporte NO está incluido en la entrada!
          </p>
          <p>
            El precio de la <strong>Entrada al Evento</strong> es independiente
            del costo del transporte. Los precios indicados en las rutas son{" "}
            <strong>por asiento</strong> y corresponden al pasaje de traslado.
            Deberás seleccionarlo y pagarlo al momento de tu registro.
          </p>
        </div>
      </div>

      {/* Routes List */}
      <div className="space-y-4 pt-2">
        <h4 className="flex items-center gap-2 text-sm font-bold text-foreground">
          <Route className="h-4 w-4 text-primary" />
          Rutas y Puntos de Salida Disponibles
        </h4>

        <div className="grid gap-4">
          {routes.map((route) => (
            <div
              key={route.id}
              className="group flex flex-col justify-between gap-5 rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-500/30 md:flex-row md:items-center"
            >
              <div className="space-y-3">
                <div>
                  <h5 className="flex items-center gap-1.5 text-sm font-bold text-foreground transition-colors group-hover:text-primary">
                    {route.name}
                  </h5>
                  {route.description && (
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {route.description}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-x-6 gap-y-2 text-xs text-muted-foreground sm:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 shrink-0 text-blue-500" />
                    <span>
                      <strong>Partida:</strong> {route.departurePoint}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 shrink-0 text-blue-500" />
                    <span>
                      <strong>Salida:</strong> {formatRouteDateTime(route.departureTime)}
                    </span>
                  </div>
                  {route.returnTime && (
                    <div className="mt-1 flex items-center gap-2 border-t border-border/40 pt-2 sm:col-span-2">
                      <ArrowRight className="h-4 w-4 shrink-0 text-emerald-500" />
                      <span>
                        <strong>Retorno estimado:</strong> {formatRouteDateTime(route.returnTime)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 flex-row items-center justify-between gap-2 border-t border-border/60 pt-4 md:flex-col md:items-end md:justify-center md:border-t-0 md:pt-0">
                <span className="text-[10px] font-bold tracking-wider text-muted-foreground/60 uppercase">
                  Pasaje por asiento
                </span>
                <span className="rounded-2xl border border-primary/20 bg-primary/10 px-4 py-1.5 text-lg font-bold text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                  S/ {Number(route.pricePerSeat).toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
