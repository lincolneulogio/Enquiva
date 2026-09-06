"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "@/components/providers/LocaleProvider";
import {
  getStopsByRoute,
  createTransportStop,
  deleteTransportStop,
  updateTransportStop,
} from "@/actions/transport";
import type { StopRow } from "./types";
import { combineDateAndTime, isPastCombined } from "./utils";

export function useStopsManager() {
  const t = useTranslations();
  const [expandedRouteId, setExpandedRouteId] = useState<string | null>(null);
  const [stopsByRoute, setStopsByRoute] = useState<Record<string, StopRow[]>>({});
  const [newStopName, setNewStopName] = useState("");
  const [newStopLat, setNewStopLat] = useState<number | null>(null);
  const [newStopLng, setNewStopLng] = useState<number | null>(null);
  const [newStopEtaDate, setNewStopEtaDate] = useState("");
  const [newStopEtaClock, setNewStopEtaClock] = useState("");
  const [newStopMaxSeats, setNewStopMaxSeats] = useState("");
  const [stopPending, setStopPending] = useState(false);

  const toggleStops = async (routeId: string) => {
    if (expandedRouteId === routeId) {
      setExpandedRouteId(null);
      return;
    }

    setExpandedRouteId(routeId);

    if (!stopsByRoute[routeId]) {
      try {
        const stopsData = await getStopsByRoute(routeId);
        setStopsByRoute((prev) => ({
          ...prev,
          [routeId]: stopsData,
        }));
      } catch {
        toast.error(t("transport.manager.stopLoadError"));
      }
    }
  };

  const handleAddStop = async (routeId: string) => {
    if (!newStopName.trim()) {
      toast.error(t("transport.manager.stopNameRequired"));
      return;
    }
    if (newStopEtaDate || newStopEtaClock) {
      if (!newStopEtaDate || !newStopEtaClock) {
        toast.error(t("transport.manager.stopEtaIncomplete"));
        return;
      }
      if (isPastCombined(newStopEtaDate, newStopEtaClock)) {
        toast.error(t("transport.manager.stopEtaPast"));
        return;
      }
    }

    setStopPending(true);
    try {
      const etaCombined = combineDateAndTime(newStopEtaDate, newStopEtaClock);
      const res = await createTransportStop({
        routeId,
        name: newStopName,
        latitude: newStopLat != null ? String(newStopLat) : null,
        longitude: newStopLng != null ? String(newStopLng) : null,
        estimatedArrivalTime: etaCombined || null,
        maxSeats: newStopMaxSeats ? parseInt(newStopMaxSeats, 10) : null,
      });

      if (res.success && res.stop) {
        setStopsByRoute((prev) => ({
          ...prev,
          [routeId]: [...(prev[routeId] || []), res.stop as StopRow],
        }));
        setNewStopName("");
        setNewStopLat(null);
        setNewStopLng(null);
        setNewStopEtaDate("");
        setNewStopEtaClock("");
        setNewStopMaxSeats("");
        toast.success(t("transport.manager.stopSaveSuccess"));
      }
    } catch {
      toast.error(t("transport.manager.stopSaveError"));
    } finally {
      setStopPending(false);
    }
  };

  const handleDeleteStop = async (routeId: string, stopId: string) => {
    try {
      const res = await deleteTransportStop(stopId);
      if (res.success) {
        setStopsByRoute((prev) => ({
          ...prev,
          [routeId]: (prev[routeId] || []).filter((s) => s.id !== stopId),
        }));
        toast.success(t("transport.manager.stopDeleteSuccess"));
      }
    } catch {
      toast.error(t("transport.manager.stopDeleteError"));
    }
  };

  const handleMoveStop = async (routeId: string, index: number, direction: "up" | "down") => {
    const currentStops = stopsByRoute[routeId] || [];
    const ordered = [...currentStops].sort((a, b) => a.sortOrder - b.sortOrder);
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= ordered.length) return;

    const current = ordered[index];
    const target = ordered[targetIndex];
    if (!current || !target) return;

    await updateTransportStop(current.id, { sortOrder: target.sortOrder });
    await updateTransportStop(target.id, { sortOrder: current.sortOrder });
    const refreshed = await getStopsByRoute(routeId);
    setStopsByRoute((prev) => ({ ...prev, [routeId]: refreshed as StopRow[] }));
  };

  return {
    expandedRouteId,
    stopsByRoute,
    newStopName,
    setNewStopName,
    newStopLat,
    setNewStopLat,
    newStopLng,
    setNewStopLng,
    newStopEtaDate,
    setNewStopEtaDate,
    newStopEtaClock,
    setNewStopEtaClock,
    newStopMaxSeats,
    setNewStopMaxSeats,
    stopPending,
    toggleStops,
    handleAddStop,
    handleDeleteStop,
    handleMoveStop,
  };
}
