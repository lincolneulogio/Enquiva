export function routeMatchesRegistration(
  routeEventId: string,
  registration: { eventId: string; userId: string } | null | undefined,
  userId: string,
) {
  return Boolean(
    routeEventId &&
      userId &&
      registration?.eventId &&
      registration.userId &&
      registration.eventId === routeEventId &&
      registration.userId === userId,
  );
}
