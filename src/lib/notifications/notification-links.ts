export function getNotificationHref(
  role: string | null | undefined,
  type: string,
  metadata?: Record<string, unknown> | null,
): string | null {
  const eventId = typeof metadata?.eventId === "string" ? metadata.eventId : undefined;
  const normalizedRole = role ?? "member";

  if (normalizedRole === "member") {
    switch (type) {
      case "registration_confirmed":
      case "waitlist_promoted":
      case "event_cancelled":
      case "event_reminder":
      case "event_published":
      case "event_updated":
        return "/member/events";
      case "payment_submitted":
      case "payment_status_updated":
        return "/member/payments";
      case "transport_alert":
        return "/member/transport";
      default:
        return "/member/notifications";
    }
  }

  if (normalizedRole === "organizer") {
    switch (type) {
      case "organizer_approved":
      case "organizer_rejected":
        return "/organizer";
      case "subscription_alert":
        return "/organizer/billing";
      case "payment_submitted":
      case "payment_status_updated":
        return "/organizer/payments";
      case "transport_alert":
        return eventId ? `/organizer/events/${eventId}/transport` : "/organizer/transport";
      case "event_updated":
      case "event_published":
      case "event_cancelled":
      case "event_reminder":
        return eventId ? `/organizer/events/${eventId}` : "/organizer/events";
      default:
        return "/organizer/notifications";
    }
  }

  const staffBase = normalizedRole === "super_admin" ? "/superadmin" : "/admin";

  switch (type) {
    case "organizer_request":
      return `${staffBase}/team`;
    case "organizer_approved":
    case "organizer_rejected":
      return `${staffBase}/users`;
    case "subscription_alert":
      return `${staffBase}/plan`;
    case "payment_submitted":
    case "payment_status_updated":
      return `${staffBase}/payments`;
    case "transport_alert":
      return `${staffBase}/transport`;
    case "event_updated":
    case "event_published":
    case "event_cancelled":
    case "event_reminder":
      return eventId ? `${staffBase}/events/${eventId}` : `${staffBase}/events`;
    default:
      return `${staffBase}/notifications`;
  }
}
