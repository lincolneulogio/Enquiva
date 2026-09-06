export interface EventOption {
  value: string;
  label: string;
}

export interface Attendee {
  registrationId: string;
  eventId: string;
  status: string;
  userName: string | null;
  userEmail: string | null;
  contactPhone: string | null;
  ticketCode: string | null;
  checkedInAt: Date | null;
}
