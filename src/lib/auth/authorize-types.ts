export type AuthResourceType =
  | "event"
  | "payment"
  | "registration"
  | "ticket"
  | "transport"
  | "user"
  | "organization"
  | "category"
  | "broadcast"
  | "platform"
  | "authorization";

export type AuthResource = {
  type: AuthResourceType;
  id?: string;
  organizationId?: string | null;
  organizerId?: string | null;
  ownerUserId?: string | null;
};
