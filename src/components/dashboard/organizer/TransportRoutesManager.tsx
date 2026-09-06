"use client";

import { useState, useTransition, useEffect } from "react";
import { toast } from "sonner";
import { Plus, Bus } from "lucide-react";
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
import { usePersistedState } from "@/hooks/useFormPersistence";
import { formStorageKey } from "@/lib/form-persistence";
import { TRANSPORT_DEFAULT_PENDING_HOLD_HOURS } from "@/lib/transport/constants";
import {
  Route,
  StopRow,
  RouteFormData,
  TransportRoutesManagerProps,
  toLocalDatePart,
  toLocalTimePart,
  combineDateAndTime,
  todayDatePart,
  isPastCombined,
  isPastDatetimeLocal,
  EventContextBanner,
  RouteForm,
  RouteCard,
} from "./transport";

export type { Route, StopRow, TransportRoutesManagerProps } from "./transport/types";

const EMPTY_FORM: RouteFormData = {
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
  const [form, setForm, clearForm] = usePersistedState(
    formStorageKey(`transport.routes.${eventId}`),
    EMPTY_FORM,
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [minDate, setMinDate] = useState(todayDatePart());

  useEffect(() => {
    setMinDate(todayDatePart());
    const id = window.setInterval(() => setMinDate(todayDatePart()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  // Event payment methods states
  const [eventPaymentMethods, setEventPaymentMethods] = useState<
    Array<{ id: string; type: string; label: string; phone?: string | null; holderName: string }>
  >([]);
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
    if (expandedRouteId === routeId) {
      setExpandedRouteId(null);
      return;
    }

    setExpandedRouteId(routeId);

    if (!stopsByRoute[routeId]) {
      try {
        const stopsData = await getStopsByRoute(routeId);
        setStopsByRoute((prev) => ({
          ...prev,
          [routeId]: stopsData,
        }));
      } catch {
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
    } catch {
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
    } catch {
      toast.error("Error al eliminar el paradero.");
    }
  };

  const handleMoveStop = async (routeId: string, index: number, direction: "up" | "down") => {
    const currentStops = stopsByRoute[routeId] || [];
    const ordered = [...currentStops].sort((a, b) => a.sortOrder - b.sortOrder);
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= ordered.length) return;

    const current = ordered[index];
    const target = ordered[targetIndex];
    if (!current || !target) return;

    await updateTransportStop(current.id, { sortOrder: target.sortOrder });
    await updateTransportStop(target.id, { sortOrder: current.sortOrder });
    const refreshed = await getStopsByRoute(routeId);
    setStopsByRoute((prev) => ({ ...prev, [routeId]: refreshed as StopRow[] }));
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
                : r,
            ),
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
    setDeletingId(routeId);
    startTransition(async () => {
      try {
        await deleteRoute(routeId);
        setRoutes((prev) => prev.filter((r) => r.id !== routeId));
        toast.success(t("transport.manager.routeDeleted"));
      } catch (e) {
        toast.error(e instanceof Error ? e.message : t("transport.manager.deleteError"));
      } finally {
        setDeletingId(null);
      }
    });
  };

  const handleToggleActive = (routeId: string, current: boolean) => {
    startTransition(async () => {
      try {
        await toggleRouteActive(routeId, !current);
        setRoutes((prev) =>
          prev.map((r) => (r.id === routeId ? { ...r, isActive: !current } : r)),
        );
        toast.success(
          !current
            ? t("transport.manager.routeActivated")
            : t("transport.manager.routeDeactivated"),
        );
      } catch {
        toast.error(t("transport.manager.toggleError"));
      }
    });
  };

  return (
    <div className="space-y-5">
      <EventContextBanner eventInfo={eventInfo} locale={locale} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
            <Bus className="h-3.5 w-3.5" />
            {locale === "en" ? "Routes" : "Rutas"}
          </p>
          <h2 className="font-display text-xl font-semibold tracking-tight text-foreground">
            {t("transport.manager.title")}
          </h2>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-xs transition-colors hover:bg-primary/90 cursor-pointer"
        >
          <Plus className="h-4 w-4" /> {t("transport.manager.newRoute")}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <RouteForm
          editId={editId}
          form={form}
          setForm={setForm}
          minDate={minDate}
          departureLat={departureLat}
          departureLng={departureLng}
          setDepartureLat={setDepartureLat}
          setDepartureLng={setDepartureLng}
          loadingPaymentMethods={loadingPaymentMethods}
          eventPaymentMethods={eventPaymentMethods}
          eventId={eventId}
          isPending={isPending}
          locale={locale}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditId(null);
            setDepartureLat(null);
            setDepartureLng(null);
          }}
          t={t}
        />
      )}

      {/* Routes list */}
      {routes.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card/60 p-10 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Bus className="h-6 w-6" />
          </div>
          <p className="text-sm text-muted-foreground">{t("transport.manager.noRoutes")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {routes.map((route) => (
            <RouteCard
              key={route.id}
              route={route}
              locale={locale}
              minDate={minDate}
              isPending={isPending}
              deletingId={deletingId}
              eventPaymentMethods={eventPaymentMethods}
              expandedRouteId={expandedRouteId}
              stopsByRoute={stopsByRoute}
              newStopName={newStopName}
              setNewStopName={setNewStopName}
              newStopLat={newStopLat}
              setNewStopLat={setNewStopLat}
              newStopLng={newStopLng}
              setNewStopLng={setNewStopLng}
              newStopEtaDate={newStopEtaDate}
              setNewStopEtaDate={setNewStopEtaDate}
              newStopEtaClock={newStopEtaClock}
              setNewStopEtaClock={setNewStopEtaClock}
              newStopMaxSeats={newStopMaxSeats}
              setNewStopMaxSeats={setNewStopMaxSeats}
              stopPending={stopPending}
              onToggleStops={toggleStops}
              onAddStop={handleAddStop}
              onDeleteStop={handleDeleteStop}
              onMoveStop={handleMoveStop}
              onToggleActive={handleToggleActive}
              onEdit={openEdit}
              onDelete={handleDelete}
              t={t}
            />
          ))}
        </div>
      )}
    </div>
  );
}
