"use client";

import { useState, useEffect, useRef } from "react";
import { getPaymentMethodsForEventForm, getEventPaymentMethods } from "@/actions/payment-methods";
import { getRoutesByEvent } from "@/actions/transport";
import { loadFormDraft, saveFormDraft } from "@/lib/form-persistence";
import type { Event } from "@/lib/db/schema";
import type { EventFormDraft } from "../types";

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
    if (event?.id) {
      (async () => {
        const methods = await getEventPaymentMethods(event.id);
        const methodIds = (methods || [])
          .map((m: any) => m?.id || m?.paymentMethodId)
          .filter((id): id is string => typeof id === "string" && id.trim().length > 0);
        setSelectedPaymentMethodIds(methodIds);
      })();
    }
  }, [event?.id]);

  useEffect(() => {
    if (!event?.id && !extraHydratedRef.current) {
      const saved = loadFormDraft<EventFormDraft>(extraDraftKey);
      if (saved) {
        if (typeof saved.coverImage !== "undefined") setCoverImage(saved.coverImage);
        if (Array.isArray(saved.selectedPaymentMethodIds)) {
          setSelectedPaymentMethodIds(
            saved.selectedPaymentMethodIds.filter(
              (id): id is string => typeof id === "string" && id.trim().length > 0,
            ),
          );
        }
      }
      extraHydratedRef.current = true;
    }
  }, [event?.id, extraDraftKey, setCoverImage]);

  useEffect(() => {
    if (!event?.id && extraHydratedRef.current) {
      saveFormDraft(extraDraftKey, {
        coverImage,
        selectedPaymentMethodIds,
      });
    }
  }, [event?.id, extraDraftKey, coverImage, selectedPaymentMethodIds]);

  const loadRoutes = async () => {
    if (!event?.id) return;
    setLoadingRoutes(true);
    try {
      const data = await getRoutesByEvent(event.id);
      setRoutes(data);
    } catch {
      // ignore
    } finally {
      setLoadingRoutes(false);
    }
  };

  useEffect(() => {
    if (hasTransport && event?.id) {
      loadRoutes();
    }
  }, [hasTransport, event?.id]);

  const togglePaymentMethod = (id: string) => {
    setSelectedPaymentMethodIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const selectAllPaymentMethods = () => {
    setSelectedPaymentMethodIds(selectablePaymentMethods.map((m) => m.id));
  };

  const clearAllPaymentMethods = () => {
    setSelectedPaymentMethodIds([]);
  };

  return {
    allPaymentMethods,
    selectablePaymentMethods,
    selectedPaymentMethodIds,
    setSelectedPaymentMethodIds,
    togglePaymentMethod,
    selectAllPaymentMethods,
    clearAllPaymentMethods,
    routes,
    loadingRoutes,
    loadRoutes,
  };
}
