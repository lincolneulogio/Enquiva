// Shared constants safe for both client and server
export const PUSHER_CHANNELS = {
    event: (eventId: string) => `private-event-${eventId}`,
    /**
     * Canal público de cupos. Pusher no autentica canales sin `private-`/`presence-`.
     * El payload debe ser solo números (sin PII). Datos sensibles van por `private-event-*`.
     */
    publicEventCount: (eventId: string) => `event-count-${eventId}`,
    publicEventsCatalog: "events-catalog",
    userNotifications: (userId: string) => `private-user-${userId}`,
    presence: (eventId: string) => `presence-event-${eventId}`,
    platformDashboard: "private-admin-dashboard",
    organizationDashboard: (organizationId: string) =>
        `private-org-${organizationId}-dashboard`,
    organizerDashboard: (userId: string) => `private-organizer-${userId}-dashboard`,
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

/** Cupos públicos: ocupados + waitlist. Nunca incluir nombres ni emails. */
export type AttendeeCountUpdatedPayload = {
    eventId: string;
    count: number;
    waitlisted: number;
};

export type NewRegistrationSource = "self_register" | "offline" | "waitlist_promoted";

export type NewRegistrationPayload = {
    eventId: string;
    count: number;
    waitlisted: number;
    status: "registered" | "waitlisted";
    source: NewRegistrationSource;
};

export type CheckInPayload = {
    registrationId: string;
    userId: string;
    checkedInAt: string;
};

export type PaymentUpdatedPayload = {
    eventId: string;
    paymentId: string;
    status: string;
};

export type EventUpdatedPayload = {
    eventId: string;
    title: string;
    status: string;
};

export type PresenceUserInfo = {
    name: string;
    image: string | null;
    role: string;
};

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
