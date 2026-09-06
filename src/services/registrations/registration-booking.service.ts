import { db } from "@/lib/db";
import {
  registrations,
  events,
  tickets,
  payments,
  transportBookings,
  registrationGuests,
} from "@/lib/db/schema";
import { eq, and, inArray, count } from "drizzle-orm";
import { generateTicketForRegistration } from "@/lib/tickets";
import { runBackground } from "@/lib/background";
import { assertCanRegisterAttendee } from "@/lib/billing/enforce";
import { RegistrationErrorCode, registrationError } from "@/lib/errors/registration";
import { occupyingCapacityCondition } from "@/lib/registrations/capacity";
import {
  computeInitialHoldExpiresAt,
  isPastSalesCutoff,
} from "@/lib/registrations/payment-hold";
import { releaseRegistrationResources } from "@/lib/registrations/cleanup";
import { createTransportBookingInTx } from "@/lib/transport/booking";
import { NotificationService, type NotificationPayload } from "@/lib/notifications/notification.service";
import type { RegisterEventInput } from "./registration-types";
import { sendRegistrationNotifications } from "./registration-notifications";

export class RegistrationBookingService {
  /**
   * Registra a un usuario en un evento.
   * Garantiza la consistencia ACID de todas las operaciones utilizando una transacción SQL única.
   */
  static async registerForEvent(userId: string, userEmail: string, userName: string, input: RegisterEventInput) {
    return db.transaction(async (tx) => {
      const eventId = input.eventId;
      const contactPhone = input.contactPhone ? input.contactPhone.trim() : null;

      const [event] = await tx
        .select()
        .from(events)
        .where(and(eq(events.id, eventId), eq(events.status, "published")))
        .for("update")
        .limit(1);

      if (!event) throw registrationError(RegistrationErrorCode.UNAVAILABLE);
      await assertCanRegisterAttendee(event.organizerId, eventId, "organizer");

      const { getOrganizerPlanForEvent, getEffectiveEventCapacity } = await import("@/lib/billing/enforce");
      const plan = await getOrganizerPlanForEvent(eventId);
      const effectiveCapacity = getEffectiveEventCapacity(event.capacity, plan);

      if (new Date(event.date).getTime() <= Date.now()) {
        throw registrationError(RegistrationErrorCode.CLOSED_EVENT_EXPIRED);
      }
      if (isPastSalesCutoff(event)) {
        throw registrationError(RegistrationErrorCode.SALES_CUTOFF);
      }

      const attendee = { id: userId, name: userName, email: userEmail, phone: contactPhone };

      const [existing] = await tx
        .select()
        .from(registrations)
        .where(and(eq(registrations.eventId, eventId), eq(registrations.userId, attendee.id)))
        .limit(1);

      if (existing) {
        if (existing.status === "waitlisted") {
          throw registrationError(RegistrationErrorCode.ALREADY_REGISTERED);
        }
        const holdExpired =
          existing.status === "registered" &&
          existing.holdExpiresAt != null &&
          existing.holdExpiresAt.getTime() <= Date.now();
        if (holdExpired) {
          await releaseRegistrationResources(tx, existing);
          await tx
            .update(registrations)
            .set({ status: "cancelled", holdExpiresAt: null, holdReminderSentAt: null })
            .where(eq(registrations.id, existing.id));
          existing.status = "cancelled";
        } else if (existing.status !== "cancelled") {
          throw registrationError(RegistrationErrorCode.ALREADY_REGISTERED);
        }
      }

      const guests = input.guests || [];
      const totalNewRegistrations = 1 + guests.length;

      let status: "registered" | "waitlisted" = "registered";
      if (effectiveCapacity) {
        const [{ count: currentCount }] = await tx
          .select({ count: count() })
          .from(registrations)
          .where(occupyingCapacityCondition(eventId));

        if (currentCount + totalNewRegistrations > effectiveCapacity) {
          if (guests.length > 0 || input.routeId) {
            throw registrationError(RegistrationErrorCode.WAITLIST_NO_EXTRAS);
          }
          status = "waitlisted";
        }
      }

      if (status === "waitlisted" && (guests.length > 0 || input.routeId)) {
        throw registrationError(RegistrationErrorCode.WAITLIST_NO_EXTRAS);
      }

      const availableSlots = Array.isArray(event.schedules) ? event.schedules : [];
      let selectedSlot: { id: string; label?: string | null; date: string; endDate?: string | null } | null = null;
      if (availableSlots.length > 0) {
        selectedSlot = input.scheduleId ? (availableSlots.find((s) => s.id === input.scheduleId) ?? null) : null;
        if (!selectedSlot) selectedSlot = availableSlots[0] ?? null;
      }
      const selectedScheduleId = selectedSlot?.id ?? null;
      const selectedScheduleLabel = selectedSlot?.label ?? null;

      const finalNotes = input.notes ?? null;
      const guestRegIds: string[] = [];
      const guestUserIdMap = new Map<string, string>();
      const now = new Date();
      const wantsCert = Boolean(event.hasCertificate && input.wantsCertificate);
      const certificatePrice = wantsCert && event.certificatePrice ? Number(event.certificatePrice) : 0;
      const certCode = wantsCert
        ? `ENQ-${now.getFullYear()}-CERT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
        : null;

      let registration;
      if (existing?.status === "cancelled") {
        const [reactivated] = await tx
          .update(registrations)
          .set({
            status,
            contactPhone,
            notes: finalNotes,
            registeredAt: now,
            checkedInAt: null,
            holdExpiresAt: null,
            holdReminderSentAt: null,
            parentRegistrationId: null,
            guestId: null,
            selectedScheduleId,
            selectedScheduleLabel,
            wantsCertificate: wantsCert,
            certificateCode: certCode,
            certificateIssuedAt: null,
          })
          .where(eq(registrations.id, existing.id))
          .returning();
        registration = reactivated;
      } else {
        const [created] = await tx
          .insert(registrations)
          .values({
            eventId,
            userId: attendee.id,
            status,
            contactPhone,
            notes: finalNotes,
            registeredAt: now,
            holdExpiresAt: null,
            holdReminderSentAt: null,
            selectedScheduleId,
            selectedScheduleLabel,
            wantsCertificate: wantsCert,
            certificateCode: certCode,
            certificateIssuedAt: null,
          })
          .returning();
        registration = created;
      }

      if (status === "registered") {
        for (const guest of guests) {
          const [guestProfile] = await tx
            .insert(registrationGuests)
            .values({ parentRegistrationId: registration.id, name: guest.name.trim(), phone: guest.phone ?? null })
            .returning();

          const [guestReg] = await tx
            .insert(registrations)
            .values({
              eventId,
              userId: null,
              guestId: guestProfile.id,
              status,
              contactPhone: guest.phone ?? null,
              registeredAt: now,
              holdExpiresAt: null,
              holdReminderSentAt: null,
              parentRegistrationId: registration.id,
              selectedScheduleId,
              selectedScheduleLabel,
            })
            .returning();

          guestRegIds.push(guestReg.id);
          guestUserIdMap.set(guestReg.id, `guest:${guestProfile.id}`);
        }
      }

      if (status === "waitlisted") {
        const waitlistPayload: NotificationPayload = {
          userId: attendee.id,
          type: "registration_confirmed",
          title: "En lista de espera",
          message: `Te añadimos a la lista de espera de "${event.title}". Te avisaremos si se libera un cupo.`,
          metadata: { eventId, eventTitle: event.title, registrationId: registration.id },
        };
        await NotificationService.create(waitlistPayload, tx);
        runBackground(async () => {
          await NotificationService.deliver([waitlistPayload]);
        });
        return {
          success: true,
          status,
          registration,
          ticketCode: null,
          requiresPayment: false,
          registrationId: registration.id,
          eventSlug: event.slug,
        };
      }

      const eventPrice = event.price ? Number(event.price) : 0;
      let transportPrice = 0;
      let transportBooking = null;
      let transportCapacityContext: {
        routeId: string;
        routeName: string;
        bookedSeats: number;
        totalSeats: number;
        newSeats: number;
      } | null = null;

      if (input.routeId) {
        const seats = input.seats || 1;
        const draft = await createTransportBookingInTx(tx, {
          routeId: input.routeId,
          registrationId: registration.id,
          userId: attendee.id,
          seats,
          stopId: input.stopId,
          notes: finalNotes,
          status: "pending",
          skipDuplicateCheck: true,
          useRegistrationErrors: true,
        });

        transportBooking = draft.booking;
        transportPrice = draft.transportPrice;
        transportCapacityContext = {
          routeId: draft.route.id,
          routeName: draft.route.name,
          bookedSeats: draft.bookedSeats,
          totalSeats: draft.route.totalSeats,
          newSeats: seats,
        };

        const bookingStatus = eventPrice + transportPrice > 0 ? "pending" : "confirmed";
        if (bookingStatus === "confirmed") {
          const [confirmedBooking] = await tx
            .update(transportBookings)
            .set({ status: "confirmed", updatedAt: new Date() })
            .where(eq(transportBookings.id, draft.booking.id))
            .returning();
          transportBooking = confirmedBooking;
        }
      }

      const totalTicketPrice = eventPrice * (1 + guests.length);
      const totalAmount = totalTicketPrice + transportPrice + certificatePrice;
      const isPaid = totalAmount > 0;
      let requiresPayment = false;
      let holdExpiresAt: Date | null = null;
      let holdMinutes: number | null = null;

      if (isPaid) {
        requiresPayment = true;
        const hold = computeInitialHoldExpiresAt(event, now);
        holdExpiresAt = hold.expiresAt;
        holdMinutes = hold.minutes;

        const holdRegIds = [registration.id, ...guestRegIds];
        await tx
          .update(registrations)
          .set({ holdExpiresAt, holdReminderSentAt: null })
          .where(inArray(registrations.id, holdRegIds));

        registration = { ...registration, holdExpiresAt, holdReminderSentAt: null };

        const certNote = wantsCert
          ? ` + Certificado Digital${certificatePrice > 0 ? ` (S/ ${certificatePrice.toFixed(2)})` : " (Incluido)"}`
          : "";

        await tx.insert(payments).values({
          registrationId: registration.id,
          userId: attendee.id,
          amount: totalAmount.toFixed(2),
          transportBookingId: transportBooking?.id ?? null,
          currency: "PEN",
          status: "pending",
          notes: transportBooking
            ? `Inscripción consolidada con servicio de transporte (${input.seats} asiento${input.seats && input.seats > 1 ? "s" : ""}) para el titular y ${guests.length} invitado(s)${selectedScheduleLabel ? ` - Turno: ${selectedScheduleLabel}` : ""}${certNote}`
            : `Inscripción al evento para el titular y ${guests.length} invitado(s)${selectedScheduleLabel ? ` - Turno: ${selectedScheduleLabel}` : ""}${certNote}`,
        });
      } else {
        await generateTicketForRegistration(registration.id, eventId, attendee.id, tx);
        for (const guestRegId of guestRegIds) {
          const guestUserId = guestUserIdMap.get(guestRegId)!;
          await generateTicketForRegistration(guestRegId, eventId, guestUserId, tx);
        }
      }

      const [issuedTicket] = await tx
        .select({ code: tickets.code })
        .from(tickets)
        .where(eq(tickets.registrationId, registration.id))
        .limit(1);

      await sendRegistrationNotifications({
        tx,
        eventId,
        eventTitle: event.title,
        organizerId: event.organizerId,
        organizationId: event.organizationId,
        attendee,
        registrationId: registration.id,
        requiresPayment,
        holdExpiresAt,
        holdMinutes,
        status,
        transportCapacityContext,
      });

      return {
        success: true,
        status,
        registration,
        ticketCode: issuedTicket?.code ?? null,
        requiresPayment,
        registrationId: registration.id,
        eventSlug: event.slug,
        holdExpiresAt: holdExpiresAt?.toISOString() ?? null,
        holdMinutes,
      };
    });
  }
}
