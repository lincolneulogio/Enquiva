"use client";

import { useState, useEffect, useRef } from "react";
import { getPaymentMethodsForEventForm, getEventPaymentMethods } from "@/actions/payment-methods";
import { getRoutesByEvent } from "@/actions/transport";
import { loadFormDraft, saveFormDraft } from "@/lib/form-persistence";
import type { Event } from "@/lib/db/schema";
import type { EventFormDraft } from "./types";

type TransportRouteList = Awaited<ReturnType<typeof getRoutesByEvent>>;

interface UseEventPaymentAndRoutesProps {
  event?: Event;
  hasTransport?: boolean;
  requiresPaymentMethods: boolean;
  canUseCulqi?: boolean;
  extraDraftKey: string;
  setCoverImage: (url: string | null) => void;
  coverImage: string | null;
}

export function useEventPaymentAndRoutes({
  event,
  hasTransport,
  requiresPaymentMethods,
  canUseCulqi,
  extraDraftKey,
  setCoverImage,
  coverImage,
}: UseEventPaymentAndRoutesProps) {
  const [allPaymentMethods, setAllPaymentMethods] = useState<
    Array<{ id: string; type: string; label: string; holderName: string }>
  >([]);
  const [selectedPaymentMethodIds, setSelectedPaymentMethodIds] = useState<string[]>([]);
  const [routes, setRoutes] = useState<TransportRouteList>([]);
  const [loadingRoutes, setLoadingRoutes] = useState(false);
  const extraHydratedRef = useRef(false);

  const selectablePaymentMethods = allPaymentMethods.filter(
    (pm) => pm.type !== "culqi" || canUseCulqi,
  );

  useEffect(() => {
    (async () => {
      const methods = await getPaymentMethodsForEventForm(event?.organizerId);
      setAllPaymentMethods(methods);
    })();
  }, [event?.organizerId]);

  useEffect(() => {
    if (
      requiresPaymentMethods &&
      selectedPaymentMethodIds.length === 0 &&
      selectablePaymentMethods.length > 0
    ) {
      setSelectedPaymentMethodIds(selectablePaymentMethods.map((m) => m.id));
    }
  }, [requiresPaymentMethods, selectedPaymentMethodIds.length, selectablePaymentMethods]);

  useEffect(() => {
    if (!event?.id) return;
    (async () => {
      const selected = await getEventPaymentMethods(event.id);
      setSelectedPaymentMethodIds(selected.map((m) => m.id));
    })();
  }, [event?.id]);

  useEffect(() => {
    if (!event?.id || !hasTransport) return;

    let active = true;
    (async () => {
      setLoadingRoutes(true);
      try {
        const fetched = await getRoutesByEvent(event.id);
        if (active) {
          setRoutes(
            fetched.map((r) => ({
              ...r,
              departureTime: new Date(r.departureTime),
              returnTime: r.returnTime ? new Date(r.returnTime) : null,
              bookedSeats: Number(r.bookedSeats),
            })),
          );
        }
      } catch (err) {
        console.error("Failed to load routes", err);
      } finally {
        if (active) setLoadingRoutes(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [event?.id, hasTransport]);

  useEffect(() => {
    if (event || extraHydratedRef.current) return;
    extraHydratedRef.current = true;

    const saved = loadFormDraft<EventFormDraft>(extraDraftKey);
    if (!saved) return;

    if (saved.coverImage) setCoverImage(saved.coverImage);
    if (saved.selectedPaymentMethodIds?.length) {
      setSelectedPaymentMethodIds(saved.selectedPaymentMethodIds);
    }
  }, [event, extraDraftKey, setCoverImage]);

  useEffect(() => {
    if (event) return;

    const timer = setTimeout(() => {
      saveFormDraft(extraDraftKey, { coverImage, selectedPaymentMethodIds });
    }, 300);
    return () => clearTimeout(timer);
  }, [event, extraDraftKey, coverImage, selectedPaymentMethodIds]);

  return {
    selectablePaymentMethods,
    selectedPaymentMethodIds,
    setSelectedPaymentMethodIds,
    routes,
    loadingRoutes,
  };
}
