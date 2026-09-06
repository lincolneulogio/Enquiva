"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  createRoute,
  updateRoute,
  deleteRoute,
  toggleRouteActive,
} from "@/actions/transport";
import { usePersistedState } from "@/hooks/useFormPersistence";
import { formStorageKey } from "@/lib/form-persistence";
import { TRANSPORT_DEFAULT_PENDING_HOLD_HOURS } from "@/lib/transport/constants";
import type { Route, RouteFormData } from "./types";
import {
  toLocalDatePart,
  toLocalTimePart,
  combineDateAndTime,
  isPastCombined,
  isPastDatetimeLocal,
} from "./utils";

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

export function useRouteMutations({
  eventId,
  initialRoutes,
  locale,
  minDate,
  t,
}: {
  eventId: string;
  initialRoutes: Route[];
  locale: string;
  minDate: string;
  t: (key: string) => string;
}) {
  const [routes, setRoutes] = useState<Route[]>(initialRoutes);
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm, clearForm] = usePersistedState(
    formStorageKey(`transport.routes.${eventId}`),
    EMPTY_FORM,
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [departureLat, setDepartureLat] = useState<number | null>(null);
  const [departureLng, setDepartureLng] = useState<number | null>(null);

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
      toast.error(t("transport.manager.departureDatePast"));
      return;
    }
    if (isPastCombined(form.departureDate, form.departureClock)) {
      toast.error(t("transport.manager.departureTimePast"));
      return;
    }
    if (form.isRoundTrip) {
      if ((form.returnDate && !form.returnClock) || (!form.returnDate && form.returnClock)) {
        toast.error(t("transport.manager.returnDateTimeIncomplete"));
        return;
      }
      if (returnTime) {
        if (form.returnDate < minDate) {
          toast.error(t("transport.manager.returnDatePast"));
          return;
        }
        if (isPastDatetimeLocal(returnTime)) {
          toast.error(t("transport.manager.returnTimePast"));
          return;
        }
        if (new Date(returnTime).getTime() < new Date(departureTime).getTime()) {
          toast.error(t("transport.manager.returnBeforeDeparture"));
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
      toast.error(t("transport.manager.holdHoursMin"));
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

  return {
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
  };
}
