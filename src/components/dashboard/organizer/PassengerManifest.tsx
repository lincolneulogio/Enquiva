"use client";

import { useEffect, useState } from "react";
import { getEventPassengerManifest } from "@/actions/transport";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { printJsPdf } from "@/lib/export/print-pdf";
import { useTranslations } from "@/components/providers/LocaleProvider";
import { usePlatformBrand } from "@/components/providers/PlatformBrandProvider";
import {
  BookingItem,
  PassengerManifestProps,
  buildManifestPdf,
  ManifestDriverCard,
  ManifestToolbar,
  ManifestTable,
} from "./manifest";

export type { BookingItem, PassengerManifestProps };

export function PassengerManifest({ eventId }: PassengerManifestProps) {
  const t = useTranslations();
  const brand = usePlatformBrand();
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [driverName, setDriverName] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [busy, setBusy] = useState<"pdf" | "print" | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await getEventPassengerManifest(eventId);
        if (res.success) {
          const list = res.bookings || [];
          setBookings(list);
          const withDriver = list.find((b) => b.driverName || b.vehiclePlate);
          if (withDriver) {
            setDriverName(withDriver.driverName ?? "");
            setVehiclePlate(withDriver.vehiclePlate ?? "");
          }
        } else {
          setError("No se pudieron cargar las reservas.");
        }
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Error al obtener reservas de transporte.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [eventId]);

  const filteredBookings = bookings.filter((b) => {
    const term = search.toLowerCase();
    return (
      (b.passengerName?.toLowerCase().includes(term) ?? false) ||
      (b.passengerEmail?.toLowerCase().includes(term) ?? false) ||
      b.routeName.toLowerCase().includes(term) ||
      (b.stopName?.toLowerCase().includes(term) ?? false)
    );
  });

  const exportPDF = async () => {
    if (bookings.length === 0) return;
    try {
      setBusy("pdf");
      const doc = await buildManifestPdf({
        brandName: brand.name,
        driverName,
        vehiclePlate,
        bookings,
      });
      doc.save(`Manifiesto-Pasajeros-${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success(t("common.exportPdf") + " ✓");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.genericExportError"));
    } finally {
      setBusy(null);
    }
  };

  const printPDF = async () => {
    if (bookings.length === 0) return;
    try {
      setBusy("print");
      const doc = await buildManifestPdf({
        brandName: brand.name,
        driverName,
        vehiclePlate,
        bookings,
      });
      await printJsPdf(doc);
      toast.success(t("common.printOpened"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.printError"));
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mb-3" />
        <p className="text-sm">Cargando manifiesto de pasajeros...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5 text-sm text-red-600 dark:text-red-400 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 shrink-0" />
        <div>
          <p className="font-semibold">Error al cargar manifiesto</p>
          <p className="mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ManifestDriverCard
        driverName={driverName}
        setDriverName={setDriverName}
        vehiclePlate={vehiclePlate}
        setVehiclePlate={setVehiclePlate}
      />

      <ManifestToolbar
        search={search}
        setSearch={setSearch}
        exportPDF={exportPDF}
        printPDF={printPDF}
        hasBookings={bookings.length > 0}
        busy={busy}
        t={t}
      />

      <ManifestTable
        bookings={bookings}
        filteredBookings={filteredBookings}
      />
    </div>
  );
}
