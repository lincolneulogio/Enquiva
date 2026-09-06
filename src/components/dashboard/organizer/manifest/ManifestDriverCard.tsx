interface ManifestDriverCardProps {
  driverName: string;
  setDriverName: (name: string) => void;
  vehiclePlate: string;
  setVehiclePlate: (plate: string) => void;
}

export function ManifestDriverCard({
  driverName,
  setDriverName,
  vehiclePlate,
  setVehiclePlate,
}: ManifestDriverCardProps) {
  return (
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
          className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm text-foreground focus:border-primary focus:outline-hidden focus:ring-1 focus:ring-primary placeholder:text-muted-foreground transition-all duration-200"
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
          className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm text-foreground focus:border-primary focus:outline-hidden focus:ring-1 focus:ring-primary placeholder:text-muted-foreground transition-all duration-200"
        />
      </div>
    </div>
  );
}
