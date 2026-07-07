import { getSystemSettings } from "@/lib/settings";
import { NotificationService, type NotificationPayload } from "./notification.service";
import { getEntityStaffUserIds } from "./notification-targets";

const CAPACITY_THRESHOLD = 0.9;

export async function maybeNotifyTransportCapacityAlert(input: {
  routeId: string;
  routeName: string;
  eventId: string;
  eventTitle: string;
  organizerId: string;
  organizationId: string | null;
  bookedSeats: number;
  totalSeats: number;
  newSeats: number;
}) {
  if (input.totalSeats <= 0 || input.newSeats <= 0) return;

  const settings = await getSystemSettings();
  if (!settings.alertTransportCapacity) return;

  const previousOccupancy = (input.bookedSeats - input.newSeats) / input.totalSeats;
  const currentOccupancy = input.bookedSeats / input.totalSeats;

  if (previousOccupancy >= CAPACITY_THRESHOLD || currentOccupancy < CAPACITY_THRESHOLD) return;

  const percent = Math.round(currentOccupancy * 100);
  const title = "Ruta de transporte casi llena";
  const message = `La ruta "${input.routeName}" del evento "${input.eventTitle}" alcanzó el ${percent}% de capacidad (${input.bookedSeats}/${input.totalSeats} asientos).`;

  const recipientIds = await getEntityStaffUserIds({
    organizationId: input.organizationId,
    organizerId: input.organizerId,
  });

  const payloads: NotificationPayload[] = recipientIds.map((userId) => ({
    userId,
    type: "transport_alert",
    title,
    message,
    metadata: {
      eventId: input.eventId,
      routeId: input.routeId,
      routeName: input.routeName,
      occupancyPercent: percent,
    },
  }));

  await NotificationService.createMany(payloads);
}
