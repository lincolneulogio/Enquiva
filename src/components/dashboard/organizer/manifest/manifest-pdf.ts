import type { jsPDF } from "jspdf";
import { BookingItem } from "./types";

interface BuildManifestPdfParams {
  brandName: string;
  driverName: string;
  vehiclePlate: string;
  bookings: BookingItem[];
}

export async function buildManifestPdf({
  brandName,
  driverName,
  vehiclePlate,
  bookings,
}: BuildManifestPdfParams): Promise<jsPDF> {
  const [{ jsPDF: JsPdfClass }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);

  const doc = new JsPdfClass();

  // Deep purple header banner
  doc.setFillColor(75, 26, 181);
  doc.rect(0, 0, 210, 38, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("MANIFIESTO DE PASAJEROS", 14, 22);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`${brandName} - Sistema de Control y Logística de Rutas`, 14, 30);

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

    currentY = ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? currentY) + 12;
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
}
