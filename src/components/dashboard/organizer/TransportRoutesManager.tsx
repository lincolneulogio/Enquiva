"use client";

import { useState, useEffect } from "react";
import { Plus, Bus } from "lucide-react";
import { getEventPaymentMethods } from "@/actions/payment-methods";
import { useLocale, useTranslations } from "@/components/providers/LocaleProvider";
import {
  Route,
  TransportRoutesManagerProps,
  todayDatePart,
  EventContextBanner,
  RouteForm,
  RouteCard,
} from "./transport";
import { useStopsManager } from "./transport/useStopsManager";
import { useRouteMutations } from "./transport/useRouteMutations";

export type { Route, StopRow, TransportRoutesManagerProps } from "./transport/types";

export function TransportRoutesManager({
  eventId,
  initialRoutes,
  eventInfo,
}: TransportRoutesManagerProps) {
  const t = useTranslations();
  const { locale } = useLocale();

  const [minDate, setMinDate] = useState(todayDatePart());

  useEffect(() => {
    setMinDate(todayDatePart());
    const id = window.setInterval(() => setMinDate(todayDatePart()), 60_000);
    return () => window.clearInterval(id);
  }, []);

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

  const stops = useStopsManager();

  const {
    routes,
    isPending,
    showForm,
    setShowForm,
    editId,
    setEditId,
    form,
    setForm,
    deletingId,
    departureLat,
    setDepartureLat,
    departureLng,
    setDepartureLng,
    openCreate,
    openEdit,
    handleSubmit,
    handleDelete,
    handleToggleActive,
  } = useRouteMutations({
    eventId,
    initialRoutes,
    locale,
    minDate,
    t,
  });

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
              expandedRouteId={stops.expandedRouteId}
              stopsByRoute={stops.stopsByRoute}
              newStopName={stops.newStopName}
              setNewStopName={stops.setNewStopName}
              newStopLat={stops.newStopLat}
              setNewStopLat={stops.setNewStopLat}
              newStopLng={stops.newStopLng}
              setNewStopLng={stops.setNewStopLng}
              newStopEtaDate={stops.newStopEtaDate}
              setNewStopEtaDate={stops.setNewStopEtaDate}
              newStopEtaClock={stops.newStopEtaClock}
              setNewStopEtaClock={stops.setNewStopEtaClock}
              newStopMaxSeats={stops.newStopMaxSeats}
              setNewStopMaxSeats={stops.setNewStopMaxSeats}
              stopPending={stops.stopPending}
              onToggleStops={stops.toggleStops}
              onAddStop={stops.handleAddStop}
              onDeleteStop={stops.handleDeleteStop}
              onMoveStop={stops.handleMoveStop}
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
