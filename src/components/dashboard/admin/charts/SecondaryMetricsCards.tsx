"use client";

import { useLocale, useTranslations } from "@/components/providers/LocaleProvider";
import {
  Coins,
  TrendingUp,
  Bus,
  UserCheck,
  ShieldAlert,
  CheckCircle2,
  Info,
  Users,
  ShieldCheck,
  QrCode,
  Sparkles,
} from "lucide-react";

interface SecondaryMetricsCardsProps {
  totalRevenue: number;
  avgPayment: number;
  pendingPaymentsCount: number;
  checkedInCount: number;
  registeredCount: number;
  totalCapacity: number;
  occupiedSeats: number;
  showEventRevenueHint?: boolean;
}

function CircularGauge({
  percentage,
  strokeColor,
  trackColor = "currentColor",
}: {
  percentage: number;
  strokeColor: string;
  trackColor?: string;
}) {
  const radius = 16;
  const clamped = Math.min(Math.max(percentage, 0), 100);
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 38 38">
        <circle
          cx="19"
          cy="19"
          r={radius}
          className="text-muted/40 dark:text-muted/30"
          strokeWidth="3.5"
          stroke={trackColor}
          fill="none"
        />
        <circle
          cx="19"
          cy="19"
          r={radius}
          stroke={strokeColor}
          strokeWidth="3.5"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <span className="absolute font-display text-[11px] font-bold text-foreground">
        {clamped}%
      </span>
    </div>
  );
}

function GlowingSparkline({ color = "#059669" }: { color?: string }) {
  const gradientId = `glow-spark-${color.replace("#", "")}`;
  return (
    <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 overflow-hidden opacity-25 dark:opacity-20">
      <svg
        className="h-full w-full"
        viewBox="0 0 100 28"
        preserveAspectRatio="none"
        fill="none"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <path
          d="M0,24 C20,24 35,18 55,14 C75,9 88,6 100,4 L100,28 L0,28 Z"
          fill={`url(#${gradientId})`}
        />
        <path
          d="M0,24 C20,24 35,18 55,14 C75,9 88,6 100,4"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}

export function SecondaryMetricsCards({
  totalRevenue,
  avgPayment,
  pendingPaymentsCount,
  checkedInCount,
  registeredCount,
  totalCapacity,
  occupiedSeats,
  showEventRevenueHint = false,
}: SecondaryMetricsCardsProps) {
  const t = useTranslations();
  const { locale } = useLocale();

  const showUpRate = registeredCount > 0 ? Math.round((checkedInCount / registeredCount) * 100) : 0;
  const seatsOccupancy = totalCapacity > 0 ? Math.round((occupiedSeats / totalCapacity) * 100) : 0;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* 1. Recaudado en eventos */}
      <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-b from-card via-card to-muted/20 p-5 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/40 hover:shadow-md sm:p-6">
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/80 to-transparent" />
        <GlowingSparkline color="#059669" />

        <div className="relative z-10">
          <div className="flex items-center justify-between gap-2">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200/80 bg-emerald-50/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300">
                <Sparkles className="h-3 w-3" />
                Finanzas
              </span>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t("dashboard.admin.statsTotalRevenue")}
              </h4>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-200/80 bg-emerald-50 text-emerald-600 shadow-2xs dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-400">
              <Coins className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-baseline gap-1">
              <span className="font-display text-sm font-semibold text-muted-foreground">S/.</span>
              <h3 className="font-display text-2xl font-black tracking-tight text-foreground sm:text-3xl">
                {totalRevenue.toLocaleString(locale === "en" ? "en-US" : "es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg border border-emerald-200/80 bg-emerald-50/90 px-2.5 py-1 text-xs font-semibold text-emerald-700 shadow-2xs dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{t("dashboard.admin.statsAvgTicket", { amount: avgPayment.toFixed(2) })}</span>
            </div>
          </div>
        </div>

        {showEventRevenueHint ? (
          <div className="relative z-10 mt-4 flex items-start gap-1.5 border-t border-border/60 pt-3 text-[11px] leading-relaxed text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
            <span>{t("dashboard.admin.statsTotalRevenueHint")}</span>
          </div>
        ) : (
          <div className="relative z-10 mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Entradas y transporte
            </span>
            <span className="font-medium text-foreground">PEN</span>
          </div>
        )}
      </div>

      {/* 2. Pagos pendientes */}
      <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-b from-card via-card to-muted/20 p-5 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/40 hover:shadow-md sm:p-6">
        <div
          className={`absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent ${
            pendingPaymentsCount > 0 ? "via-amber-500/80" : "via-emerald-500/80"
          } to-transparent`}
        />
        <GlowingSparkline color={pendingPaymentsCount > 0 ? "#d97706" : "#059669"} />

        <div className="relative z-10">
          <div className="flex items-center justify-between gap-2">
            <div className="space-y-1">
              <span
                className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  pendingPaymentsCount > 0
                    ? "border-amber-200/80 bg-amber-50/70 text-amber-700 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-300"
                    : "border-emerald-200/80 bg-emerald-50/70 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300"
                }`}
              >
                <ShieldCheck className="h-3 w-3" />
                Auditoría
              </span>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t("dashboard.admin.statsPendingPayments")}
              </h4>
            </div>
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border shadow-2xs ${
                pendingPaymentsCount > 0
                  ? "border-amber-300 bg-amber-50 text-amber-600 animate-pulse dark:border-amber-700 dark:bg-amber-950/40"
                  : "border-emerald-200/80 bg-emerald-50 text-emerald-600 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-400"
              }`}
            >
              {pendingPaymentsCount > 0 ? (
                <ShieldAlert className="h-5 w-5" />
              ) : (
                <CheckCircle2 className="h-5 w-5" />
              )}
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <h3 className="font-display text-2xl font-black tracking-tight text-foreground sm:text-3xl">
                {pendingPaymentsCount}
              </h3>
              <span className="text-xs font-medium text-muted-foreground">
                {pendingPaymentsCount === 1 ? "operación" : "operaciones"}
              </span>
            </div>
            <div className="mt-2.5">
              {pendingPaymentsCount > 0 ? (
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200/80 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 shadow-2xs dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
                  {t("dashboard.admin.statsPendingReview")}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200/80 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 shadow-2xs dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  {t("dashboard.admin.statsAllValidated")}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                pendingPaymentsCount > 0 ? "bg-amber-500" : "bg-emerald-500"
              }`}
            />
            {pendingPaymentsCount === 0 ? "Sin cobros retenidos" : "Requiere validación"}
          </span>
          <span className="font-semibold text-foreground">
            {pendingPaymentsCount === 0 ? "100% OK" : "Pendiente"}
          </span>
        </div>
      </div>

      {/* 3. Tasa de Asistencia */}
      <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-b from-card via-card to-muted/20 p-5 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/40 hover:shadow-md sm:p-6">
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/80 to-transparent" />

        <div className="relative z-10">
          <div className="flex items-center justify-between gap-2">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1 rounded-md border border-indigo-200/80 bg-indigo-50/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:border-indigo-800/60 dark:bg-indigo-950/40 dark:text-indigo-300">
                <QrCode className="h-3 w-3" />
                Check-in
              </span>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t("dashboard.admin.statsAttendanceRate")}
              </h4>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-200/80 bg-indigo-50 text-indigo-600 shadow-2xs dark:border-indigo-800/50 dark:bg-indigo-950/40 dark:text-indigo-400">
              <UserCheck className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <div>
              <div className="flex items-baseline gap-1">
                <h3 className="font-display text-2xl font-black tracking-tight text-foreground sm:text-3xl">
                  {showUpRate}%
                </h3>
              </div>
              <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <Users className="h-3.5 w-3.5 text-indigo-500" />
                <span>
                  {checkedInCount} / {registeredCount} asistentes
                </span>
              </p>
            </div>
            <CircularGauge percentage={showUpRate} strokeColor="#4f46e5" />
          </div>

          <div className="mt-3.5 h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
            <div
              className="h-full rounded-full bg-indigo-600 transition-all duration-700 ease-out"
              style={{ width: `${showUpRate}%` }}
            />
          </div>
        </div>

        <div className="relative z-10 mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
            Acceso en puerta
          </span>
          <span className="font-medium text-foreground">
            {checkedInCount}/{registeredCount}
          </span>
        </div>
      </div>

      {/* 4. Ocupación de transporte */}
      <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-b from-card via-card to-muted/20 p-5 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-sky-500/40 hover:shadow-md sm:p-6">
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-sky-500/80 to-transparent" />

        <div className="relative z-10">
          <div className="flex items-center justify-between gap-2">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1 rounded-md border border-sky-200/80 bg-sky-50/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-700 dark:border-sky-800/60 dark:bg-sky-950/40 dark:text-sky-300">
                <Bus className="h-3 w-3" />
                Movilidad
              </span>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t("dashboard.admin.statsTransportOccupancy")}
              </h4>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-200/80 bg-sky-50 text-sky-600 shadow-2xs dark:border-sky-800/50 dark:bg-sky-950/40 dark:text-sky-400">
              <Bus className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <div>
              <div className="flex items-baseline gap-1">
                <h3 className="font-display text-2xl font-black tracking-tight text-foreground sm:text-3xl">
                  {seatsOccupancy}%
                </h3>
              </div>
              <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <Bus className="h-3.5 w-3.5 text-sky-500" />
                <span>
                  {occupiedSeats} / {totalCapacity} asientos
                </span>
              </p>
            </div>
            <CircularGauge percentage={seatsOccupancy} strokeColor="#0284c7" />
          </div>

          <div className="mt-3.5 h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
            <div
              className="h-full rounded-full bg-sky-500 transition-all duration-700 ease-out"
              style={{ width: `${seatsOccupancy}%` }}
            />
          </div>
        </div>

        <div className="relative z-10 mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
            {totalCapacity === 0 ? "Sin flota asignada" : "Ruta activa"}
          </span>
          <span className="font-medium text-foreground">
            {occupiedSeats}/{totalCapacity}
          </span>
        </div>
      </div>
    </div>
  );
}
