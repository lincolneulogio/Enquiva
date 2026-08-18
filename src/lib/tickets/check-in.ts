import { db, type DBClient } from "@/lib/db";
import {
  tickets,
  registrations,
  events,
  payments,
  scanLogs,
  type Registration,
  type Ticket,
  type Event,
} from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { RegistrationErrorCode, registrationError } from "@/lib/errors/registration";
import { verifyTicketSignature } from "@/lib/tickets/signature";
import { runBackground } from "@/lib/background";
import { broadcastCheckIn } from "@/lib/pusher/broadcast";
import { broadcastTableRefresh } from "@/lib/pusher/table-refresh";

export type CheckInByRegistrationInput = {
  registrationId: string;
  eventId: string;
};

export type CheckInByTicketCodeInput = {
  code: string;
  signature: string;
};

export type CheckInContext = {
  scannedByUserId: string;
  scanLog?: {
    ipAddress?: string;
    userAgent?: string;
  };
};

export type CheckInSuccess = {
  success: true;
  registration: Registration;
  ticket: Ticket;
  event: Event;
};

export type CheckInFailure = {
  success: false;
  error: string;
  code?: string;
  httpStatus: number;
  ticketStatus?: string;
};

async function assertCheckInEligible(
  tx: DBClient,
  registration: Registration,
  event: Pick<Event, "id" | "price">,
  ticket: Pick<Ticket, "id" | "status"> | null | undefined,
) {
  if (registration.status !== "registered") {
    if (registration.status === "checked_in") {
      throw registrationError(RegistrationErrorCode.CHECKIN_NOT_FOUND);
    }
    throw registrationError(RegistrationErrorCode.CHECKIN_NOT_FOUND);
  }

  if (!ticket || ticket.status !== "active") {
    if (ticket?.status === "used") {
      throw registrationError(RegistrationErrorCode.CHECKIN_ALREADY_USED);
    }
    throw registrationError(RegistrationErrorCode.CHECKIN_NO_ACTIVE_TICKET);
  }

  const eventPrice = event.price ? Number(event.price) : 0;
  if (eventPrice > 0) {
    const [payment] = await tx
      .select({ status: payments.status })
      .from(payments)
      .where(eq(payments.registrationId, registration.id))
      .limit(1);

    if (payment && payment.status !== "approved") {
      throw registrationError(RegistrationErrorCode.CHECKIN_PAYMENT_REQUIRED);
    }
  }
}

async function performCheckIn(
  tx: DBClient,
  registration: Registration,
  ticket: Ticket,
  eventId: string,
) {
  const now = new Date();

  const [checkedIn] = await tx
    .update(registrations)
    .set({ status: "checked_in", checkedInAt: now })
    .where(eq(registrations.id, registration.id))
    .returning();

  const [updatedTicket] = await tx
    .update(tickets)
    .set({ status: "used", checkedInAt: now })
    .where(eq(tickets.id, ticket.id))
    .returning();

  runBackground(async () => {
    try {
      await broadcastCheckIn(
        {
          registrationId: registration.id,
          userId: registration.userId,
          checkedInAt: now.toISOString(),
        },
        { eventId, userId: registration.userId },
      );
      await broadcastTableRefresh({
        resource: ["registrations", "attendees"],
        eventId,
        userId: registration.userId,
      });
    } catch (error) {
      console.error("Fallo al emitir evento Pusher para check-in", error);
    }
  });

  return { registration: checkedIn, ticket: updatedTicket };
}

function mapRegistrationErrorToApi(error: unknown): CheckInFailure {
  if (error instanceof Error) {
    const message = error.message;
    if (message === RegistrationErrorCode.CHECKIN_PAYMENT_REQUIRED) {
      return {
        success: false,
        error: "Payment not approved",
        code: message,
        httpStatus: 402,
      };
    }
    if (message === RegistrationErrorCode.CHECKIN_NO_ACTIVE_TICKET) {
      return {
        success: false,
        error: "No active ticket",
        code: message,
        httpStatus: 402,
      };
    }
    if (message === RegistrationErrorCode.CHECKIN_ALREADY_USED) {
      return {
        success: false,
        error: "Ticket already used",
        code: message,
        httpStatus: 409,
        ticketStatus: "used",
      };
    }
    if (message === RegistrationErrorCode.CHECKIN_NOT_FOUND) {
      return {
        success: false,
        error: "Registration not found or already checked in",
        code: message,
        httpStatus: 404,
      };
    }
  }

  return {
    success: false,
    error: error instanceof Error ? error.message : "Check-in failed",
    httpStatus: 400,
  };
}

export class TicketCheckInService {
  /** Check-in manual (express / tabla de asistentes). */
  static async checkInByRegistration(input: CheckInByRegistrationInput, _ctx: CheckInContext) {
    return db.transaction(async (tx) => {
      const [reg] = await tx
        .select()
        .from(registrations)
        .where(
          and(
            eq(registrations.id, input.registrationId),
            eq(registrations.eventId, input.eventId),
          ),
        )
        .limit(1);

      if (!reg) throw registrationError(RegistrationErrorCode.CHECKIN_NOT_FOUND);

      const [event] = await tx.select().from(events).where(eq(events.id, input.eventId)).limit(1);
      if (!event) throw registrationError(RegistrationErrorCode.CHECKIN_NOT_FOUND);

      const [ticket] = await tx
        .select()
        .from(tickets)
        .where(eq(tickets.registrationId, input.registrationId))
        .limit(1);

      await assertCheckInEligible(tx, reg, event, ticket);

      const result = await performCheckIn(tx, reg, ticket!, event.id);
      return { success: true as const, ...result, event };
    });
  }

  /** Check-in por escáner QR. Mismas reglas de elegibilidad que el flujo manual. */
  static async checkInByTicketCode(
    input: CheckInByTicketCodeInput,
    ctx: CheckInContext,
  ): Promise<CheckInSuccess | CheckInFailure> {
    const code = input.code.trim();
    const signature = input.signature.trim();

    if (!code) {
      return { success: false, error: "Missing code", httpStatus: 400 };
    }
    if (!signature) {
      return { success: false, error: "Missing signature", httpStatus: 400 };
    }

    try {
      return await db.transaction(async (tx) => {
        const [ticket] = await tx.select().from(tickets).where(eq(tickets.code, code)).limit(1);
        if (!ticket) {
          return { success: false, error: "Ticket not found", httpStatus: 404 };
        }

        if (!verifyTicketSignature(ticket, signature)) {
          await tx.insert(scanLogs).values({
            ticketId: ticket.id,
            scannedBy: ctx.scannedByUserId,
            ipAddress: ctx.scanLog?.ipAddress,
            userAgent: ctx.scanLog?.userAgent,
            result: "signature_mismatch",
          });
          return { success: false, error: "Invalid signature", httpStatus: 400 };
        }

        const [registration] = await tx
          .select()
          .from(registrations)
          .where(eq(registrations.id, ticket.registrationId))
          .limit(1);

        if (!registration) {
          return { success: false, error: "Registration not found", httpStatus: 404 };
        }

        const [event] = await tx
          .select()
          .from(events)
          .where(eq(events.id, registration.eventId))
          .limit(1);

        if (!event) {
          return { success: false, error: "Event not found", httpStatus: 404 };
        }

        if (ticket.status !== "active") {
          await tx.insert(scanLogs).values({
            ticketId: ticket.id,
            scannedBy: ctx.scannedByUserId,
            ipAddress: ctx.scanLog?.ipAddress,
            userAgent: ctx.scanLog?.userAgent,
            result: `invalid_status:${ticket.status}`,
          });
          return {
            success: false,
            error: "Ticket not valid",
            httpStatus: 400,
            ticketStatus: ticket.status,
          };
        }

        try {
          await assertCheckInEligible(tx, registration, event, ticket);
        } catch (eligibilityError) {
          const mapped = mapRegistrationErrorToApi(eligibilityError);
          await tx.insert(scanLogs).values({
            ticketId: ticket.id,
            scannedBy: ctx.scannedByUserId,
            ipAddress: ctx.scanLog?.ipAddress,
            userAgent: ctx.scanLog?.userAgent,
            result: mapped.code ?? "checkin_denied",
          });
          return mapped;
        }

        const result = await performCheckIn(tx, registration, ticket, event.id);

        await tx.insert(scanLogs).values({
          ticketId: ticket.id,
          scannedBy: ctx.scannedByUserId,
          ipAddress: ctx.scanLog?.ipAddress,
          userAgent: ctx.scanLog?.userAgent,
          result: "ok",
        });

        return {
          success: true,
          registration: result.registration,
          ticket: result.ticket,
          event,
        };
      });
    } catch (error) {
      console.error("[TicketCheckInService]", error);
      return mapRegistrationErrorToApi(error);
    }
  }
}
