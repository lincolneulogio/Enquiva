import Link from "next/link";
import { Bus, Award, ExternalLink } from "lucide-react";
import { getIntlLocale } from "@/lib/i18n/core";
import { formatCurrency, registrationStatusLabel } from "@/lib/utils";
import { isGuestRegistration } from "@/lib/registrations/guests";

const statusColor: Record<string, string> = {
    registered: "bg-green-100 text-green-900 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/30",
    waitlisted: "bg-amber-100 text-amber-900 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/30",
    checked_in: "bg-blue-100 text-blue-900 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/30",
    cancelled: "bg-red-100 text-red-900 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/30",
};

interface RegistrationRowProps {
    reg: {
        id: string;
        status: string;
        registeredAt: Date;
        checkedInAt: Date | null;
        guestId: string | null;
        parentRegistrationId: string | null;
        wantsCertificate: boolean | null;
        certificateCode: string | null;
        event: {
            id: string;
            title: string;
            slug: string;
            date: Date;
            hasCertificate: boolean | null;
            certificateTitle: string | null;
            certificatePrice: string | null;
        };
        attendee: {
            id: string;
            name: string;
            email: string | null;
        } | null;
    };
    index: number;
    rowStart: number;
    locale: "en" | "es";
    inviter: { name: string | null; email: string } | undefined;
    parentRegId: string | undefined;
    payment: { amount: string; status: string; method: string; currency: string } | undefined;
    transport: { seats: number; routeName: string | null; totalSeats: number | null } | undefined;
    hasOwnPayment: boolean;
    hasOwnTransport: boolean;
}

export function RegistrationTableRow({
    reg,
    index,
    rowStart,
    locale,
    inviter,
    parentRegId,
    payment,
    transport,
    hasOwnPayment,
    hasOwnTransport,
}: RegistrationRowProps) {
    const intlLocale = getIntlLocale(locale as "en" | "es");
    const isGuest = isGuestRegistration({
        guestId: reg.guestId,
        parentRegistrationId: reg.parentRegistrationId,
        email: reg.attendee?.email,
    });

    return (
        <tr className="hover:bg-muted/30 transition-colors">
            <td className="px-4 py-4 text-muted-foreground">{rowStart + index + 1}</td>
            <td className="px-4 py-4">
                <p className="font-medium text-foreground">{reg.attendee?.name ?? "Asistente"}</p>
                <p className="text-xs text-muted-foreground">{reg.attendee?.email ?? "â€”"}</p>
            </td>
            <td className="px-4 py-4">
                <Link
                    href={`/events/${reg.event.slug}`}
                    className="font-medium text-foreground hover:text-primary transition-colors"
                >
                    {reg.event.title}
                </Link>
                <p className="text-xs text-muted-foreground">
                    {new Date(reg.event.date).toLocaleDateString(intlLocale, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                    })}
                </p>
            </td>
            <td className="px-4 py-4">
                {isGuest ? (
                    <div className="space-y-1">
                        <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400 border border-amber-500/20">
                            {locale === "en" ? "Guest" : "Invitado"}
                        </span>
                        {inviter && (
                            <p className="text-[11px] text-muted-foreground leading-none">
                                {locale === "en" ? "by " : "de "}
                                <span className="font-medium text-foreground">{inviter.name}</span>
                            </p>
                        )}
                    </div>
                ) : reg.attendee?.email?.startsWith("offline_") ? (
                    <span className="inline-flex items-center rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:text-indigo-400 border border-indigo-500/20">
                        {locale === "en" ? "Manual Reg" : "Reg. Manual"}
                    </span>
                ) : (
                    <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                        {locale === "en" ? "Primary" : "Titular"}
                    </span>
                )}
            </td>
            <td className="px-4 py-4">
                {payment ? (
                    <div className="space-y-1">
                        <p className="font-semibold text-foreground">
                            {formatCurrency(Number(payment.amount), payment.currency, locale)}
                        </p>
                        <div className="flex flex-wrap items-center gap-1">
                            <span className="text-[9px] text-muted-foreground uppercase bg-secondary px-1 py-0.5 rounded font-medium">
                                {payment.method}
                            </span>
                            <span className={`text-[9px] px-1 py-0.5 rounded font-semibold border ${
                                payment.status === "approved"
                                    ? "bg-green-500/10 text-green-700 border-green-500/20"
                                    : payment.status === "pending"
                                        ? "bg-amber-500/10 text-amber-700 border-amber-500/20"
                                        : "bg-red-500/10 text-red-700 border-red-500/20"
                            }`}>
                                {payment.status === "approved"
                                    ? (locale === "en" ? "Paid" : "Pagado")
                                    : payment.status === "pending"
                                        ? (locale === "en" ? "Pending" : "Pendiente")
                                        : (locale === "en" ? "Rejected" : "Rechazado")}
                            </span>
                            {parentRegId && !hasOwnPayment && (
                                <span className="text-[9px] text-muted-foreground/80 block italic">
                                    {locale === "en" ? "(via sponsor)" : "(vÃ­a titular)"}
                                </span>
                            )}
                        </div>
                    </div>
                ) : (
                    <span className="text-xs text-muted-foreground/55 italic">
                        {locale === "en" ? "No payment" : "Sin pago"}
                    </span>
                )}
            </td>
            <td className="px-4 py-4">
                {transport ? (
                    <div className="space-y-1">
                        <p className="font-medium text-foreground text-xs truncate max-w-[220px]" title={transport.routeName ?? ""}>
                            {transport.routeName ?? (locale === "en" ? "Booked" : "Reservado")}
                        </p>
                        <p className="text-[11px] text-muted-foreground leading-none flex items-center gap-1">
                            <Bus className="h-3 w-3 text-primary shrink-0" />
                            {locale === "en"
                                ? `${transport.seats} ${transport.seats === 1 ? "seat" : "seats"} of ${transport.totalSeats ?? 0}`
                                : `${transport.seats} ${transport.seats === 1 ? "asiento" : "asientos"} de ${transport.totalSeats ?? 0}`}
                            {parentRegId && !hasOwnTransport && (
                                <span className="text-[9px] text-muted-foreground/80 italic ml-1">
                                    {locale === "en" ? "(via sponsor)" : "(vÃ­a titular)"}
                                </span>
                            )}
                        </p>
                    </div>
                ) : (
                    <span className="text-xs text-muted-foreground/55 italic">
                        {locale === "en" ? "No transport" : "Sin transporte"}
                    </span>
                )}
            </td>
            <td className="px-4 py-4">
                {reg.event.hasCertificate ? (
                    <div className="space-y-1">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                            <Award className="h-3 w-3" />
                            <span>{locale === "en" ? "Yes" : "SÃ­"}</span>
                        </span>
                        <p className="text-xs font-medium text-foreground truncate max-w-[170px]">
                            {reg.event.certificateTitle || "Certificado Oficial"}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                            {reg.event.certificatePrice && Number(reg.event.certificatePrice) > 0
                                ? `+ S/ ${Number(reg.event.certificatePrice).toFixed(2)}`
                                : (locale === "en" ? "Included (Free)" : "Incluido (Gratis)")}
                        </p>
                    </div>
                ) : (
                    <span className="text-xs text-muted-foreground/50 italic">
                        {locale === "en" ? "No" : "No ofrece"}
                    </span>
                )}
            </td>
            <td className="px-4 py-4">
                {!reg.event.hasCertificate ? (
                    <span className="text-xs text-muted-foreground/40">â€”</span>
                ) : !reg.wantsCertificate ? (
                    <span className="inline-flex items-center rounded-md bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground border border-border">
                        {locale === "en" ? "Not requested" : "No lo solicitÃ³"}
                    </span>
                ) : (
                    <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-1">
                            {reg.status === "checked_in" ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                                    âœ“ {locale === "en" ? "Checked-in / Issued" : "AsistiÃ³ / Emitido"}
                                </span>
                            ) : payment?.status === "approved" || !payment ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-300 border border-blue-500/20">
                                    âœ“ {locale === "en" ? "Paid / Requested" : "Pagado y Solicitado"}
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300 border border-amber-500/20">
                                    â³ {locale === "en" ? "Payment Pending" : "Pago Pendiente"}
                                </span>
                            )}
                        </div>
                        {reg.certificateCode && (
                            <div className="flex items-center gap-1.5">
                                <Link
                                    href={`/verify/${reg.certificateCode}`}
                                    target="_blank"
                                    className="text-[10px] font-mono font-bold text-primary hover:underline flex items-center gap-0.5"
                                >
                                    <span>{reg.certificateCode}</span>
                                    <ExternalLink className="h-2.5 w-2.5 opacity-70" />
                                </Link>
                            </div>
                        )}
                    </div>
                )}
            </td>
            <td className="px-4 py-4">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor[reg.status] ?? "bg-secondary text-foreground"}`}>
                    {registrationStatusLabel(reg.status, locale)}
                </span>
            </td>
            <td className="px-4 py-4 text-muted-foreground">
                {new Date(reg.registeredAt).toLocaleDateString(intlLocale, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                })}
            </td>
            <td className="px-4 py-4 text-muted-foreground">
                {reg.checkedInAt
                    ? new Date(reg.checkedInAt).toLocaleDateString(intlLocale, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                      })
                    : <span className="text-muted-foreground/40">â€”</span>}
            </td>
        </tr>
    );
}
