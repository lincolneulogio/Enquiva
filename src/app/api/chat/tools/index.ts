import { searchEvents } from "./search-events";
import { getMyTickets } from "./my-tickets";
import { getEventStats } from "./event-stats";
import { getEventRoutes } from "./event-routes";
import { sendMassNotification } from "./mass-notification";
import { getAuditLogs } from "./audit-logs";
import { getUsersList } from "./users";
import { getRegistrationsList } from "./registrations";

type UserRole = "super_admin" | "admin" | "organizer" | "member";

export function buildTools(userRole: UserRole, userId: string, userName: string) {
  const isAdmin = userRole === "super_admin" || userRole === "admin";
  const isStaff = isAdmin || userRole === "organizer";

  return {
    searchEvents,
    ...(userRole === "member" && { getMyTickets: getMyTickets(userId) }),
    ...(isStaff && { getEventStats, getEventRoutes, getRegistrationsList, sendMassNotification: sendMassNotification(userId, userName) }),
    ...(isAdmin && { getAuditLogs, getUsersList }),
  };
}
