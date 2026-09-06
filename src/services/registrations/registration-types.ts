export interface RegisterEventInput {
  eventId: string;
  contactPhone?: string | null;
  routeId?: string | null;
  seats?: number | null;
  stopId?: string | null;
  notes?: string | null;
  guests?: Array<{ name: string; phone?: string | null }> | null;
  scheduleId?: string | null;
  wantsCertificate?: boolean;
}

export interface CheckInInput {
  registrationId: string;
  eventId: string;
}
