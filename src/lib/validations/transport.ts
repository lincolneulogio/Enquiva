import { z } from "zod";

export const createTransportRouteSchema = z.object({
  eventId: z.string().uuid(),
  name: z.string().min(3),
  departurePoint: z.string().min(3),
  departureTime: z.string().min(1),
  returnTime: z.string().optional().nullable(),
  pricePerSeat: z.number().nonnegative(),
  totalSeats: z.number().int().positive(),
  description: z.string().optional().nullable(),
  driverName: z.string().max(120).optional().nullable(),
  vehiclePlate: z.string().max(20).optional().nullable(),
  isRoundTrip: z.boolean().optional(),
  pendingHoldHours: z.number().int().min(1).max(168).optional(),
});

export const updateTransportRouteSchema = createTransportRouteSchema.partial().omit({
  eventId: true,
});

export type CreateTransportRouteInput = z.infer<typeof createTransportRouteSchema>;
export type UpdateTransportRouteInput = z.infer<typeof updateTransportRouteSchema>;
