"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useLocale, useTranslations } from "@/components/providers/LocaleProvider";
import { categoryLabel } from "@/lib/utils";
import { Coins, TrendingUp, Bus, Clock, UserCheck, CreditCard, ShieldAlert } from "lucide-react";

type MonthlyDataPoint = {
  month: string;
  events: number;
  registrations: number;
  users: number;
};

type CategoryDataPoint = {
  name: string;
  value: number;
};

interface AdminStatsChartsProps {
  monthlyData: MonthlyDataPoint[];
  categoryData: CategoryDataPoint[];
  paymentMethodsStats: { name: string; value: number }[];
  totalRevenue: number;
  pendingPaymentsCount: number;
  avgPayment: number;
  totalCapacity: number;
  occupiedSeats: number;
  checkedInCount: number;
  registeredCount: number;
  waitlistedCount: number;
}

const COLORS = ["#7c3aed", "#e11d48", "#ea580c", "#16a34a", "#d97706", "#4f46e5", "#06b6d4"];

export function AdminStatsCharts({
  monthlyData,
  categoryData,
  paymentMethodsStats,
  totalRevenue,
  pendingPaymentsCount,
  avgPayment,
  totalCapacity,
  occupiedSeats,
  checkedInCount,
  registeredCount,
  waitlistedCount,
}: AdminStatsChartsProps) {
  const t = useTranslations();
  const { locale } = useLocale();

  const translatedCategoryData = categoryData.map((item) => ({
    ...item,
    name: categoryLabel(item.name, locale),
  }));

  // Calculations
  const showUpRate = registeredCount > 0 ? Math.round((checkedInCount / registeredCount) * 100) : 0;
  const seatsOccupancy = totalCapacity > 0 ? Math.round((occupiedSeats / totalCapacity) * 100) : 0;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Targetas de métricas secundarias avanzadas */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total recaudado */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Total Recaudado</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400">
              <Coins className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
              S/. {totalRevenue.toLocaleString(locale === "en" ? "en-US" : "es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3.5 w-3.5 text-green-500" />
              Ticket Promedio: S/. {avgPayment.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Pagos pendientes */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Pagos Pendientes</span>
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${pendingPaymentsCount > 0 ? "bg-amber-500/10 text-amber-600 animate-pulse" : "bg-muted text-muted-foreground"}`}>
              <ShieldAlert className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
              {pendingPaymentsCount}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {pendingPaymentsCount > 0 ? "⚠️ Requiere verificación manual" : "✅ Todo validado"}
            </p>
          </div>
        </div>

        {/* Tasa de Asistencia */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Tasa de Asistencia</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
              <UserCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
              {showUpRate}%
            </h3>
            <div className="mt-2 h-1.5 w-full rounded-full bg-muted">
              <div className="h-1.5 rounded-full bg-indigo-600" style={{ width: `${showUpRate}%` }} />
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {checkedInCount} de {registeredCount} asistentes presentes
            </p>
          </div>
        </div>

        {/* Ocupación de transporte */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Ocupación Transporte</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
              <Bus className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
              {seatsOccupancy}%
            </h3>
            <div className="mt-2 h-1.5 w-full rounded-full bg-muted">
              <div className="h-1.5 rounded-full bg-blue-600" style={{ width: `${seatsOccupancy}%` }} />
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {occupiedSeats} de {totalCapacity} asientos reservados
            </p>
          </div>
        </div>
      </div>

      {/* Grid de gráficos */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Monthly activity (3 barras ahora!) */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="mb-1 font-display text-lg font-semibold text-foreground">
            Actividad y Crecimiento Mensual
          </h3>
          <p className="mb-4 text-xs text-muted-foreground">Registro histórico de eventos, inscripciones y nuevos usuarios</p>
          {monthlyData.length === 0 ? (
            <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
              {t("dashboard.admin.noMonthlyData")}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px",
                    fontSize: "12px",
                  }}
                />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: "11px" }} />
                <Bar dataKey="events" name="Eventos" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="registrations" name="Inscripciones" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="users" name="Nuevos Usuarios" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Métodos de pago más utilizados */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="mb-1 font-display text-lg font-semibold text-foreground">
            Métodos de Pago Más Utilizados
          </h3>
          <p className="mb-4 text-xs text-muted-foreground">Volumen de pagos aprobados en las inscripciones y transporte</p>
          {paymentMethodsStats.length === 0 ? (
            <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
              No hay pagos registrados para este rango.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={paymentMethodsStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {paymentMethodsStats.map((_, index) => (
                    <Cell key={index} fill={COLORS[(index + 3) % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px",
                    fontSize: "12px",
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => (
                    <span style={{ fontSize: "12px", color: "hsl(var(--foreground))" }}>
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Category breakdown */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="mb-1 font-display text-lg font-semibold text-foreground">
            {t("dashboard.admin.eventsByCategory")}
          </h3>
          <p className="mb-4 text-xs text-muted-foreground">Distribución de eventos según categorías registradas</p>
          {translatedCategoryData.length === 0 ? (
            <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
              {t("dashboard.admin.noCategoriesYet")}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={translatedCategoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {translatedCategoryData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px",
                    fontSize: "12px",
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => (
                    <span style={{ fontSize: "12px", color: "hsl(var(--foreground))" }}>
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Resumen de Cola de Espera y Asistencia */}
        <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6">
          <div>
            <h3 className="mb-1 font-display text-lg font-semibold text-foreground">
              Estado de la Lista de Espera y Asistencia
            </h3>
            <p className="mb-6 text-xs text-muted-foreground">Métricas operacionales de soporte y fluidez del evento</p>
            
            <div className="space-y-5">
              {/* Cola de espera */}
              <div className="flex items-center justify-between rounded-xl bg-amber-500/5 p-4 border border-amber-500/10">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">Lista de Espera Activa</h4>
                    <p className="text-xs text-muted-foreground">Inscripciones retenidas por aforo agotado</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-display text-2xl font-bold text-amber-600">{waitlistedCount}</span>
                  <p className="text-[10px] text-muted-foreground">personas en cola</p>
                </div>
              </div>

              {/* Registro total de entradas emitidas */}
              <div className="flex items-center justify-between rounded-xl bg-indigo-500/5 p-4 border border-indigo-500/10">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">Total de Inscripciones Activas</h4>
                    <p className="text-xs text-muted-foreground">Usuarios oficialmente con entrada emitida</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-display text-2xl font-bold text-indigo-600">{registeredCount}</span>
                  <p className="text-[10px] text-muted-foreground">entradas activas</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-border pt-4 text-center">
            <p className="text-xs text-muted-foreground">
              Tip: Los cambios se recalculan basándose en el filtro de fecha de arriba.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
