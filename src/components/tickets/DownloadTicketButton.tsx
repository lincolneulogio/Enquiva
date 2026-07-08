"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { useLocale, useTranslations } from "@/components/providers/LocaleProvider";
import { formatEventDate } from "@/lib/utils";
import { toast } from "sonner";
import { buildTicketQrDataUrlClient } from "@/lib/tickets/qr-client";

interface DownloadTicketButtonProps {
  ticketCode: string;
  eventTitle: string;
  eventDate: Date | string;
  eventLocation?: string | null;
  isVirtual?: boolean;
  attendeeName?: string | null;
  qrCode?: string | null;
  ticketSignature?: string | null;
  registrationStatus?: string | null;
  className?: string;
}

export function DownloadTicketButton({
  ticketCode,
  eventTitle,
  eventDate,
  eventLocation,
  isVirtual = false,
  attendeeName,
  qrCode,
  ticketSignature,
  registrationStatus,
  className,
}: DownloadTicketButtonProps) {
  const [loading, setLoading] = useState(false);
  const { locale } = useLocale();
  const t = useTranslations();

  const handleDownload = async () => {
    const resolvedQr =
      qrCode ?? (await buildTicketQrDataUrlClient(ticketCode, ticketSignature, null));

    if (!resolvedQr) {
      toast.error(
        locale === "en"
          ? "QR Code is not ready yet."
          : "El código QR aún no está listo."
      );
      return;
    }

    setLoading(true);
    try {
      // Dynamically import jsPDF on the client side
      const { jsPDF } = await import("jspdf");

      // Create a compact ticket-sized document (width: 320pt, height: 520pt)
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: [320, 520],
      });

      // --- 1. CABECERA PREMIUM (BANNER SUPERIOR) ---
      // Dibujar un banner con degradado de color de marca (azul/púrpura premium)
      doc.setFillColor(109, 76, 217); // #6d4cd9 (violeta primario)
      doc.rect(0, 0, 320, 95, "F");

      // Círculos estéticos decorativos en el banner
      doc.setFillColor(124, 93, 230);
      doc.circle(280, 20, 40, "F");
      doc.setFillColor(93, 58, 208);
      doc.circle(30, 80, 25, "F");

      // Título de la app en la cabecera
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("Evora", 160, 40, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(215, 205, 255);
      doc.text(
        locale === "en" ? "Official Event Ticket" : "Entrada Oficial del Evento",
        160,
        58,
        { align: "center" }
      );

      // --- 2. DETALLES DEL EVENTO ---
      doc.setTextColor(30, 30, 30);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      
      // Limitar el título a 2 líneas si es muy largo
      const splitTitle = doc.splitTextToSize(eventTitle, 280);
      doc.text(splitTitle, 20, 130);

      const titleHeight = splitTitle.length * 18;
      let currentY = 130 + titleHeight + 5;

      // Línea fina divisoria
      doc.setDrawColor(230, 230, 230);
      doc.setLineWidth(1);
      doc.line(20, currentY, 300, currentY);
      currentY += 20;

      // Campos de información con estructura limpia de grilla
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      doc.text(locale === "en" ? "FECHA Y HORA" : "FECHA Y HORA", 20, currentY);
      doc.text(locale === "en" ? "LUGAR" : "LUGAR / UBICACIÓN", 165, currentY);

      currentY += 14;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(40, 40, 40);
      
      // Fecha formateada corta
      const formattedDate = formatEventDate(eventDate, locale);
      const splitDate = doc.splitTextToSize(formattedDate, 135);
      doc.text(splitDate, 20, currentY);

      // Lugar
      const locationText = isVirtual
        ? (locale === "en" ? "Virtual Event (Link details online)" : "Evento Virtual (Detalles en línea)")
        : (eventLocation || (locale === "en" ? "Location to be confirmed" : "Por confirmar"));
      const splitLoc = doc.splitTextToSize(locationText, 135);
      doc.text(splitLoc, 165, currentY);

      currentY += Math.max(splitDate.length * 12, splitLoc.length * 12) + 15;

      // Línea fina divisoria 2
      doc.line(20, currentY, 300, currentY);
      currentY += 20;

      // --- 3. DETALLES DEL ASISTENTE ---
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      doc.text(locale === "en" ? "ATTENDEE" : "ASISTENTE", 20, currentY);
      doc.text(locale === "en" ? "STATUS" : "ESTADO", 165, currentY);

      currentY += 14;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(40, 40, 40);
      doc.text(attendeeName || "—", 20, currentY);
      
      // Estado con color
      const statusStr = registrationStatus === "checked_in"
        ? (locale === "en" ? "Checked In" : "Ingresó")
        : (locale === "en" ? "Active / Registered" : "Activo / Registrado");
      doc.text(statusStr, 165, currentY);

      currentY += 20;

      // --- 4. TICKET STUB (TEAR-OFF / SECCIÓN QR) ---
      // Dibujar línea discontinua de troquelado
      doc.setDrawColor(180, 180, 180);
      doc.setLineDashPattern([4, 4], 0);
      doc.line(15, currentY, 305, currentY);
      doc.setLineDashPattern([], 0); // restablecer línea continua

      // Muescas semicirculares de boleto en los bordes
      doc.setFillColor(240, 240, 240); // Asumimos un color de fondo gris claro para el contenedor exterior si es posible, o blanco
      doc.circle(0, currentY, 8, "F");
      doc.circle(320, currentY, 8, "F");

      currentY += 25;

      // Renderizar el QR Code
      const qrSize = 100;
      const qrX = (320 - qrSize) / 2;
      doc.addImage(resolvedQr, "PNG", qrX, currentY, qrSize, qrSize);
      currentY += qrSize + 15;

      // Código de Ticket
      doc.setTextColor(80, 80, 80);
      doc.setFont("courier", "bold");
      doc.setFontSize(12);
      doc.text(ticketCode, 160, currentY, { align: "center" });

      currentY += 15;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(140, 140, 140);
      doc.text(
        locale === "en"
          ? "Please present this code at the event entrance."
          : "Por favor, presente este código en el ingreso al evento.",
        160,
        currentY,
        { align: "center" }
      );

      // Guardar PDF
      const fileName = `${eventTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-ticket.pdf`;
      doc.save(fileName);

      toast.success(
        locale === "en"
          ? "Ticket PDF downloaded successfully!"
          : "¡Ticket PDF descargado con éxito!"
      );
    } catch (error) {
      console.error("Failed to generate PDF ticket:", error);
      toast.error(
        locale === "en"
          ? "Could not generate ticket PDF. Try again."
          : "No se pudo generar el ticket PDF. Inténtalo de nuevo."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className={className}
    >
      <Download className="h-4 w-4" />
      <span>
        {loading
          ? (locale === "en" ? "Generating..." : "Generando...")
          : (locale === "en" ? "Download PDF" : t("ticket.download") || "Descargar Entrada")}
      </span>
    </button>
  );
}
