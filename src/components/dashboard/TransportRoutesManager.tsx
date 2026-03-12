"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Pencil, Bus, Users, Check, X } from "lucide-react";
import {
    createRoute,
    updateRoute,
    deleteRoute,
    toggleRouteActive,
} from "@/actions/transport";

interface Route {
    id: string;
    eventId: string;
    name: string;
    departurePoint: string;
    departureTime: Date;
    returnTime: Date | null;
    pricePerSeat: string;
    totalSeats: number;
    description: string | null;
    isActive: boolean;
    bookedSeats: number;
}

interface TransportRoutesManagerProps {
    eventId: string;
    initialRoutes: Route[];
}

const EMPTY_FORM = {
    name: "",
    departurePoint: "",
    departureTime: "",
    returnTime: "",
    pricePerSeat: "",
    totalSeats: "",
    description: "",
};

function toDatetimeLocal(date: Date | null | undefined): string {
    if (!date) return "";
    return new Date(date).toISOString().slice(0, 16);
}

export function TransportRoutesManager({
    eventId,
    initialRoutes,
}: TransportRoutesManagerProps) {
    const [routes, setRoutes] = useState<Route[]>(initialRoutes);
    const [isPending, startTransition] = useTransition();
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const openCreate = () => {
        setEditId(null);
        setForm(EMPTY_FORM);
        setShowForm(true);
    };

    const openEdit = (r: Route) => {
        setEditId(r.id);
        setForm({
            name: r.name,
            departurePoint: r.departurePoint,
            departureTime: toDatetimeLocal(r.departureTime),
            returnTime: toDatetimeLocal(r.returnTime),
            pricePerSeat: r.pricePerSeat,
            totalSeats: r.totalSeats.toString(),
            description: r.description ?? "",
        });
        setShowForm(true);
    };

    const handleSubmit = () => {
        const price = parseFloat(form.pricePerSeat);
        const seats = parseInt(form.totalSeats);

        if (!form.name.trim() || !form.departurePoint.trim() || !form.departureTime) {
            toast.error("Nombre, punto de salida y hora son requeridos");
            return;
        }
        if (isNaN(price) || price < 0) {
            toast.error("Precio inválido");
            return;
        }
        if (isNaN(seats) || seats < 1) {
            toast.error("Número de asientos inválido");
            return;
        }

        startTransition(async () => {
            try {
                if (editId) {
                    await updateRoute(editId, {
                        name: form.name,
                        departurePoint: form.departurePoint,
                        departureTime: form.departureTime,
                        returnTime: form.returnTime || null,
                        pricePerSeat: price,
                        totalSeats: seats,
                        description: form.description || null,
                    });
                    setRoutes((prev) =>
                        prev.map((r) =>
                            r.id === editId
                                ? {
                                    ...r,
                                    name: form.name,
                                    departurePoint: form.departurePoint,
                                    departureTime: new Date(form.departureTime),
                                    returnTime: form.returnTime ? new Date(form.returnTime) : null,
                                    pricePerSeat: price.toFixed(2),
                                    totalSeats: seats,
                                    description: form.description || null,
                                }
                                : r
                        )
                    );
                    toast.success("Ruta actualizada");
                } else {
                    const result = await createRoute({
                        eventId,
                        name: form.name,
                        departurePoint: form.departurePoint,
                        departureTime: form.departureTime,
                        returnTime: form.returnTime || null,
                        pricePerSeat: price,
                        totalSeats: seats,
                        description: form.description || null,
                    });
                    if (result.success && result.route) {
                        setRoutes((prev) => [
                            ...prev,
                            { ...result.route, bookedSeats: 0 } as Route,
                        ]);
                    }
                    toast.success("Ruta creada");
                }
                setShowForm(false);
                setEditId(null);
                setForm(EMPTY_FORM);
            } catch (e) {
                toast.error(e instanceof Error ? e.message : "Error al guardar");
            }
        });
    };

    const handleDelete = (routeId: string) => {
        setDeletingId(routeId);
        startTransition(async () => {
            try {
                await deleteRoute(routeId);
                setRoutes((prev) => prev.filter((r) => r.id !== routeId));
                toast.success("Ruta eliminada");
            } catch (e) {
                toast.error(e instanceof Error ? e.message : "Error al eliminar");
            } finally {
                setDeletingId(null);
            }
        });
    };

    const handleToggle = (routeId: string, current: boolean) => {
        startTransition(async () => {
            try {
                await toggleRouteActive(routeId, !current);
                setRoutes((prev) =>
                    prev.map((r) => (r.id === routeId ? { ...r, isActive: !current } : r))
                );
                toast.success(!current ? "Ruta activada" : "Ruta desactivada");
            } catch {
                toast.error("Error al cambiar estado");
            }
        });
    };

    const inputClass =
        "w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Bus className="h-5 w-5 text-blue-500" />
                    <h2 className="text-lg font-semibold text-foreground">Rutas de Transporte</h2>
                </div>
                <button
                    type="button"
                    onClick={openCreate}
                    className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                    <Plus className="h-4 w-4" /> Nueva Ruta
                </button>
            </div>

            {/* Form */}
            {showForm && (
                <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
                    <h3 className="font-medium text-foreground">
                        {editId ? "Editar Ruta" : "Nueva Ruta de Transporte"}
                    </h3>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <label className="mb-1.5 block text-sm font-medium text-foreground">
                                Nombre de la ruta *
                            </label>
                            <input
                                className={inputClass}
                                placeholder='Ej: "Bus desde Plaza de Armas"'
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                            />
                        </div>

                        <div className="sm:col-span-2">
                            <label className="mb-1.5 block text-sm font-medium text-foreground">
                                Punto de salida *
                            </label>
                            <input
                                className={inputClass}
                                placeholder="Dirección exacta del punto de encuentro"
                                value={form.departurePoint}
                                onChange={(e) => setForm({ ...form, departurePoint: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-foreground">
                                Hora de salida *
                            </label>
                            <input
                                type="datetime-local"
                                className={inputClass}
                                value={form.departureTime}
                                onChange={(e) => setForm({ ...form, departureTime: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-foreground">
                                Hora de retorno{" "}
                                <span className="font-normal text-muted-foreground">(opcional)</span>
                            </label>
                            <input
                                type="datetime-local"
                                className={inputClass}
                                value={form.returnTime}
                                onChange={(e) => setForm({ ...form, returnTime: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-foreground">
                                Precio por asiento (S/.) *
                            </label>
                            <input
                                type="number"
                                min={0}
                                step="0.50"
                                className={inputClass}
                                placeholder="0.00"
                                value={form.pricePerSeat}
                                onChange={(e) => setForm({ ...form, pricePerSeat: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-foreground">
                                Total de asientos *
                            </label>
                            <input
                                type="number"
                                min={1}
                                className={inputClass}
                                placeholder="Ej: 40"
                                value={form.totalSeats}
                                onChange={(e) => setForm({ ...form, totalSeats: e.target.value })}
                            />
                        </div>

                        <div className="sm:col-span-2">
                            <label className="mb-1.5 block text-sm font-medium text-foreground">
                                Descripción{" "}
                                <span className="font-normal text-muted-foreground">(opcional)</span>
                            </label>
                            <textarea
                                rows={2}
                                className={`${inputClass} resize-none`}
                                placeholder="Información adicional sobre el transporte..."
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => {
                                setShowForm(false);
                                setEditId(null);
                            }}
                            className="rounded-xl border border-border px-4 py-2 text-sm hover:bg-secondary transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isPending}
                            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                        >
                            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                            {editId ? "Guardar cambios" : "Crear ruta"}
                        </button>
                    </div>
                </div>
            )}

            {/* Routes list */}
            {routes.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-10 text-center">
                    <Bus className="mx-auto h-10 w-10 text-muted-foreground/30" />
                    <p className="mt-3 text-sm text-muted-foreground">
                        No hay rutas de transporte. Agrega la primera.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {routes.map((route) => {
                        const available = route.totalSeats - route.bookedSeats;
                        const occupancy = Math.round((route.bookedSeats / route.totalSeats) * 100);

                        return (
                            <div
                                key={route.id}
                                className={`rounded-2xl border p-5 transition-opacity ${route.isActive ? "border-border bg-card" : "border-border/50 bg-secondary/40 opacity-60"
                                    }`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="font-medium text-foreground">{route.name}</h3>
                                            {!route.isActive && (
                                                <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                                                    Inactiva
                                                </span>
                                            )}
                                        </div>
                                        <p className="mt-0.5 text-sm text-muted-foreground">
                                            📍 {route.departurePoint}
                                        </p>
                                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                            <span>
                                                🕐 Salida:{" "}
                                                {new Date(route.departureTime).toLocaleString("es-PE", {
                                                    dateStyle: "short",
                                                    timeStyle: "short",
                                                })}
                                            </span>
                                            {route.returnTime && (
                                                <span>
                                                    🔁 Retorno:{" "}
                                                    {new Date(route.returnTime).toLocaleString("es-PE", {
                                                        dateStyle: "short",
                                                        timeStyle: "short",
                                                    })}
                                                </span>
                                            )}
                                            <span className="font-medium text-foreground">
                                                S/. {Number(route.pricePerSeat).toFixed(2)} / asiento
                                            </span>
                                        </div>

                                        {/* Occupancy bar */}
                                        <div className="mt-3 flex items-center gap-3">
                                            <div className="h-1.5 flex-1 rounded-full bg-secondary">
                                                <div
                                                    className={`h-1.5 rounded-full transition-all ${occupancy >= 90
                                                            ? "bg-destructive"
                                                            : occupancy >= 70
                                                                ? "bg-amber-500"
                                                                : "bg-green-500"
                                                        }`}
                                                    style={{ width: `${Math.min(occupancy, 100)}%` }}
                                                />
                                            </div>
                                            <span className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                                                <Users className="h-3 w-3" />
                                                {route.bookedSeats}/{route.totalSeats} ({available} libres)
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <button
                                            type="button"
                                            title={route.isActive ? "Desactivar" : "Activar"}
                                            onClick={() => handleToggle(route.id, route.isActive)}
                                            disabled={isPending}
                                            className={`rounded-lg p-2 transition-colors disabled:opacity-50 ${route.isActive
                                                    ? "hover:bg-green-500/10 text-green-600"
                                                    : "hover:bg-secondary text-muted-foreground"
                                                }`}
                                        >
                                            {route.isActive ? (
                                                <Check className="h-4 w-4" />
                                            ) : (
                                                <X className="h-4 w-4" />
                                            )}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => openEdit(route)}
                                            className="rounded-lg p-2 hover:bg-secondary text-muted-foreground transition-colors"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(route.id)}
                                            disabled={isPending && deletingId === route.id}
                                            className="rounded-lg p-2 hover:bg-destructive/10 text-destructive transition-colors disabled:opacity-50"
                                        >
                                            {isPending && deletingId === route.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
