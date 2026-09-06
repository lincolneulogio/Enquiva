import { toast } from "sonner";
import { Event } from "@/lib/db/schema";
import { formatEventDate } from "@/lib/utils";
import { buildTicketQrDataUrlClient } from "@/lib/tickets/qr-client";
import {
  createTicketPdfDoc,
  drawOfficialTicketPage,
  getActiveTicketPrimaryRgb,
  loadBrandLogoDataUrl,
} from "@/lib/tickets/render-ticket-pdf";
import { GuestTicketItem } from "./types";

interface DownloadAllGroupTicketsParams {
  event: Event;
  ticketCode?: string | null;
  ticketSignature?: string | null;
  attendeeName?: string | null;
  primaryStatus: string;
  scheduleLabel?: string | null;
  guestsState: GuestTicketItem[];
  locale: "es" | "en";
  brandName: string;
}

export async function downloadAllGroupTickets({
  event,
  ticketCode,
  ticketSignature,
  attendeeName,
  primaryStatus,
  scheduleLabel,
  guestsState,
  locale,
  brandName,
}: DownloadAllGroupTicketsParams) {
  try {
    const [{ jsPDF }, logoDataUrl] = await Promise.all([
      import("jspdf"),
      loadBrandLogoDataUrl(),
    ]);
    const doc = createTicketPdfDoc(jsPDF);
    const theme = {
      primary: getActiveTicketPrimaryRgb(),
      logoDataUrl,
      brandName,
    };

    const ticketsToGenerate = (
      await Promise.all([
        ticketCode
          ? buildTicketQrDataUrlClient(ticketCode, ticketSignature).then((qrCode) =>
              qrCode
                ? {
                    code: ticketCode,
                    attendeeName: attendeeName || "",
                    qrCode,
                    status: primaryStatus,
                    scheduleLabel: scheduleLabel,
                  }
                : null,
            )
          : Promise.resolve(null),
        ...guestsState.map((g) =>
          g.ticket?.code
            ? buildTicketQrDataUrlClient(
                g.ticket.code,
                g.ticket.signature,
              ).then((qrCode) =>
                qrCode
                  ? {
                      code: g.ticket!.code,
                      attendeeName: g.user.name,
                      qrCode,
                      status: g.registration.status,
                      scheduleLabel: g.registration.selectedScheduleLabel,
                    }
                  : null,
              )
            : Promise.resolve(null),
        ),
      ])
    ).filter((t): t is NonNullable<typeof t> => t != null);

    if (ticketsToGenerate.length === 0) {
      toast.error(
        locale === "en"
          ? "No tickets are ready for download yet."
          : "No hay entradas listas para descargar todavía.",
      );
      return;
    }

    const locationText = event.isVirtual
      ? locale === "en"
        ? "Virtual Event"
        : "Evento Virtual"
      : event.location || (locale === "en" ? "To be confirmed" : "Por confirmar");
    const formattedDate = formatEventDate(event.date, locale);
    const ticketLocale = locale === "en" ? "en" : "es";

    for (let i = 0; i < ticketsToGenerate.length; i++) {
      if (i > 0) {
        doc.addPage([320, 520], "portrait");
      }

      const tInfo = ticketsToGenerate[i];
      const statusStr =
        tInfo.status === "checked_in"
          ? locale === "en"
            ? "Checked In"
            : "Ingresó"
          : locale === "en"
            ? "Active / Registered"
            : "Activo / Registrado";

      const dateWithSchedule = tInfo.scheduleLabel
        ? `${formattedDate} · ${tInfo.scheduleLabel}`
        : formattedDate;

      drawOfficialTicketPage(
        doc,
        {
          eventTitle: event.title,
          eventDateLabel: dateWithSchedule,
          locationLabel: locationText,
          attendeeName: tInfo.attendeeName,
          statusLabel: statusStr,
          ticketCode: tInfo.code,
          qrDataUrl: tInfo.qrCode,
          locale: ticketLocale,
        },
        theme,
      );
    }

    const fileName = `${event.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-todas-las-entradas.pdf`;
    doc.save(fileName);
    toast.success(
      locale === "en"
        ? "All group tickets compiled and downloaded as a single PDF!"
        : "¡Todas las entradas de tu grupo compiladas en un solo PDF!",
    );
  } catch (err) {
    console.error(err);
    toast.error(
      locale === "en"
        ? "Failed to download group tickets. Try again."
        : "Fallo al compilar y descargar las entradas de tu grupo.",
    );
  }
}
