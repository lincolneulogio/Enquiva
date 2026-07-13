type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

export const RegistrationErrorCode = {
  UNAVAILABLE: "REGISTRATION_UNAVAILABLE",
  CLOSED_EVENT_EXPIRED: "REGISTRATION_CLOSED_EVENT_EXPIRED",
  CLOSED_EVENT_FULL: "REGISTRATION_CLOSED_EVENT_FULL",
  SALES_CUTOFF: "REGISTRATION_SALES_CUTOFF",
  WAITLIST_NO_EXTRAS: "REGISTRATION_WAITLIST_NO_EXTRAS",
  ALREADY_REGISTERED: "REGISTRATION_ALREADY_REGISTERED",
  CANCELLED: "REGISTRATION_CANCELLED",
  TRANSPORT_ROUTE_UNAVAILABLE: "REGISTRATION_TRANSPORT_ROUTE_UNAVAILABLE",
  TRANSPORT_SEATS_INSUFFICIENT: "REGISTRATION_TRANSPORT_SEATS_INSUFFICIENT",
  PASSWORD_REQUIRED: "REGISTRATION_PASSWORD_REQUIRED",
  PASSWORD_INVALID: "REGISTRATION_PASSWORD_INVALID",
  NOT_FOUND: "REGISTRATION_NOT_FOUND",
  CHECKIN_NOT_FOUND: "REGISTRATION_CHECKIN_NOT_FOUND",
  CHECKIN_PAYMENT_REQUIRED: "REGISTRATION_CHECKIN_PAYMENT_REQUIRED",
  CHECKIN_NO_ACTIVE_TICKET: "REGISTRATION_CHECKIN_NO_ACTIVE_TICKET",
  CHECKIN_ALREADY_USED: "REGISTRATION_CHECKIN_ALREADY_USED",
  EVENT_NOT_PUBLISHED: "REGISTRATION_EVENT_NOT_PUBLISHED",
} as const;

export type RegistrationErrorCodeValue =
  (typeof RegistrationErrorCode)[keyof typeof RegistrationErrorCode];

export function registrationError(
  code: RegistrationErrorCodeValue,
  params?: Record<string, string | number>,
): Error {
  if (!params || Object.keys(params).length === 0) {
    return new Error(code);
  }
  return new Error(`${code}|${JSON.stringify(params)}`);
}

export function parseRegistrationErrorMessage(message: string): {
  code: string;
  params?: Record<string, string | number>;
} {
  const [code, paramsJson] = message.split("|");
  if (!paramsJson) return { code };
  try {
    const params = JSON.parse(paramsJson) as Record<string, string | number>;
    return { code, params };
  } catch {
    return { code: message };
  }
}

const ERROR_I18N_KEYS: Record<string, string> = {
  [RegistrationErrorCode.UNAVAILABLE]: "register.errors.unavailable",
  [RegistrationErrorCode.CLOSED_EVENT_EXPIRED]: "register.errors.eventExpired",
  [RegistrationErrorCode.CLOSED_EVENT_FULL]: "register.errors.eventFull",
  [RegistrationErrorCode.SALES_CUTOFF]: "register.errors.salesCutoff",
  [RegistrationErrorCode.WAITLIST_NO_EXTRAS]: "register.errors.waitlistNoExtras",
  [RegistrationErrorCode.ALREADY_REGISTERED]: "register.errors.alreadyRegistered",
  [RegistrationErrorCode.CANCELLED]: "register.errors.cancelled",
  [RegistrationErrorCode.TRANSPORT_ROUTE_UNAVAILABLE]: "register.errors.transportRouteUnavailable",
  [RegistrationErrorCode.TRANSPORT_SEATS_INSUFFICIENT]: "register.errors.transportSeatsInsufficient",
  [RegistrationErrorCode.PASSWORD_REQUIRED]: "register.errors.passwordRequired",
  [RegistrationErrorCode.PASSWORD_INVALID]: "register.errors.passwordInvalid",
  [RegistrationErrorCode.NOT_FOUND]: "register.errors.notFound",
  [RegistrationErrorCode.CHECKIN_NOT_FOUND]: "register.errors.checkinNotFound",
  [RegistrationErrorCode.CHECKIN_PAYMENT_REQUIRED]: "register.errors.checkinPaymentRequired",
  [RegistrationErrorCode.CHECKIN_NO_ACTIVE_TICKET]: "register.errors.checkinNoActiveTicket",
  [RegistrationErrorCode.CHECKIN_ALREADY_USED]: "register.errors.checkinAlreadyUsed",
  [RegistrationErrorCode.EVENT_NOT_PUBLISHED]: "register.errors.eventNotPublished",
};

export function translateRegistrationError(t: TranslateFn, message: string): string {
  const { code, params } = parseRegistrationErrorMessage(message);
  const key = ERROR_I18N_KEYS[code];
  if (key) return t(key, params);
  return message;
}
