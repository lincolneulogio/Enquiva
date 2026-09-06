import { Bus, MapPin } from "lucide-react";
import { BookingItem } from "./types";

interface ManifestTableProps {
  bookings: BookingItem[];
  filteredBookings: BookingItem[];
}

export function ManifestTable({
  bookings,
  filteredBookings,
}: ManifestTableProps) {
  if (bookings.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
        <Bus className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" />
        <p className="text-sm font-medium">Aún no hay pasajeros reservados en este evento.</p>
        <p className="text-xs mt-1">Los pasajeros aparecerán aquí a medida que compren sus boletos de bus.</p>
      </div>
    );
  }

  if (filteredBookings.length === 0) {
    return (
      <div className="rounded-xl border p-12 text-center text-muted-foreground">
        <p className="text-sm">No se encontraron pasajeros con el término de búsqueda.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-xs">
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
  );
}
