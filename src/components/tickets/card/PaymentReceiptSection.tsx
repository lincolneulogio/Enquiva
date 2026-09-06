"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Coins,
  Eye,
  RefreshCw,
  Wallet,
  CheckCircle2,
  AlertCircle,
  FileText,
} from "lucide-react";
import { Registration } from "@/lib/db/schema";
import { paymentCheckoutPath } from "@/lib/navigation/attendee-paths";

interface PaymentReceiptSectionProps {
  registration: Registration;
  paymentStatus?: string;
  paymentReceiptUrl?: string | null;
  paymentMethod?: string | null;
  locale: string;
  t: (key: string, params?: Record<string, any>) => string;
}

export function PaymentReceiptSection({
  registration,
  paymentStatus,
  paymentReceiptUrl,
  paymentMethod,
  locale,
  t,
}: PaymentReceiptSectionProps) {
  return (
    <div className="space-y-4 md:border-l md:border-border md:pl-6 lg:pl-8">
      <h4 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2 border-b border-border/30 pb-2">
        <Coins className="h-4.5 w-4.5 text-primary" />
        {locale === "en" ? "Payment & Receipt" : "Estado Financiero y Comprobante"}
      </h4>

      {/* CASO 1: Pago Pendiente con Comprobante Subido */}
      {paymentStatus === "pending" && paymentReceiptUrl && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-2">
            <p className="font-semibold text-amber-800 dark:text-amber-400 text-sm flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              {t("ticket.verificationPending")}
            </p>
            <p className="text-xs text-muted-foreground leading-normal">
              {t("ticket.verificationPendingHelp")}
            </p>
          </div>

          {/* Vista Previa del Comprobante */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-muted-foreground block">
              {locale === "en"
                ? "Preview of submitted receipt:"
                : "Vista previa del comprobante cargado:"}
            </span>
            <div className="relative group rounded-2xl overflow-hidden border border-border bg-muted/30 aspect-[4/3] flex items-center justify-center max-w-sm shadow-sm">
              <Image
                src={paymentReceiptUrl}
                alt="Vista previa comprobante"
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                unoptimized
              />
              {/* Hover action layer for desktop */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:flex items-center justify-center gap-2">
                <a
                  href={paymentReceiptUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg bg-background/95 hover:bg-background text-foreground px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 shadow-md transition active:scale-95"
                >
                  <Eye className="h-3.5 w-3.5" />
                  {locale === "en" ? "View Large" : "Ver Grande"}
                </a>
                <Link
                  href={paymentCheckoutPath(registration.id)}
                  className="rounded-lg bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 shadow-md transition active:scale-95"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  {locale === "en" ? "Change Payment" : "Cambiar Pago"}
                </Link>
              </div>
            </div>

            {/* Always visible buttons for mobile/touch screens */}
            <div className="flex md:hidden items-center gap-2">
              <a
                href={paymentReceiptUrl}
                target="_blank"
                rel="noreferrer"
                className="flex-1 rounded-xl border border-border bg-background hover:bg-secondary text-foreground px-3 py-2 text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition"
              >
                <Eye className="h-3.5 w-3.5" />
                {locale === "en" ? "View Large" : "Ver Grande"}
              </a>
              <Link
                href={paymentCheckoutPath(registration.id)}
                className="flex-1 rounded-xl bg-amber-600 hover:bg-amber-700 text-white px-3 py-2 text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                {locale === "en" ? "Change Payment" : "Cambiar Pago"}
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* CASO 2: Pago Pendiente en Efectivo */}
      {paymentStatus === "pending" && !paymentReceiptUrl && paymentMethod === "cash" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-4 space-y-3">
            <div className="flex items-start gap-2.5">
              <Wallet className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-semibold text-indigo-800 dark:text-indigo-400 text-sm">
                  {t("ticket.cashPaymentTitle")}
                </p>
                <p className="text-xs text-muted-foreground leading-normal">
                  {t("ticket.cashPaymentHelp")}
                </p>
              </div>
            </div>
          </div>

          <Link
            href={paymentCheckoutPath(registration.id)}
            className="flex items-center justify-center gap-1.5 w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 text-xs font-bold shadow-sm transition active:scale-[0.98]"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            {t("ticket.changePaymentMethod")}
          </Link>
        </div>
      )}

      {/* CASO 3: Pago Pendiente Sin Comprobante */}
      {paymentStatus === "pending" && !paymentReceiptUrl && paymentMethod !== "cash" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-amber-200/50 bg-amber-500/5 p-4 space-y-2 animate-pulse">
            <p className="font-semibold text-amber-800 dark:text-amber-400 text-sm">
              {t("ticket.pendingPayment")}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t("ticket.pendingPaymentHelp")}
            </p>
          </div>

          <Link
            href={paymentCheckoutPath(registration.id)}
            className="flex items-center justify-center gap-2 w-full rounded-xl bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 text-xs font-bold uppercase tracking-wider shadow-sm transition active:scale-[0.98]"
          >
            <Coins className="h-4 w-4" />
            {t("ticket.payOrUploadReceipt")}
          </Link>
        </div>
      )}

      {/* CASO 4: Pago Aprobado */}
      {paymentStatus === "approved" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-4 space-y-2">
            <p className="font-semibold text-green-800 dark:text-green-400 text-sm flex items-center gap-1.5">
              <CheckCircle2 className="h-4.5 w-4.5 text-green-500" />
              {locale === "en" ? "Payment Confirmed & Verified" : "Pago Confirmado y Validado"}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {locale === "en"
                ? "The organizer has successfully verified your payment. Everything is ready for your attendance. Enjoy the event!"
                : "El organizador ha verificado tu pago correctamente. Todo se encuentra en orden para tu asistencia. ¡Disfruta el evento!"}
            </p>
          </div>

          {paymentReceiptUrl && (
            <div className="rounded-xl border border-border bg-muted/10 p-3 flex items-center justify-between gap-3 max-w-sm">
              <div className="flex items-center gap-2">
                <FileText className="h-4.5 w-4.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground truncate">
                  {locale === "en" ? "Archived receipt" : "Comprobante archivado"}
                </span>
              </div>
              <a
                href={paymentReceiptUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-primary font-semibold hover:underline"
              >
                {locale === "en" ? "View receipt" : "Ver comprobante"}
              </a>
            </div>
          )}
        </div>
      )}

      {/* CASO 5: Pago Rechazado */}
      {paymentStatus === "rejected" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 space-y-2">
            <p className="font-semibold text-red-800 dark:text-red-400 text-sm flex items-center gap-1.5">
              <AlertCircle className="h-4.5 w-4.5 text-red-500" />
              {locale === "en" ? "Payment Rejected" : "Pago Rechazado"}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {locale === "en"
                ? "There was an issue with the submitted proof of payment. Please verify the document and upload it again."
                : "Hubo un inconveniente con el comprobante de pago enviado. Por favor, verifica el documento y vuelve a cargarlo para revisión."}
            </p>
          </div>

          <Link
            href={paymentCheckoutPath(registration.id)}
            className="flex items-center justify-center gap-2 w-full rounded-xl bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 text-xs font-bold uppercase tracking-wider shadow-sm transition active:scale-[0.98]"
          >
            <RefreshCw className="h-4 w-4" />
            {locale === "en" ? "Upload New Receipt" : "Subir Nuevo Comprobante"}
          </Link>
        </div>
      )}
    </div>
  );
}
