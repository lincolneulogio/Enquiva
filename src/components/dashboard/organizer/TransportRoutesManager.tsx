"use client";

import { useState, useTransition, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Pencil, Bus, Users, Check, X, MapPin, Smartphone, QrCode, Wallet, Clock, RefreshCw, CreditCard, AlertTriangle } from "lucide-react";
import {
    createRoute,
    updateRoute,
    deleteRoute,
    toggleRouteActive,
    getStopsByRoute,
    createTransportStop,
    deleteTransportStop,
} from "@/actions/transport";
import { getEventPaymentMethods } from "@/actions/payment-methods";
import { useLocale, useTranslations } from "@/components/providers/LocaleProvider";
import { getIntlLocale } from "@/lib/i18n/core";
import { usePersistedState } from "@/hooks/useFormPersistence";
import { formStorageKey } from "@/lib/form-persistence";

interface Route {
    id: string;
    eventId: string;
    name: string;
    departurePoint: string;
    departureTime: Date;
    returnTime: Date | null;
    pricePerSeat: string;
    totalSeats: number;
    description: string | null;
    isActive: boolean;
    bookedSeats: number;
}

interface TransportRoutesManagerProps {
    eventId: string;
    initialRoutes: Route[];
}

const EMPTY_FORM = {
    name: "",
    departurePoint: "",
    departureTime: "",
    returnTime: "",
    pricePerSeat: "",
    totalSeats: "",
    description: "",
};

function toDatetimeLocal(date: Date | null | undefined): string {
    if (!date) return "";
    return new Date(date).toISOString().slice(0, 16);
}

export function TransportRoutesManager({
    eventId,
    initialRoutes,
}: TransportRoutesManagerProps) {
    const t = useTranslations();
    const { locale } = useLocale();
    const [routes, setRoutes] = useState<Route[]>(initialRoutes);
    const [isPending, startTransition] = useTransition();
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [form, setForm, clearForm] = usePersistedState(formStorageKey(`transport.routes.${eventId}`), EMPTY_FORM);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Event payment methods states
    const [eventPaymentMethods, setEventPaymentMethods] = useState<Array<{ id: string; type: string; label: string; phone?: string | null; holderName: string }>>([]);
    const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false);

    useEffect(() => {
        if (!eventId) return;
        (async () => {
            setLoadingPaymentMethods(true);
            try {
                const methods = await getEventPaymentMethods(eventId);
                setEventPaymentMethods(methods);
            } catch (err) {
                console.error("Failed to load event payment methods:", err);
            } finally {
                setLoadingPaymentMethods(false);
            }
        })();
    }, [eventId]);

    // Stops management states
    const [expandedRouteId, setExpandedRouteId] = useState<string | null>(null);
    const [stopsByRoute, setStopsByRoute] = useState<Record<string, { id: string; name: string; latitude: string | null; longitude: string | null }[]>>({});
    const [newStopName, setNewStopName] = useState("");
    const [newStopLat, setNewStopLat] = useState("");
    const [newStopLng, setNewStopLng] = useState("");
    const [stopPending, setStopPending] = useState(false);

    const toggleStops = async (routeId: string) => {
        const id = routeId;
        if (expandedRouteId === id) {
            setExpandedRouteId(null);
            return;
        }

        setExpandedRouteId(id);

        if (!stopsByRoute[id]) {
            try {
                const stopsData = await getStopsByRoute(id);
                setStopsByRoute((prev) => ({
                    ...prev,
                    [id]: stopsData,
                }));
            } catch (error) {
                toast.error("Error al cargar los paraderos.");
            }
        }
    };

    const handleAddStop = async (routeId: string) => {
        if (!newStopName.trim()) {
            toast.error("Por favor, ingresa un nombre para el paradero.");
            return;
        }

        setStopPending(true);
        try {
            const res = await createTransportStop({
                routeId,
                name: newStopName,
                latitude: newStopLat.trim() || null,
                longitude: newStopLng.trim() || null,
            });

            if (res.success && res.stop) {
                setStopsByRoute((prev) => ({
                    ...prev,
                    [routeId]: [...(prev[routeId] || []), res.stop!],
                }));
                setNewStopName("");
                setNewStopLat("");
                setNewStopLng("");
                toast.success("Paradero agregado con éxito.");
            }
        } catch (error) {
            toast.error("Ocurrió un error al guardar el paradero.");
        } finally {
            setStopPending(false);
        }
    };

    const handleDeleteStop = async (routeId: string, stopId: string) => {
        try {
            const res = await deleteTransportStop(stopId);
            if (res.success) {
                setStopsByRoute((prev) => ({
                    ...prev,
                    [routeId]: (prev[routeId] || []).filter((s) => s.id !== stopId),
                }));
                toast.success("Paradero eliminado con éxito.");
            }
        } catch (error) {
            toast.error("Error al eliminar el paradero.");
        }
    };

    const openCreate = () => {
        setEditId(null);
        clearForm();
        setShowForm(true);
    };

    const openEdit = (r: Route) => {
        setEditId(r.id);
        setForm({
            name: r.name,
            departurePoint: r.departurePoint,
            departureTime: toDatetimeLocal(r.departureTime),
            returnTime: toDatetimeLocal(r.returnTime),
            pricePerSeat: r.pricePerSeat,
            totalSeats: r.totalSeats.toString(),
            description: r.description ?? "",
        });
        setShowForm(true);
    };

    const handleSubmit = () => {
        const price = parseFloat(form.pricePerSeat);
        const seats = parseInt(form.totalSeats);

        if (!form.name.trim() || !form.departurePoint.trim() || !form.departureTime) {
            toast.error(t("transport.manager.requiredFields"));
            return;
        }
        if (isNaN(price) || price < 0) {
            toast.error(t("transport.manager.invalidPrice"));
            return;
        }
        if (isNaN(seats) || seats < 1) {
            toast.error(t("transport.manager.invalidSeats"));
            return;
        }

        startTransition(async () => {
            try {
                if (editId) {
                    await updateRoute(editId, {
                        name: form.name,
                        departurePoint: form.departurePoint,
                        departureTime: form.departureTime,
                        returnTime: form.returnTime || null,
                        pricePerSeat: price,
                        totalSeats: seats,
                        description: form.description || null,
                    });
                    setRoutes((prev) =>
                        prev.map((r) =>
                            r.id === editId
                                ? {
                                    ...r,
                                    name: form.name,
                                    departurePoint: form.departurePoint,
                                    departureTime: new Date(form.departureTime),
                                    returnTime: form.returnTime ? new Date(form.returnTime) : null,
                                    pricePerSeat: price.toFixed(2),
                                    totalSeats: seats,
                                    description: form.description || null,
                                }
                                : r
                        )
                    );
                    toast.success(t("transport.manager.routeUpdated"));
                } else {
                    const result = await createRoute({
                        eventId,
                        name: form.name,
                        departurePoint: form.departurePoint,
                        departureTime: form.departureTime,
                        returnTime: form.returnTime || null,
                        pricePerSeat: price,
                        totalSeats: seats,
                        description: form.description || null,
                    });
                    if (result.success && result.route) {
                        setRoutes((prev) => [
                            ...prev,
                            { ...result.route, bookedSeats: 0 } as Route,
                        ]);
                    }
                    toast.success(t("transport.manager.routeCreated"));
                }
                setShowForm(false);
                setEditId(null);
                clearForm();
            } catch (e) {
                toast.error(e instanceof Error ? e.message : t("transport.manager.saveError"));
            }
        });
    };

    const handleDelete = (routeId: string) => {
        const id = routeId;
        setDeletingId(id);
        startTransition(async () => {
            try {
                await deleteRoute(id);
                setRoutes((prev) => prev.filter((r) => r.id !== id));
                toast.success(t("transport.manager.routeDeleted"));
            } catch (e) {
                toast.error(e instanceof Error ? e.message : t("transport.manager.deleteError"));
            } finally {
                setDeletingId(null);
            }
        });
    };

    const handleToggle = (routeId: string, current: boolean) => {
        startTransition(async () => {
            try {
                await toggleRouteActive(routeId, !current);
                setRoutes((prev) =>
                    prev.map((r) => (r.id === routeId ? { ...r, isActive: !current } : r))
                );
                toast.success(!current ? t("transport.manager.routeActivated") : t("transport.manager.routeDeactivated"));
            } catch {
                toast.error(t("transport.manager.toggleError"));
            }
        });
    };

    const inputClass =
        "w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Bus className="h-5 w-5 text-blue-500" />
                    <h2 className="text-lg font-semibold text-foreground">{t("transport.manager.title")}</h2>
                </div>
                <button
                    type="button"
                    onClick={openCreate}
                    className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                    <Plus className="h-4 w-4" /> {t("transport.manager.newRoute")}
                </button>
            </div>

            {/* Form */}
            {showForm && (
                <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
                    <h3 className="font-medium text-foreground">
                        {editId ? t("transport.manager.editRoute") : t("transport.manager.newTransportRoute")}
                    </h3>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <label className="mb-1.5 block text-sm font-medium text-foreground">
                                {t("transport.manager.routeName")}
                            </label>
                            <input
                                className={inputClass}
                                placeholder={t("transport.manager.routeNamePlaceholder")}
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                            />
                        </div>

                        <div className="sm:col-span-2">
                            <label className="mb-1.5 block text-sm font-medium text-foreground">
                                {t("transport.manager.departurePoint")}
                            </label>
                            <input
                                className={inputClass}
                                placeholder={t("transport.manager.departurePointPlaceholder")}
                                value={form.departurePoint}
                                onChange={(e) => setForm({ ...form, departurePoint: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-foreground">
                                {t("transport.manager.departureTime")}
                            </label>
                            <input
                                type="datetime-local"
                                className={inputClass}
                                value={form.departureTime}
                                onChange={(e) => setForm({ ...form, departureTime: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-foreground">
                                {t("transport.manager.returnTime")}{" "}
                                <span className="font-normal text-muted-foreground">{t("transport.booking.optional")}</span>
                            </label>
                            <input
                                type="datetime-local"
                                className={inputClass}
                                value={form.returnTime}
                                onChange={(e) => setForm({ ...form, returnTime: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-foreground">
                                {t("transport.manager.seatPrice") || "Precio por asiento (S/.) *"}{" "}
                                <span className="text-xs font-normal text-muted-foreground">({t("transport.manager.roundTrip") || "Ida y Vuelta"})</span>
                            </label>
                            <input
                                type="number"
                                min={0}
                                step="0.50"
                                className={inputClass}
                                placeholder={t("transport.manager.pricePlaceholderWithNote") || "Ej: 15.00 (Incluye ida y vuelta)"}
                                value={form.pricePerSeat}
                                onChange={(e) => setForm({ ...form, pricePerSeat: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-foreground">
                                {t("transport.manager.totalSeats")}
                            </label>
                            <input
                                type="number"
                                min={1}
                                className={inputClass}
                                placeholder={t("transport.manager.seatsPlaceholder")}
                                value={form.totalSeats}
                                onChange={(e) => setForm({ ...form, totalSeats: e.target.value })}
                            />
                        </div>

                        {/* payment methods warning or info */}
                        <div className="sm:col-span-2 rounded-2xl border border-border/60 bg-muted/20 p-4 space-y-3">
                            <span className="block text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                                <Wallet className="h-4 w-4 text-primary" />
                                {locale === "en" ? "Event Payment Methods" : "Medios de Pago Habilitados para el Transporte"}
                            </span>
                            {loadingPaymentMethods ? (
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                                    <span>{t("common.loading") || "Cargando..."}</span>
                                </div>
                            ) : eventPaymentMethods.length === 0 ? (
                                <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3 text-xs text-amber-800 dark:border-amber-800/40 dark:bg-amber-950/20 dark:text-amber-300 flex gap-2.5 items-start">
                                    <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-medium">
                                            {locale === "en" 
                                                ? "No payment methods configured for this event. Attendees won't be able to pay for their transport tickets." 
                                                : "No hay medios de pago configurados para este evento. Los participantes no podrán pagar sus asientos de transporte."}
                                        </p>
                                        <p className="mt-1">
                                            <a href={`/organizer/events/${eventId}`} className="font-semibold underline hover:text-primary transition-colors">
                                                {locale === "en" ? "Configure payment methods in the event details" : "Configura los medios de pago en la edición del evento"}
                                            </a>
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <p className="text-xs text-muted-foreground">
                                        {(!form.pricePerSeat || parseFloat(form.pricePerSeat) === 0 || isNaN(parseFloat(form.pricePerSeat))) 
                                            ? (locale === "en" 
                                                ? "If you set a seat price greater than 0, attendees will pay using these payment methods configured for the event:" 
                                                : "Si estableces un precio por asiento mayor a 0, los participantes pagarán usando estos medios de pago configurados para el evento:")
                                            : (locale === "en" 
                                                ? "Attendees will pay for their seat using the payment methods configured for this event:" 
                                                : "Los participantes pagarán por su asiento usando los medios de pago configurados para este evento:")
                                        }
                                    </p>
                                    <div className="flex flex-wrap gap-2 pt-1">
                                        {eventPaymentMethods.map((pm) => {
                                            const IconMap: Record<string, React.ComponentType<{ className?: string }>> = { yape: Smartphone, plin: QrCode, cash: Wallet };
                                            const PmIcon = IconMap[pm.type] ?? Wallet;
                                            return (
                                                <div
                                                    key={pm.id}
                                                    className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-background px-3 py-1.5 text-xs font-semibold text-foreground select-none hover:shadow-sm hover:translate-y-[-1px] transition-all duration-200"
                                                >
                                                    <PmIcon className="h-3.5 w-3.5 text-primary shrink-0" />
                                                    <span>{pm.label}</span>
                                                    <span className="text-[10px] text-muted-foreground font-normal">({pm.holderName})</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="sm:col-span-2">
                            <label className="mb-1.5 block text-sm font-medium text-foreground">
                                {t("transport.manager.description")}{" "}
                                <span className="font-normal text-muted-foreground">{t("transport.booking.optional")}</span>
                            </label>
                            <textarea
                                rows={2}
                                className={`${inputClass} resize-none`}
                                placeholder={t("transport.manager.descriptionPlaceholder")}
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => {
                                setShowForm(false);
                                setEditId(null);
                            }}
                            className="rounded-xl border border-border px-4 py-2 text-sm hover:bg-secondary transition-colors"
                        >
                            {t("common.cancel") || "Cancelar"}
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isPending}
                            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                        >
                            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                            {editId ? t("common.saveChanges") : t("transport.manager.createRoute")}
                        </button>
                    </div>
                </div>
            )}

            {/* Routes list */}
            {routes.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-10 text-center">
                    <Bus className="mx-auto h-10 w-10 text-muted-foreground/30" />
                    <p className="mt-3 text-sm text-muted-foreground">
                        {t("transport.manager.noRoutes")}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {routes.map((route) => {
                        const available = route.totalSeats - route.bookedSeats;
                        const occupancy = Math.round((route.bookedSeats / route.totalSeats) * 100);

                        return (
                            <div
                                key={route.id}
                                className={`rounded-2xl border p-5 transition-opacity ${route.isActive ? "border-border bg-card" : "border-border/50 bg-secondary/40 opacity-60"
                                    }`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1 space-y-3">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="font-semibold text-foreground text-lg leading-snug">{route.name}</h3>
                                            {!route.isActive && (
                                                <span className="rounded-full bg-muted border border-border/80 px-2.5 py-0.5 text-xs text-muted-foreground font-semibold">
                                                    {t("transport.manager.inactive")}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                                            <MapPin className="h-4 w-4 text-primary shrink-0" />
                                            <span>{route.departurePoint}</span>
                                        </p>
                                        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground items-center leading-relaxed">
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                                <span>
                                                    {t("transport.manager.departure")}:{" "}
                                                    {new Date(route.departureTime).toLocaleString(getIntlLocale(locale), {
                                                        dateStyle: "short",
                                                        timeStyle: "short",
                                                    })}
                                                </span>
                                            </span>
                                            {route.returnTime && (
                                                <span className="flex items-center gap-1">
                                                    <RefreshCw className="h-3 w-3 text-muted-foreground shrink-0" />
                                                    <span>
                                                        {t("transport.manager.return")}:{" "}
                                                        {new Date(route.returnTime).toLocaleString(getIntlLocale(locale), {
                                                            dateStyle: "short",
                                                            timeStyle: "short",
                                                        })}
                                                    </span>
                                                </span>
                                            )}
                                            <span className="font-medium text-foreground">
                                                S/. {Number(route.pricePerSeat).toFixed(2)} / {t("transport.manager.perSeatRoundTrip") || "Asiento (Ida y Vuelta)"}
                                            </span>
                                            {Number(route.pricePerSeat) > 0 && eventPaymentMethods.length > 0 && (
                                                <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-[10px] text-primary font-bold shadow-3xs" title={locale === "en" ? "Available payments" : "Métodos de pago disponibles"}>
                                                    <CreditCard className="h-3.5 w-3.5" />
                                                    <span>{eventPaymentMethods.map(m => m.label.toUpperCase()).join(" / ")}</span>
                                                </span>
                                            )}
                                        </div>

                                        {/* Occupancy bar */}
                                        <div className="mt-3 flex items-center gap-3">
                                            <div className="h-1.5 flex-1 rounded-full bg-secondary">
                                                <div
                                                    className={`h-1.5 rounded-full transition-all ${occupancy >= 90
                                                        ? "bg-destructive"
                                                        : occupancy >= 70
                                                            ? "bg-amber-500"
                                                            : "bg-green-500"
                                                        }`}
                                                    style={{ width: `${Math.min(occupancy, 100)}%` }}
                                                />
                                            </div>
                                            <span className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                                                <Users className="h-3 w-3" />
                                                {route.bookedSeats}/{route.totalSeats} ({available} {t("transport.manager.freeSeats")})
                                            </span>
                                        </div>

                                        {/* Paraderos Button */}
                                        <div className="mt-3">
                                            <button
                                                type="button"
                                                onClick={() => toggleStops(route.id)}
                                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline transition-all"
                                            >
                                                <MapPin className="h-3.5 w-3.5" />
                                                {expandedRouteId === route.id ? "Ocultar Paraderos" : "Gestionar Paraderos"}
                                            </button>
                                        </div>

                                        {/* Collapsible Stops Panel */}
                                        {expandedRouteId === route.id && (
                                            <div className="mt-4 rounded-xl border border-border/80 bg-muted/20 p-4 space-y-4 animate-in fade-in-50 duration-200">
                                                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                                                    <MapPin className="h-3.5 w-3.5 text-primary" />
                                                    Paraderos Intermedios
                                                </h4>
                                                
                                                {(!stopsByRoute[route.id] || stopsByRoute[route.id].length === 0) ? (
                                                    <p className="text-xs text-muted-foreground">
                                                        No hay paraderos adicionales configurados para esta ruta. Los pasajeros subirán en el punto de salida general.
                                                    </p>
                                                ) : (
                                                    <div className="space-y-2">
                                                        {stopsByRoute[route.id].map((stop) => (
                                                            <div
                                                                key={stop.id}
                                                                className="flex items-center justify-between rounded-lg bg-background p-2.5 text-xs border border-border/60 hover:shadow-xs transition-all"
                                                            >
                                                                <div className="min-w-0 flex-1 pr-2">
                                                                    <p className="font-semibold text-foreground">{stop.name}</p>
                                                                    {stop.latitude && stop.longitude && (
                                                                        <a
                                                                            href={`https://www.google.com/maps/search/?api=1&query=${stop.latitude},${stop.longitude}`}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="inline-block mt-0.5 text-[10px] text-primary hover:underline"
                                                                        >
                                                                            Ver en Google Maps ({stop.latitude}, {stop.longitude})
                                                                        </a>
                                                                    )}
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDeleteStop(route.id, stop.id)}
                                                                    className="rounded p-1.5 text-destructive hover:bg-destructive/10 transition-colors"
                                                                    title="Eliminar paradero"
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Add Stop Form */}
                                                <div className="border-t border-border/60 pt-3.5 space-y-3">
                                                    <span className="block text-xs font-bold text-foreground">
                                                        Agregar Paradero Intermedio
                                                    </span>
                                                    <div className="grid gap-2 sm:grid-cols-3">
                                                        <div className="sm:col-span-1">
                                                            <input
                                                                type="text"
                                                                placeholder="Nombre (ej: Óvalo Grau)"
                                                                value={newStopName}
                                                                onChange={(e) => setNewStopName(e.target.value)}
                                                                className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                                                            />
                                                        </div>
                                                        <div>
                                                            <input
                                                                type="text"
                                                                placeholder="Latitud (opcional)"
                                                                value={newStopLat}
                                                                onChange={(e) => setNewStopLat(e.target.value)}
                                                                className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                                                            />
                                                        </div>
                                                        <div>
                                                            <input
                                                                type="text"
                                                                placeholder="Longitud (opcional)"
                                                                value={newStopLng}
                                                                onChange={(e) => setNewStopLng(e.target.value)}
                                                                className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                                                            />
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleAddStop(route.id)}
                                                        disabled={stopPending || !newStopName.trim()}
                                                        className="inline-flex items-center gap-1 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/95 disabled:opacity-50 transition-colors"
                                                    >
                                                        {stopPending ? (
                                                            <Loader2 className="h-3 w-3 animate-spin" />
                                                        ) : (
                                                            <Plus className="h-3 w-3" />
                                                        )}
                                                        Agregar Paradero
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2 shrink-0 md:justify-end">
                                        {/* Toggle Active Button */}
                                        <button
                                            type="button"
                                            onClick={() => handleToggle(route.id, route.isActive)}
                                            disabled={isPending}
                                            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold shadow-2xs hover:shadow-xs hover:translate-y-[-0.5px] active:translate-y-[0.5px] transition-all disabled:opacity-50 select-none ${
                                                route.isActive
                                                    ? "bg-destructive/5 text-destructive border-destructive/20 hover:bg-destructive/10 dark:bg-destructive/10 dark:border-destructive/30"
                                                    : "bg-primary/5 text-primary border-primary/20 hover:bg-primary/10 dark:bg-primary/10 dark:border-primary/30"
                                            }`}
                                        >
                                            {route.isActive ? (
                                                <>
                                                    <X className="h-3.5 w-3.5 text-destructive" />
                                                    <span>{locale === "en" ? "Deactivate" : "Desactivar"}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Check className="h-3.5 w-3.5 text-primary" />
                                                    <span>{locale === "en" ? "Activate" : "Activar"}</span>
                                                </>
                                            )}
                                        </button>

                                        {/* Edit Button */}
                                        <button
                                            type="button"
                                            onClick={() => openEdit(route)}
                                            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground shadow-2xs hover:shadow-xs hover:bg-secondary hover:translate-y-[-0.5px] active:translate-y-[0.5px] transition-all select-none"
                                        >
                                            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                                            <span>{locale === "en" ? "Edit" : "Editar"}</span>
                                        </button>

                                        {/* Delete Button */}
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(route.id)}
                                            disabled={isPending && deletingId === route.id}
                                            className="inline-flex items-center gap-1.5 rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-1.5 text-xs font-semibold text-destructive shadow-2xs hover:shadow-xs hover:bg-destructive/10 hover:translate-y-[-0.5px] active:translate-y-[0.5px] transition-all disabled:opacity-50 select-none"
                                        >
                                            {isPending && deletingId === route.id ? (
                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            ) : (
                                                <Trash2 className="h-3.5 w-3.5" />
                                            )}
                                            <span>{locale === "en" ? "Delete" : "Eliminar"}</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
