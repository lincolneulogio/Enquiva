/** Estados que ocupan cupo del evento. */
export const OCCUPYING_REGISTRATION_STATUSES = ["registered", "checked_in"] as const;

export type OccupyingRegistrationStatus = (typeof OCCUPYING_REGISTRATION_STATUSES)[number];

export function isOccupyingRegistrationStatus(status: string): status is OccupyingRegistrationStatus {
  return (OCCUPYING_REGISTRATION_STATUSES as readonly string[]).includes(status);
}
