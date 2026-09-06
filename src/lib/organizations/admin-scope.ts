export type { AdminScope } from "./admin-scope-types";
export {
  scopeDenyAllCondition,
  isUnassignedAdminScope,
  resolveAdminScope,
  resolveAdminScopeForUser,
  getOrganizationIdForUser,
  getOrganizationIdFromScope,
  isPathAllowedForUnassignedAdmin,
} from "./admin-scope-types";

export {
  scopeEventCondition,
  scopeUserCondition,
  scopeCategoryCondition,
  scopeEventConditionForOrgId,
  registrationInOrgCondition,
  paymentInOrgCondition,
  activityLogInOrgCondition,
  transportRouteInOrgCondition,
  transportBookingInOrgCondition,
  registrationForOrganizerCondition,
  paymentForOrganizerCondition,
  transportRouteForOrganizerCondition,
  transportBookingForOrganizerCondition,
  andWithScope,
} from "./admin-scope-conditions";

export type { EventScopeRecord } from "./admin-scope-guards";
export {
  canMutateEventRecord,
  getEventScopeRecord,
  assertCanManageEvent,
  assertCanScanEvent,
  assertEventInAdminScope,
  assertPaymentInAdminScope,
  assertRouteInAdminScope,
  assertTransportPaymentInAdminScope,
} from "./admin-scope-guards";
