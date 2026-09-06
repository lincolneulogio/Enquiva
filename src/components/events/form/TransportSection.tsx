"use client";

import React from "react";
import { Bus, Loader2 } from "lucide-react";
import { TransportRoutesManager } from "@/components/dashboard/organizer/TransportRoutesManager";
import type { Event } from "@/lib/db/schema";
import type { getRoutesByEvent } from "@/actions/transport";

type TransportRouteList = Awaited<ReturnType<typeof getRoutesByEvent>>;

interface TransportSectionProps {
    hasTransport?: boolean;
    event?: Event;
    loadingRoutes: boolean;
    routes: TransportRouteList;
    watchedTitle?: string;
    watchedDateTime?: string;
    watchedEndDate?: string;
    watchedLocation?: string;
    isVirtual?: boolean;
    watchedLatitude?: number | null;
    watchedLongitude?: number | null;
}

export function TransportSection({
    hasTransport,
    event,
    loadingRoutes,
    routes,
    watchedTitle,
    watchedDateTime,
    watchedEndDate,
    watchedLocation,
    isVirtual,
    watchedLatitude,
    watchedLongitude,
}: TransportSectionProps) {
    if (!hasTransport) return null;

    return (
        <div className="mt-6 space-y-4">
            {event?.id ? (
                loadingRoutes ? (
                    <div className="rounded-2xl border border-border bg-card p-8 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        <span className="ml-2 text-sm text-muted-foreground">
                            Cargando rutas de transporte...
                        </span>
                    </div>
                ) : (
                    <div className="rounded-3xl border border-border bg-card p-5 sm:p-6">
                        <TransportRoutesManager
                            eventId={event.id}
                            initialRoutes={routes}
                            eventInfo={{
                                title: watchedTitle || event.title,
                                date: watchedDateTime || event.date,
                                endDate: watchedEndDate || event.endDate,
                                location: watchedLocation ?? event.location,
                                isVirtual: Boolean(isVirtual),
                                latitude:
                                    typeof watchedLatitude === "number"
                                        ? watchedLatitude
                                        : typeof event.latitude === "number"
                                          ? event.latitude
                                          : null,
                                longitude:
                                    typeof watchedLongitude === "number"
                                        ? watchedLongitude
                                        : typeof event.longitude === "number"
                                          ? event.longitude
                                          : null,
                            }}
                        />
                    </div>
                )
            ) : (
                <div className="rounded-3xl border border-primary/20 bg-primary/5 p-6 space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                            <Bus className="h-5 w-5 animate-pulse" />
                        </div>
                        <div>
                            <p className="mb-1 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-background/70 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                                Transporte
                            </p>
                            <h3 className="font-display font-semibold text-foreground">
                                Configuración de Rutas de Transporte
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                El transporte para este evento quedará habilitado automáticamente.
                            </p>
                        </div>
                    </div>
                    <div className="rounded-xl bg-card border border-border p-4 text-sm text-muted-foreground">
                        Al guardar este evento podrás añadir rutas, horarios y precios. El QR de entrada y el bus
                        se pagan por separado.
                    </div>
                </div>
            )}
        </div>
    );
}
