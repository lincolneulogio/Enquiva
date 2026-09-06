"use client";

import { useState, useEffect, useTransition } from "react";
import { toast } from "sonner";
import { searchPreRegisteredAttendeesAction, checkInAttendee } from "@/actions/registrations";
import { translateRegistrationError } from "@/lib/errors/registration";
import { getPusherClient, PUSHER_CHANNELS, PUSHER_EVENTS } from "@/lib/pusher/client";
import type { CheckInPayload, NewRegistrationPayload } from "@/lib/pusher/shared";
import type { Attendee } from "./types";

export function useExpressCheckIn(
  selectedEventId: string,
  query: string,
  t: (key: string, params?: Record<string, string | number>) => string,
) {
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [searching, setSearching] = useState(false);
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!selectedEventId || query.trim().length === 0) {
      setAttendees([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await searchPreRegisteredAttendeesAction(selectedEventId, query);
        if (res.success) {
          setAttendees(res.attendees ?? []);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [selectedEventId, query]);

  useEffect(() => {
    if (!selectedEventId) return;

    const pusher = getPusherClient();
    const channel = pusher.subscribe(PUSHER_CHANNELS.event(selectedEventId));

    channel.bind(PUSHER_EVENTS.checkIn, (data: CheckInPayload) => {
      setAttendees((prev) =>
        prev.map((attendee) =>
          attendee.registrationId === data.registrationId
            ? { ...attendee, status: "checked_in", checkedInAt: new Date(data.checkedInAt) }
            : attendee,
        ),
      );
    });

    channel.bind(PUSHER_EVENTS.newRegistration, (_data: NewRegistrationPayload) => {
      if (query.trim().length === 0) return;
      void searchPreRegisteredAttendeesAction(selectedEventId, query).then((res) => {
        if (res.success) setAttendees(res.attendees ?? []);
      });
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(PUSHER_CHANNELS.event(selectedEventId));
    };
  }, [query, selectedEventId]);

  const handleCheckIn = (attendee: Attendee) => {
    setCheckingId(attendee.registrationId);
    startTransition(async () => {
      try {
        await checkInAttendee({
          registrationId: attendee.registrationId,
          eventId: attendee.eventId,
        });

        toast.success(`¡Check-in exitoso para ${attendee.userName || "el asistente"}!`);

        setAttendees((prev) =>
          prev.map((a) =>
            a.registrationId === attendee.registrationId
              ? { ...a, status: "checked_in", checkedInAt: new Date() }
              : a,
          ),
        );
      } catch (error) {
        toast.error(
          error instanceof Error
            ? translateRegistrationError(t, error.message)
            : "Error al realizar check-in.",
        );
      } finally {
        setCheckingId(null);
      }
    });
  };

  return {
    attendees,
    searching,
    checkingId,
    isPending,
    handleCheckIn,
  };
}
