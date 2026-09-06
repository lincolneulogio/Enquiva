"use client";

import React from "react";
import { Loader2, Wallet, AlertTriangle, Smartphone, QrCode, CreditCard } from "lucide-react";
import { StopMapPicker } from "@/components/dashboard/organizer/StopMapPicker";
import { DateAmPmTimeField } from "@/components/ui/DateAmPmTimeField";
import { RouteFormData } from "./types";

interface RouteFormProps {
  editId: string | null;
  form: RouteFormData;
  setForm: React.Dispatch<React.SetStateAction<RouteFormData>>;
  minDate: string;
  departureLat: number | null;
  departureLng: number | null;
  setDepartureLat: (lat: number | null) => void;
  setDepartureLng: (lng: number | null) => void;
  loadingPaymentMethods: boolean;
  eventPaymentMethods: Array<{ id: string; type: string; label: string; phone?: string | null; holderName: string }>;
  eventId: string;
  isPending: boolean;
  locale: string;
  onSubmit: () => void;
  onCancel: () => void;
  t: (key: string, params?: Record<string, any>) => string;
}

export function RouteForm({
  editId,
  form,
  setForm,
  minDate,
  departureLat,
  departureLng,
  setDepartureLat,
  setDepartureLng,
  loadingPaymentMethods,
  eventPaymentMethods,
  eventId,
  isPending,
  locale,
  onSubmit,
  onCancel,
  t,
}: RouteFormProps) {
  const inputClass =
    "w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";

  return (
    <div className="rounded-3xl border border-border bg-card p-6 space-y-5 shadow-xs">
      <div>
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
          {editId ? (locale === "en" ? "Edit" : "Editar") : locale === "en" ? "New" : "Nueva"}
        </p>
        <h3 className="font-display text-lg font-semibold text-foreground">
          {editId ? t("transport.manager.editRoute") : t("transport.manager.newTransportRoute")}
        </h3>
      </div>

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
              <span className="font-normal text-muted-foreground">
                {t("transport.booking.optional")}
              </span>
            </p>
            <DateAmPmTimeField
              dateValue={form.returnDate}
              timeValue={form.returnClock}
              minDate={form.departureDate || minDate}
              disabled={!form.isRoundTrip}
              onDateChange={(returnDate) => {
                const floor = form.departureDate || minDate;
                if (returnDate && returnDate < floor) {
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
                {!form.pricePerSeat || parseFloat(form.pricePerSeat) === 0 || isNaN(parseFloat(form.pricePerSeat))
                  ? locale === "en"
                    ? "If you set a seat price greater than 0, attendees will pay using these payment methods configured for the event:"
                    : "Si estableces un precio por asiento mayor a 0, los participantes pagarán usando estos medios de pago configurados para el evento:"
                  : locale === "en"
                  ? "Attendees will pay for their seat using the payment methods configured for this event:"
                  : "Los participantes pagarán por su asiento usando los medios de pago configurados para este evento:"}
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {eventPaymentMethods.map((pm) => {
                  const IconMap: Record<string, React.ComponentType<{ className?: string }>> = {
                    yape: Smartphone,
                    plin: QrCode,
                    cash: Wallet,
                    culqi: CreditCard,
                  };
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
          onClick={onCancel}
          className="rounded-xl border border-border px-4 py-2 text-sm hover:bg-secondary transition-colors cursor-pointer"
        >
          {t("common.cancel") || "Cancelar"}
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={isPending}
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors cursor-pointer"
        >
          {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {editId ? t("common.saveChanges") : t("transport.manager.createRoute")}
        </button>
      </div>
    </div>
  );
}
