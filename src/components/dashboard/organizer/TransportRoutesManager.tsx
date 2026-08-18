"use client";

import { useState, useTransition, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Pencil, Bus, Users, Check, X, MapPin, Smartphone, QrCode, Wallet, Clock, RefreshCw, CreditCard, AlertTriangle, Info, CalendarDays } from "lucide-react";
import {
    createRoute,
    updateRoute,
    deleteRoute,
    toggleRouteActive,
    getStopsByRoute,
    createTransportStop,
    deleteTransportStop,
    updateTransportStop,
} from "@/actions/transport";
import { getEventPaymentMethods } from "@/actions/payment-methods";
import { useLocale, useTranslations } from "@/components/providers/LocaleProvider";
import { getIntlLocale } from "@/lib/i18n/core";
import { usePersistedState } from "@/hooks/useFormPersistence";
import { formStorageKey } from "@/lib/form-persistence";
import { StopMapPicker } from "@/components/dashboard/organizer/StopMapPicker";
import { DateAmPmTimeField } from "@/components/ui/DateAmPmTimeField";
import { TRANSPORT_DEFAULT_PENDING_HOLD_HOURS } from "@/lib/transport/constants";

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
    driverName?: string | null;
    vehiclePlate?: string | null;
    isRoundTrip?: boolean;
    pendingHoldHours?: number;
    isActive: boolean;
    bookedSeats: number;
}

type StopRow = {
    id: string;
    name: string;
    latitude: string | null;
    longitude: string | null;
    sortOrder: number;
    estimatedArrivalTime: Date | string | null;
    maxSeats: number | null;
};

interface TransportRoutesManagerProps {
    eventId: string;
    initialRoutes: Route[];
    /** Datos del evento para alinear horarios y puntos de la ruta */
    eventInfo?: {
        title?: string | null;
        date?: Date | string | null;
        endDate?: Date | string | null;
        location?: string | null;
        isVirtual?: boolean;
        latitude?: number | null;
        longitude?: number | null;
    };
}

const EMPTY_FORM = {
    name: "",
    departurePoint: "",
    departureDate: "",
    departureClock: "",
    returnDate: "",
    returnClock: "",
    pricePerSeat: "",
    totalSeats: "",
    description: "",
    driverName: "",
    vehiclePlate: "",
    isRoundTrip: true,
    pendingHoldHours: String(TRANSPORT_DEFAULT_PENDING_HOLD_HOURS),
};

function pad2(n: number) {
    return String(n).padStart(2, "0");
}

function toLocalDatePart(date: Date | null | undefined): string {
    if (!date) return "";
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return "";
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function toLocalTimePart(date: Date | null | undefined): string {
    if (!date) return "";
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return "";
    return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function combineDateAndTime(datePart: string, timePart: string): string {
    if (!datePart.trim() || !timePart.trim()) return "";
    return `${datePart}T${timePart}`;
}

function todayDatePart(): string {
    return toLocalDatePart(new Date());
}

function isPastCombined(datePart: string, timePart: string): boolean {
    const combined = combineDateAndTime(datePart, timePart);
    if (!combined) return false;
    const parsed = new Date(combined);
    if (Number.isNaN(parsed.getTime())) return true;
    return parsed.getTime() < Date.now() - 60_000;
}

function isPastDatetimeLocal(value: string): boolean {
    if (!value.trim()) return false;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return true;
    return parsed.getTime() < Date.now() - 60_000;
}

export function TransportRoutesManager({
    eventId,
    initialRoutes,
    eventInfo,
}: TransportRoutesManagerProps) {
    const t = useTranslations();
    const { locale } = useLocale();
    const [routes, setRoutes] = useState<Route[]>(initialRoutes);
    const [isPending, startTransition] = useTransition();
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [form, setForm, clearForm] = usePersistedState(formStorageKey(`transport.routes.${eventId}`), EMPTY_FORM);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const [minDate, setMinDate] = useState(todayDatePart());

    useEffect(() => {
        setMinDate(todayDatePart());
        const id = window.setInterval(() => setMinDate(todayDatePart()), 60_000);
        return () => window.clearInterval(id);
    }, []);

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
    const [stopsByRoute, setStopsByRoute] = useState<Record<string, StopRow[]>>({});
    const [newStopName, setNewStopName] = useState("");
    const [newStopLat, setNewStopLat] = useState<number | null>(null);
    const [newStopLng, setNewStopLng] = useState<number | null>(null);
    const [newStopEtaDate, setNewStopEtaDate] = useState("");
    const [newStopEtaClock, setNewStopEtaClock] = useState("");
    const [newStopMaxSeats, setNewStopMaxSeats] = useState("");
    const [stopPending, setStopPending] = useState(false);
    const [departureLat, setDepartureLat] = useState<number | null>(null);
    const [departureLng, setDepartureLng] = useState<number | null>(null);

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
        if (newStopEtaDate || newStopEtaClock) {
            if (!newStopEtaDate || !newStopEtaClock) {
                toast.error("Completa día y hora estimada del paradero, o déjalos vacíos.");
                return;
            }
            if (isPastCombined(newStopEtaDate, newStopEtaClock)) {
                toast.error("La hora estimada del paradero no puede ser en el pasado.");
                return;
            }
        }

        setStopPending(true);
        try {
            const etaCombined = combineDateAndTime(newStopEtaDate, newStopEtaClock);
            const res = await createTransportStop({
                routeId,
                name: newStopName,
                latitude: newStopLat != null ? String(newStopLat) : null,
                longitude: newStopLng != null ? String(newStopLng) : null,
                estimatedArrivalTime: etaCombined || null,
                maxSeats: newStopMaxSeats ? parseInt(newStopMaxSeats, 10) : null,
            });

            if (res.success && res.stop) {
                setStopsByRoute((prev) => ({
                    ...prev,
                    [routeId]: [...(prev[routeId] || []), res.stop as StopRow],
                }));
                setNewStopName("");
                setNewStopLat(null);
                setNewStopLng(null);
                setNewStopEtaDate("");
                setNewStopEtaClock("");
                setNewStopMaxSeats("");
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
        setDepartureLat(null);
        setDepartureLng(null);
        setShowForm(true);
    };

    const openEdit = (r: Route) => {
        setEditId(r.id);
        setDepartureLat(null);
        setDepartureLng(null);
        setForm({
            name: r.name,
            departurePoint: r.departurePoint,
            departureDate: toLocalDatePart(r.departureTime),
            departureClock: toLocalTimePart(r.departureTime),
            returnDate: toLocalDatePart(r.returnTime),
            returnClock: toLocalTimePart(r.returnTime),
            pricePerSeat: r.pricePerSeat,
            totalSeats: r.totalSeats.toString(),
            description: r.description ?? "",
            driverName: r.driverName ?? "",
            vehiclePlate: r.vehiclePlate ?? "",
            isRoundTrip: r.isRoundTrip ?? true,
            pendingHoldHours: String(r.pendingHoldHours ?? TRANSPORT_DEFAULT_PENDING_HOLD_HOURS),
        });
        setShowForm(true);
    };

    const handleSubmit = () => {
        const price = parseFloat(form.pricePerSeat);
        const seats = parseInt(form.totalSeats);
        const departureTime = combineDateAndTime(form.departureDate, form.departureClock);
        const returnTime =
            form.isRoundTrip && form.returnDate && form.returnClock
                ? combineDateAndTime(form.returnDate, form.returnClock)
                : null;

        if (!form.name.trim() || !form.departurePoint.trim() || !form.departureDate || !form.departureClock) {
            toast.error(t("transport.manager.requiredFields"));
            return;
        }
        if (form.departureDate < minDate) {
            toast.error("No puedes seleccionar un día anterior al de hoy.");
            return;
        }
        if (isPastCombined(form.departureDate, form.departureClock)) {
            toast.error("La salida no puede ser en el pasado. Elige día y hora futuros.");
            return;
        }
        if (form.isRoundTrip) {
            if ((form.returnDate && !form.returnClock) || (!form.returnDate && form.returnClock)) {
                toast.error("Completa día y hora de retorno, o déjalos vacíos.");
                return;
            }
            if (returnTime) {
                if (form.returnDate < minDate) {
                    toast.error("El retorno no puede ser un día anterior al de hoy.");
                    return;
                }
                if (isPastDatetimeLocal(returnTime)) {
                    toast.error("El retorno no puede ser en el pasado.");
                    return;
                }
                if (new Date(returnTime).getTime() < new Date(departureTime).getTime()) {
                    toast.error("El retorno debe ser igual o posterior a la salida.");
                    return;
                }
            }
        }
        if (isNaN(price) || price < 0) {
            toast.error(t("transport.manager.invalidPrice"));
            return;
        }
        if (isNaN(seats) || seats < 1) {
            toast.error(t("transport.manager.invalidSeats"));
            return;
        }

        const holdHours = parseInt(form.pendingHoldHours, 10);
        if (isNaN(holdHours) || holdHours < 1) {
            toast.error("Las horas de retención de cupo deben ser al menos 1.");
            return;
        }

        startTransition(async () => {
            try {
                const payload = {
                    name: form.name,
                    departurePoint: form.departurePoint,
                    departureTime,
                    returnTime: form.isRoundTrip ? returnTime : null,
                    pricePerSeat: price,
                    totalSeats: seats,
                    description: form.description || null,
                    driverName: form.driverName || null,
                    vehiclePlate: form.vehiclePlate || null,
                    isRoundTrip: form.isRoundTrip,
                    pendingHoldHours: holdHours,
                };
                if (editId) {
                    await updateRoute(editId, payload);
                    setRoutes((prev) =>
                        prev.map((r) =>
                            r.id === editId
                                ? {
                                    ...r,
                                    ...payload,
                                    departureTime: new Date(departureTime),
                                    returnTime: returnTime ? new Date(returnTime) : null,
                                    pricePerSeat: price.toFixed(2),
                                    totalSeats: seats,
                                }
                                : r
                        )
                    );
                    toast.success(t("transport.manager.routeUpdated"));
                } else {
                    const result = await createRoute({
                        eventId,
                        ...payload,
                    });
                    if (result.success && result.route) {
                        setRoutes((prev) => [
                            ...prev,
                            { ...result.route, bookedSeats: 0 } as Route,
                        ]);
                    }
                    if (result.transportOfferNotified && result.transportOfferNotified > 0) {
                        toast.success(
                            locale === "en"
                                ? `Route created. ${result.transportOfferNotified} registrant(s) were offered paid transport.`
                                : `Ruta creada. Se ofreció transporte de pago a ${result.transportOfferNotified} inscrito(s).`,
                        );
                    } else {
                        toast.success(t("transport.manager.routeCreated"));
                    }
                }
                setShowForm(false);
                setEditId(null);
                clearForm();
                setDepartureLat(null);
                setDepartureLng(null);
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

    const eventDateLabel = (() => {
        if (!eventInfo?.date) return null;
        const d = new Date(eventInfo.date);
        if (Number.isNaN(d.getTime())) return null;
        return d.toLocaleString(getIntlLocale(locale), {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    })();

    const eventEndLabel = (() => {
        if (!eventInfo?.endDate) return null;
        const d = new Date(eventInfo.endDate);
        if (Number.isNaN(d.getTime())) return null;
        return d.toLocaleString(getIntlLocale(locale), {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
        });
    })();

    const eventPlaceLabel = eventInfo?.isVirtual
        ? locale === "en"
            ? "Virtual event"
            : "Evento virtual"
        : eventInfo?.location?.trim() || null;

    const showEventContext = Boolean(eventDateLabel || eventPlaceLabel || eventInfo?.title);

    return (
        <div className="space-y-4">
            {showEventContext && (
                <div className="rounded-2xl border border-sky-500/25 bg-sky-500/10 px-4 py-3.5 dark:border-sky-400/20 dark:bg-sky-400/10">
                    <div className="flex gap-3">
                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-500/15 text-sky-700 dark:text-sky-300">
                            <Info className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1 space-y-2">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-sky-800/80 dark:text-sky-200/90">
                                    {locale === "en" ? "Event reference" : "Referencia del evento"}
                                </p>
                                <p className="text-sm text-sky-950/80 dark:text-sky-50/90">
                                    {locale === "en"
                                        ? "Use this to align departure times and pickup points with the venue. Attendees who already have their entry QR can book transport later as a separate paid add-on."
                                        : "Úsalo para alinear horarios de salida y puntos de recojo. Quienes ya tienen QR de entrada podrán reservar el bus después, como pago aparte."}
                                </p>
                            </div>
                            {eventInfo?.title ? (
                                <p className="truncate text-sm font-semibold text-foreground">
                                    {eventInfo.title}
                                </p>
                            ) : null}
                            <div className="grid gap-2 sm:grid-cols-2">
                                {eventDateLabel && (
                                    <div className="flex items-start gap-2 rounded-xl border border-sky-500/15 bg-background/60 px-3 py-2.5">
                                        <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-sky-600 dark:text-sky-300" />
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                                                {locale === "en" ? "Event date" : "Fecha del evento"}
                                            </p>
                                            <p className="text-sm font-medium text-foreground capitalize">
                                                {eventDateLabel}
                                            </p>
                                            {eventEndLabel ? (
                                                <p className="mt-0.5 text-xs text-muted-foreground">
                                                    {locale === "en" ? "Ends" : "Termina"}: {eventEndLabel}
                                                </p>
                                            ) : null}
                                        </div>
                                    </div>
                                )}
                                {eventPlaceLabel && (
                                    <div className="flex items-start gap-2 rounded-xl border border-sky-500/15 bg-background/60 px-3 py-2.5">
                                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-sky-600 dark:text-sky-300" />
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                                                {locale === "en" ? "Venue" : "Lugar"}
                                            </p>
                                            <p className="text-sm font-medium text-foreground break-words">
                                                {eventPlaceLabel}
                                            </p>
                                            {!eventInfo?.isVirtual &&
                                            eventInfo?.latitude != null &&
                                            eventInfo?.longitude != null ? (
                                                <a
                                                    href={`https://www.google.com/maps?q=${eventInfo.latitude},${eventInfo.longitude}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="mt-1 inline-block text-xs font-medium text-sky-700 underline-offset-2 hover:underline dark:text-sky-300"
                                                >
                                                    {locale === "en" ? "Open in Maps" : "Abrir en Maps"}
                                                </a>
                                            ) : null}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

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
                                {t("transport.manager.departurePoint")} *
                            </label>
                            <input
                                className={inputClass}
                                placeholder={t("transport.manager.departurePointPlaceholder")}
                                value={form.departurePoint}
                                onChange={(e) => setForm({ ...form, departurePoint: e.target.value })}
                            />
                            <p className="mt-1.5 text-[11px] text-muted-foreground">
                                Busca o marca el punto en el mapa; la dirección se completa sola.
                            </p>
                            <StopMapPicker
                                address={form.departurePoint}
                                latitude={departureLat}
                                longitude={departureLng}
                                onAddressChange={(address) =>
                                    setForm((prev) => ({ ...prev, departurePoint: address }))
                                }
                                onCoordsChange={(coords) => {
                                    setDepartureLat(coords?.lat ?? null);
                                    setDepartureLng(coords?.lng ?? null);
                                }}
                            />
                        </div>

                        <div className="sm:col-span-2 grid gap-4 sm:grid-cols-2">
                            <div>
                                <p className="mb-1.5 text-sm font-medium text-foreground">
                                    {t("transport.manager.departureTime")} *
                                </p>
                                <DateAmPmTimeField
                                    dateValue={form.departureDate}
                                    timeValue={form.departureClock}
                                    minDate={minDate}
                                    onDateChange={(departureDate) => {
                                        if (departureDate && departureDate < minDate) {
                                            toast.error("No puedes seleccionar un día anterior al de hoy.");
                                            setForm({ ...form, departureDate: minDate });
                                            return;
                                        }
                                        setForm({ ...form, departureDate });
                                    }}
                                    onTimeChange={(departureClock) =>
                                        setForm({ ...form, departureClock })
                                    }
                                />
                            </div>

                            <div>
                                <p className="mb-1.5 text-sm font-medium text-foreground">
                                    {t("transport.manager.returnTime")}{" "}
                                    <span className="font-normal text-muted-foreground">{t("transport.booking.optional")}</span>
                                </p>
                                <DateAmPmTimeField
                                    dateValue={form.returnDate}
                                    timeValue={form.returnClock}
                                    minDate={form.departureDate || minDate}
                                    disabled={!form.isRoundTrip}
                                    onDateChange={(returnDate) => {
                                        const floor = form.departureDate || minDate;
                                        if (returnDate && returnDate < floor) {
                                            toast.error("El retorno no puede ser un día anterior a la salida.");
                                            setForm({ ...form, returnDate: floor });
                                            return;
                                        }
                                        setForm({ ...form, returnDate });
                                    }}
                                    onTimeChange={(returnClock) => setForm({ ...form, returnClock })}
                                />
                                <label className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                                    <input
                                        type="checkbox"
                                        checked={form.isRoundTrip}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                isRoundTrip: e.target.checked,
                                                returnDate: e.target.checked ? form.returnDate : "",
                                                returnClock: e.target.checked ? form.returnClock : "",
                                            })
                                        }
                                        className="rounded border-border"
                                    />
                                    Ida y vuelta (desmarca para solo ida)
                                </label>
                            </div>
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-foreground">
                                {t("transport.manager.seatPrice") || "Precio por asiento (S/.) *"}{" "}
                                <span className="text-xs font-normal text-muted-foreground">
                                    ({form.isRoundTrip ? "Ida y vuelta" : "Solo ida"})
                                </span>
                            </label>
                            <input
                                type="number"
                                min={0}
                                step="0.50"
                                className={inputClass}
                                placeholder={form.isRoundTrip ? "Ej: 15.00 (ida y vuelta)" : "Ej: 10.00 (solo ida)"}
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

                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-foreground">
                                Conductor
                            </label>
                            <input
                                className={inputClass}
                                placeholder="Nombre del chofer"
                                value={form.driverName}
                                onChange={(e) => setForm({ ...form, driverName: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-foreground">
                                Placa del vehículo
                            </label>
                            <input
                                className={inputClass}
                                placeholder="ABC-123"
                                value={form.vehiclePlate}
                                onChange={(e) => setForm({ ...form, vehiclePlate: e.target.value.toUpperCase() })}
                            />
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-foreground">
                                Liberar cupos sin pago (horas)
                            </label>
                            <input
                                type="number"
                                min={1}
                                max={168}
                                className={inputClass}
                                value={form.pendingHoldHours}
                                onChange={(e) => setForm({ ...form, pendingHoldHours: e.target.value })}
                            />
                            <p className="mt-1 text-[11px] text-muted-foreground">
                                Reservas pendientes sin pagar se cancelan automáticamente tras este plazo.
                            </p>
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
                                            const IconMap: Record<string, React.ComponentType<{ className?: string }>> = { yape: Smartphone, plin: QrCode, cash: Wallet, culqi: CreditCard };
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
                                setDepartureLat(null);
                                setDepartureLng(null);
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
                                                S/. {Number(route.pricePerSeat).toFixed(2)} / asiento
                                                {" "}
                                                ({route.isRoundTrip === false ? "Solo ida" : "Ida y vuelta"})
                                            </span>
                                            {(route.driverName || route.vehiclePlate) && (
                                                <span className="text-xs">
                                                    {route.driverName ? `Chofer: ${route.driverName}` : ""}
                                                    {route.driverName && route.vehiclePlate ? " · " : ""}
                                                    {route.vehiclePlate ? `Placa: ${route.vehiclePlate}` : ""}
                                                </span>
                                            )}
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
                                                        No hay paraderos adicionales. Los pasajeros subirán en el punto de salida general.
                                                    </p>
                                                ) : (
                                                    <div className="space-y-2">
                                                        {[...stopsByRoute[route.id]]
                                                            .sort((a, b) => a.sortOrder - b.sortOrder)
                                                            .map((stop, index) => (
                                                            <div
                                                                key={stop.id}
                                                                className="flex items-center justify-between rounded-lg bg-background p-2.5 text-xs border border-border/60 hover:shadow-xs transition-all gap-2"
                                                            >
                                                                <div className="min-w-0 flex-1 pr-2">
                                                                    <p className="font-semibold text-foreground">
                                                                        {index + 1}. {stop.name}
                                                                    </p>
                                                                    {stop.estimatedArrivalTime && (
                                                                        <p className="text-[10px] text-muted-foreground mt-0.5">
                                                                            ETA:{" "}
                                                                            {new Date(stop.estimatedArrivalTime).toLocaleString(
                                                                                getIntlLocale(locale),
                                                                                { dateStyle: "short", timeStyle: "short" },
                                                                            )}
                                                                        </p>
                                                                    )}
                                                                    {stop.maxSeats != null && (
                                                                        <p className="text-[10px] text-muted-foreground">
                                                                            Cupo paradero: {stop.maxSeats}
                                                                        </p>
                                                                    )}
                                                                    {stop.latitude && stop.longitude && (
                                                                        <a
                                                                            href={`https://www.google.com/maps/search/?api=1&query=${stop.latitude},${stop.longitude}`}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="inline-block mt-0.5 text-[10px] text-primary hover:underline"
                                                                        >
                                                                            Ver en Google Maps
                                                                        </a>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-1 shrink-0">
                                                                    <button
                                                                        type="button"
                                                                        title="Subir"
                                                                        disabled={index === 0}
                                                                        onClick={async () => {
                                                                            const ordered = [...stopsByRoute[route.id]].sort(
                                                                                (a, b) => a.sortOrder - b.sortOrder,
                                                                            );
                                                                            if (index <= 0) return;
                                                                            const prev = ordered[index - 1]!;
                                                                            await updateTransportStop(stop.id, { sortOrder: prev.sortOrder });
                                                                            await updateTransportStop(prev.id, { sortOrder: stop.sortOrder });
                                                                            const refreshed = await getStopsByRoute(route.id);
                                                                            setStopsByRoute((p) => ({ ...p, [route.id]: refreshed as StopRow[] }));
                                                                        }}
                                                                        className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30"
                                                                    >
                                                                        ↑
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        title="Bajar"
                                                                        disabled={index >= stopsByRoute[route.id].length - 1}
                                                                        onClick={async () => {
                                                                            const ordered = [...stopsByRoute[route.id]].sort(
                                                                                (a, b) => a.sortOrder - b.sortOrder,
                                                                            );
                                                                            if (index >= ordered.length - 1) return;
                                                                            const next = ordered[index + 1]!;
                                                                            await updateTransportStop(stop.id, { sortOrder: next.sortOrder });
                                                                            await updateTransportStop(next.id, { sortOrder: stop.sortOrder });
                                                                            const refreshed = await getStopsByRoute(route.id);
                                                                            setStopsByRoute((p) => ({ ...p, [route.id]: refreshed as StopRow[] }));
                                                                        }}
                                                                        className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30"
                                                                    >
                                                                        ↓
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleDeleteStop(route.id, stop.id)}
                                                                        className="rounded p-1.5 text-destructive hover:bg-destructive/10 transition-colors"
                                                                        title="Eliminar paradero"
                                                                    >
                                                                        <Trash2 className="h-3.5 w-3.5" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                <div className="border-t border-border/60 pt-3.5 space-y-3">
                                                    <span className="block text-xs font-bold text-foreground">
                                                        Agregar Paradero Intermedio
                                                    </span>
                                                    <input
                                                        type="text"
                                                        placeholder="Nombre (ej: Óvalo Grau / Panadería X)"
                                                        value={newStopName}
                                                        onChange={(e) => setNewStopName(e.target.value)}
                                                        className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                                                    />
                                                    <DateAmPmTimeField
                                                        dateValue={newStopEtaDate}
                                                        timeValue={newStopEtaClock}
                                                        minDate={minDate}
                                                        dateLabel="Día ETA"
                                                        timeLabel="Hora ETA"
                                                        onDateChange={(v) => {
                                                            if (v && v < minDate) {
                                                                toast.error("No puedes seleccionar un día anterior al de hoy.");
                                                                setNewStopEtaDate(minDate);
                                                                return;
                                                            }
                                                            setNewStopEtaDate(v);
                                                        }}
                                                        onTimeChange={setNewStopEtaClock}
                                                    />
                                                    <div>
                                                        <label className="mb-1 block text-[10px] font-medium text-muted-foreground">
                                                            Cupo máx. paradero (opcional)
                                                        </label>
                                                        <input
                                                            type="number"
                                                            min={1}
                                                            placeholder="Sin límite"
                                                            value={newStopMaxSeats}
                                                            onChange={(e) => setNewStopMaxSeats(e.target.value)}
                                                            className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs"
                                                        />
                                                    </div>
                                                    <StopMapPicker
                                                        address={newStopName}
                                                        latitude={newStopLat}
                                                        longitude={newStopLng}
                                                        onAddressChange={setNewStopName}
                                                        onCoordsChange={(coords) => {
                                                            setNewStopLat(coords?.lat ?? null);
                                                            setNewStopLng(coords?.lng ?? null);
                                                        }}
                                                    />
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
