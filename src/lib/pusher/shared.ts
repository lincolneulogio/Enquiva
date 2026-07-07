// Shared constants safe for both client and server
export const PUSHER_CHANNELS = {
    event: (eventId: string) => `event-${eventId}`,
    userNotifications: (userId: string) => `private-user-${userId}`,
    presence: (eventId: string) => `presence-event-${eventId}`,
    adminDashboard: "private-admin-dashboard",
} as const;

export const PUSHER_EVENTS = {
    attendeeCountUpdated: "attendee-count-updated",
    newRegistration: "new-registration",
    checkIn: "check-in",
    notificationCreated: "notification-created",
    eventUpdated: "event-updated",
    paymentUpdated: "payment-updated",
    tableRefresh: "table-refresh",
} as const;

export type TableResource =
    | "registrations"
    | "attendees"
    | "events"
    | "payments"
    | "users"
    | "team"
    | "transport"
    | "broadcasts"
    | "categories"
    | "plans"
    | "dashboard";

export type TableRefreshPayload = {
    resource: TableResource | TableResource[];
    eventId?: string;
    organizationId?: string;
    userId?: string;
};
