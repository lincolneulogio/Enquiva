"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { TransportService } from "@/services/transport/transport.service";
import { bookTransportSchema } from "@/services/booking/booking.service";
import { assertEventInAdminScope } from "@/lib/organizations/admin-scope";
import { requireAuth, requireOrganizerOrHigher } from "@/lib/auth/guards";
import { authorize } from "@/lib/auth/authorize";
import { loadTransportBookingAuthResource } from "@/lib/auth/load-resource";
import { assertAnyPermission } from "@/lib/auth/permission-guards";

export async function getMyTransportBookings() {
  const user = await requireAuth();
  await authorize({ user, permission: "transport:book:own" });
  return TransportService.getMyTransportBookings(user.id);
}

export async function getMemberTransportOptions() {
  const user = await requireAuth();
  await authorize({ user, permission: "transport:book:own" });
  return TransportService.getMemberTransportOptions(user.id);
}

export async function bookTransport(input: z.infer<typeof bookTransportSchema>) {
  const user = await requireAuth();
  await authorize({
    user,
    permission: "transport:book:own",
    resource: { type: "transport", ownerUserId: user.id },
  });
  const { booking, payment } = await TransportService.bookTransport(input, user.id, user.name ?? "Un participante");

  revalidatePath("/member/transport");
  revalidatePath("/member/payments");
  return { success: true, booking, payment };
}

export async function cancelTransportBooking(bookingId: string, password?: string) {
  const user = await requireAuth();
  await authorize({
    user,
    permission: "transport:book:own",
    resource: await loadTransportBookingAuthResource(bookingId),
  });
  await TransportService.cancelTransportBooking(bookingId, user.id, password);

  revalidatePath("/member/transport");
  return { success: true };
}

export async function getTransportBookingsForEvent(eventId: string) {
  const user = await requireOrganizerOrHigher();
  await assertAnyPermission(user, ["transport:manage:org", "transport:manage:own", "payments:view:org", "payments:view:own"]);
  await assertEventInAdminScope(eventId, user.id, user.role);
  return TransportService.getTransportBookingsForEvent(eventId);
}

export async function approveTransportPayment(paymentId: string) {
  const user = await requireOrganizerOrHigher();
  await assertAnyPermission(user, ["payments:update:org", "payments:update:own"]);
  await TransportService.approveTransportPayment(paymentId, user.id, user.role ?? "member");

  revalidatePath("/admin/payments");
  revalidatePath("/organizer/payments");
  revalidatePath("/organizer/transport");
  return { success: true };
}

export async function rejectTransportPayment(paymentId: string, reason?: string) {
  const user = await requireOrganizerOrHigher();
  await assertAnyPermission(user, ["payments:update:org", "payments:update:own"]);
  await TransportService.rejectTransportPayment(paymentId, user.id, user.role ?? "member", reason);

  revalidatePath("/admin/payments");
  revalidatePath("/organizer/payments");
  revalidatePath("/organizer/transport");
  return { success: true };
}
