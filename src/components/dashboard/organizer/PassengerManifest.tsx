"use client";

import { useEffect, useState } from "react";
import { getEventPassengerManifest } from "@/actions/transport";
import { Bus, Search, Download, AlertCircle, MapPin, Printer } from "lucide-react";
import { toast } from "sonner";
import { printJsPdf } from "@/lib/export/print-pdf";
import { useTranslations } from "@/components/providers/LocaleProvider";
import { usePlatformBrand } from "@/components/providers/PlatformBrandProvider";

interface BookingItem {
  id: string;
  seats: number;
  status: string;
  notes: string | null;
  passengerName: string | null;
  passengerEmail: string | null;
  passengerPhone: string | null;
  routeId?: string;
  routeName: string;
  departurePoint: string;
  driverName?: string | null;
  vehiclePlate?: string | null;
  stopName: string | null;
  stopSortOrder?: number | null;
  paymentStatus: string | null;
}

interface PassengerManifestProps {
  eventId: string;
}

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

  const buildManifestPdf = async () => {
    const [{ jsPDF }, { default: autoTable }] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable"),
    ]);

    const doc = new jsPDF();

    // Deep purple and pink gradient-like header banner
    doc.setFillColor(75, 26, 181); // Deep purple
    doc.rect(0, 0, 210, 38, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("MANIFIESTO DE PASAJEROS", 14, 22);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`${brand.name} - Sistema de Control y Logística de Rutas`, 14, 30);

    // Document Info Box
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Fecha Emisión:", 14, 48);
    doc.setFont("helvetica", "normal");
    doc.text(
      new Date().toLocaleDateString("es-PE", { dateStyle: "long" }) + " - " + new Date().toLocaleTimeString("es-PE"),
      45,
      48
    );

    doc.setFont("helvetica", "bold");
    doc.text("Conductor:", 14, 55);
    doc.setFont("helvetica", "normal");
    doc.text(driverName.trim() || "___________________________", 45, 55);

    doc.setFont("helvetica", "bold");
    doc.text("Placa Vehículo:", 120, 55);
    doc.setFont("helvetica", "normal");
    doc.text(vehiclePlate.trim().toUpperCase() || "___________", 152, 55);

    // Group bookings by route
    const routesMap = new Map<string, BookingItem[]>();
    bookings.forEach((b) => {
      const list = routesMap.get(b.routeName) || [];
      list.push(b);
      routesMap.set(b.routeName, list);
    });

    let currentY = 68;

    routesMap.forEach((routeBookings, routeName) => {
      if (currentY > 240) {
        doc.addPage();
        currentY = 20;
      }

      // Route Title Banner
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(75, 26, 181);
      doc.text(`Ruta: ${routeName}`, 14, currentY);

      // Route Summary Info
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      const totalRouteSeats = routeBookings.reduce((sum, b) => sum + b.seats, 0);
      doc.text(
        `Punto de Partida: ${routeBookings[0].departurePoint} | Total Pasajeros: ${totalRouteSeats}`,
        14,
        currentY + 5
      );

      currentY += 10;

      // Table formatting
      const tableRows = routeBookings.map((b, index) => [
        index + 1,
        b.passengerName || b.passengerEmail || "Anónimo",
        b.passengerPhone || "Sin número",
        b.seats,
        b.stopName || "Punto de salida por defecto",
        b.paymentStatus === "approved" ? "PAGADO" : b.paymentStatus === "pending" ? "PENDIENTE" : "SIN PAGO",
        "", // Blank field for driver signature/presence mark
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [["#", "Pasajero", "Teléfono", "Asientos", "Paradero Subida", "Estado Pago", "Firma Recibido"]],
        body: tableRows,
        styles: { fontSize: 8.5, cellPadding: 3, font: "helvetica" },
        headStyles: { fillColor: [75, 26, 181], textColor: [255, 255, 255], fontStyle: "bold" },
        alternateRowStyles: { fillColor: [250, 249, 254] },
        columnStyles: {
          0: { cellWidth: 8 },
          1: { cellWidth: 48 },
          2: { cellWidth: 24 },
          3: { cellWidth: 15, halign: "center" },
          4: { cellWidth: 45 },
          5: { cellWidth: 22, fontStyle: "bold" },
          6: { cellWidth: 20 },
        },
        margin: { left: 14, right: 14 },
      });

      currentY = (doc.lastAutoTable?.finalY ?? currentY) + 12;
    });

    // Signature lines
    if (currentY > 240) {
      doc.addPage();
      currentY = 25;
    }

    doc.setDrawColor(200, 200, 200);
    doc.line(20, currentY + 20, 90, currentY + 20);
    doc.line(120, currentY + 20, 190, currentY + 20);

    doc.setFontSize(8.5);
    doc.setTextColor(120, 120, 120);
    doc.text("Firma del Conductor / Transportista", 30, currentY + 25);
    doc.text("Firma del Organizador Responsable", 128, currentY + 25);

    return doc;
  };

  const exportPDF = async () => {
    if (bookings.length === 0) return;
    try {
      setBusy("pdf");
      const doc = await buildManifestPdf();
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
      const doc = await buildManifestPdf();
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
      {/* Datos del Conductor y Vehículo (Opcional) */}
      <div className="grid gap-4 sm:grid-cols-2 rounded-2xl border border-border/80 bg-muted/20 p-5 shadow-3xs">
        <div>
          <label className="mb-1.5 block text-xs font-bold text-foreground uppercase tracking-wider">
            Nombre del Conductor (Opcional)
          </label>
          <input
            type="text"
            placeholder="Ej: Juan Pérez"
            value={driverName}
            onChange={(e) => setDriverName(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground transition-all duration-200"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold text-foreground uppercase tracking-wider">
            Placa del Vehículo (Opcional)
          </label>
          <input
            type="text"
            placeholder="Ej: ABC-123"
            value={vehiclePlate}
            onChange={(e) => setVehiclePlate(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground transition-all duration-200"
          />
        </div>
      </div>

      {/* Manifest Info Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar pasajero, ruta o paradero..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-border bg-background pl-9 pr-4 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={exportPDF}
            disabled={bookings.length === 0 || busy !== null}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground shadow-sm transition-all hover:bg-accent/90 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            {busy === "pdf" ? t("common.exporting") : "Descargar PDF"}
          </button>
          <button
            type="button"
            onClick={printPDF}
            disabled={bookings.length === 0 || busy !== null}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground shadow-sm transition-all hover:bg-muted/50 disabled:opacity-50"
          >
            <Printer className="h-4 w-4" />
            {busy === "print" ? t("common.printing") : t("common.print")}
          </button>
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
          <Bus className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" />
          <p className="text-sm font-medium">Aún no hay pasajeros reservados en este evento.</p>
          <p className="text-xs mt-1">Los pasajeros aparecerán aquí a medida que compren sus boletos de bus.</p>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="rounded-xl border p-12 text-center text-muted-foreground">
          <p className="text-sm">No se encontraron pasajeros con el término de búsqueda.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pasajero</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ruta / Salida</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Paradero de Subida</th>
                <th className="px-5 py-3.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Asientos</th>
                <th className="px-5 py-3.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pago</th>
                <th className="px-5 py-3.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Estado Reserva</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredBookings.map((b) => (
                <tr key={b.id} className="hover:bg-secondary/20 transition-all duration-150">
                  <td className="px-5 py-4">
                    <div>
                      <p className="font-semibold text-foreground">{b.passengerName || "Anónimo"}</p>
                      <p className="text-xs text-muted-foreground">{b.passengerPhone || b.passengerEmail || "Sin datos de contacto"}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div>
                      <p className="font-medium text-foreground">{b.routeName}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3 shrink-0" /> {b.departurePoint}
                      </p>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary text-xs font-medium border border-border">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                      {b.stopName || "Salida general"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center font-bold text-foreground">
                    {b.seats}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                        b.paymentStatus === "approved"
                          ? "bg-green-500/10 text-green-700 dark:text-green-400"
                          : b.paymentStatus === "pending"
                          ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                          : "bg-red-500/10 text-red-700 dark:text-red-400"
                      }`}
                    >
                      {b.paymentStatus === "approved" ? "PAGADO" : b.paymentStatus === "pending" ? "PENDIENTE" : "SIN PAGO"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        b.status === "confirmed"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                          : b.status === "pending"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400"
                          : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                      }`}
                    >
                      {b.status === "confirmed" ? "Confirmada" : b.status === "pending" ? "Pendiente" : "Cancelada"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
