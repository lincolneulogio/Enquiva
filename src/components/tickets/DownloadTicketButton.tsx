"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { useLocale, useTranslations } from "@/components/providers/LocaleProvider";
import { usePlatformBrand } from "@/components/providers/PlatformBrandProvider";
import { formatEventDate } from "@/lib/utils";
import { toast } from "sonner";
import { buildTicketQrDataUrlClient } from "@/lib/tickets/qr-client";
import {
  createTicketPdfDoc,
  drawOfficialTicketPage,
  getActiveTicketPrimaryRgb,
  loadBrandLogoDataUrl,
} from "@/lib/tickets/render-ticket-pdf";

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
  scheduleLabel?: string | null;
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
  scheduleLabel,
  className,
}: DownloadTicketButtonProps) {
  const [loading, setLoading] = useState(false);
  const { locale } = useLocale();
  const t = useTranslations();
  const brand = usePlatformBrand();

  const handleDownload = async () => {
    const resolvedQr =
      qrCode ?? (await buildTicketQrDataUrlClient(ticketCode, ticketSignature));

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
      const [{ jsPDF }, logoDataUrl] = await Promise.all([
        import("jspdf"),
        loadBrandLogoDataUrl(),
      ]);

      const doc = createTicketPdfDoc(jsPDF);
      const locationText = isVirtual
        ? locale === "en"
          ? "Virtual Event"
          : "Evento Virtual"
        : eventLocation ||
          (locale === "en" ? "Location to be confirmed" : "Por confirmar");

      const statusStr =
        registrationStatus === "checked_in"
          ? locale === "en"
            ? "Checked In"
            : "Ingresó"
          : locale === "en"
            ? "Active / Registered"
            : "Activo / Registrado";

      const baseDateLabel = formatEventDate(eventDate, locale);
      const eventDateLabel = scheduleLabel
        ? `${baseDateLabel} · ${scheduleLabel}`
        : baseDateLabel;

      drawOfficialTicketPage(
        doc,
        {
          eventTitle,
          eventDateLabel,
          locationLabel: locationText,
          attendeeName,
          statusLabel: statusStr,
          ticketCode,
          qrDataUrl: resolvedQr,
          locale: locale === "en" ? "en" : "es",
        },
        {
          primary: getActiveTicketPrimaryRgb(),
          logoDataUrl,
          brandName: brand.name,
        },
      );

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
          ? locale === "en"
            ? "Generating..."
            : "Generando..."
          : locale === "en"
            ? "Download PDF"
            : t("ticket.download") || "Descargar Entrada"}
      </span>
    </button>
  );
}
