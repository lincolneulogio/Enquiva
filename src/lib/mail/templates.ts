/**
 * Email HTML Templates
 * Re-exports from modularized sub-modules in @/lib/mail/templates/
 */
export { wrapInTemplate } from "./templates/base-wrapper";

export {
  getVerificationCodeTemplate,
  getPasswordChangedTemplate,
  getPasswordResetTemplate,
} from "./templates/auth-templates";

export {
  getTicketTemplate,
  getSubscriptionRenewalReminderTemplate,
} from "./templates/ticket-billing-templates";

export {
  getBroadcastEmailTemplate,
  getCustomNotificationEmailTemplate,
  getWelcomeEmailTemplate,
} from "./templates/notification-templates";

export {
  organizerStatusEmailTemplate,
  getOrganizerRequestAdminEmailTemplate,
  getOrganizerApprovedEmailTemplate,
  getOrganizerRejectedEmailTemplate,
} from "./templates/organizer-templates";
