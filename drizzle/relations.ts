import { relations } from "drizzle-orm/relations";
import { users, sessions, twoFactor, organizations, events, eventTypes, roles, rolePermissions, eventAttachments, categories, registrations, registrationGuests, notifications, tickets, payments, transportBookings, transportRoutes, transportStops, activityLogs, broadcastJobs, broadcastJobDeliveries, broadcastJobRecipients, eventPaymentMethods, paymentMethods, pushSubscriptions, platformTransactions, subscriptions, subscriptionPayments, organizationMembers, plans, platformSettings, broadcastLogs, ticketScanLogs, chatConversations, chatFeedback, chatMessages, commissionInvoices, accounts, categorySlugAliases, eventTypeSlugAliases } from "./schema";

export const sessionsRelations = relations(sessions, ({one}) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({one, many}) => ({
	sessions: many(sessions),
	twoFactors: many(twoFactor),
	organization: one(organizations, {
		fields: [users.organizationId],
		references: [organizations.id],
		relationName: "users_organizationId_organizations_id"
	}),
	events: many(events),
	rolePermissions: many(rolePermissions),
	categories: many(categories),
	registrations: many(registrations),
	notifications: many(notifications),
	payments_userId: many(payments, {
		relationName: "payments_userId_users_id"
	}),
	payments_verifiedBy: many(payments, {
		relationName: "payments_verifiedBy_users_id"
	}),
	transportBookings: many(transportBookings),
	activityLogs: many(activityLogs),
	broadcastJobDeliveries: many(broadcastJobDeliveries),
	broadcastJobRecipients: many(broadcastJobRecipients),
	paymentMethods: many(paymentMethods),
	pushSubscriptions: many(pushSubscriptions),
	platformTransactions: many(platformTransactions),
	organizationMembers: many(organizationMembers),
	subscriptions: many(subscriptions),
	subscriptionPayments_userId: many(subscriptionPayments, {
		relationName: "subscriptionPayments_userId_users_id"
	}),
	subscriptionPayments_verifiedBy: many(subscriptionPayments, {
		relationName: "subscriptionPayments_verifiedBy_users_id"
	}),
	platformSettings: many(platformSettings),
	broadcastLogs: many(broadcastLogs),
	organizations: many(organizations, {
		relationName: "organizations_ownerId_users_id"
	}),
	broadcastJobs: many(broadcastJobs),
	chatConversations: many(chatConversations),
	chatFeedbacks: many(chatFeedback),
	commissionInvoices: many(commissionInvoices),
	accounts: many(accounts),
	eventTypes: many(eventTypes),
}));

export const twoFactorRelations = relations(twoFactor, ({one}) => ({
	user: one(users, {
		fields: [twoFactor.userId],
		references: [users.id]
	}),
}));

export const organizationsRelations = relations(organizations, ({one, many}) => ({
	users: many(users, {
		relationName: "users_organizationId_organizations_id"
	}),
	events: many(events),
	categories: many(categories),
	organizationMembers: many(organizationMembers),
	subscriptions: many(subscriptions),
	user: one(users, {
		fields: [organizations.ownerId],
		references: [users.id],
		relationName: "organizations_ownerId_users_id"
	}),
	commissionInvoices: many(commissionInvoices),
}));

export const eventsRelations = relations(events, ({one, many}) => ({
	user: one(users, {
		fields: [events.organizerId],
		references: [users.id]
	}),
	organization: one(organizations, {
		fields: [events.organizationId],
		references: [organizations.id]
	}),
	eventType: one(eventTypes, {
		fields: [events.eventTypeId],
		references: [eventTypes.id]
	}),
	eventAttachments: many(eventAttachments),
	registrations: many(registrations),
	transportRoutes: many(transportRoutes),
	eventPaymentMethods: many(eventPaymentMethods),
	platformSettings: many(platformSettings),
	broadcastLogs: many(broadcastLogs),
	broadcastJobs: many(broadcastJobs),
}));

export const eventTypesRelations = relations(eventTypes, ({one, many}) => ({
	events: many(events),
	user: one(users, {
		fields: [eventTypes.createdBy],
		references: [users.id]
	}),
	eventTypeSlugAliases: many(eventTypeSlugAliases),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({one}) => ({
	role: one(roles, {
		fields: [rolePermissions.roleName],
		references: [roles.name]
	}),
	user: one(users, {
		fields: [rolePermissions.updatedBy],
		references: [users.id]
	}),
}));

export const rolesRelations = relations(roles, ({many}) => ({
	rolePermissions: many(rolePermissions),
}));

export const eventAttachmentsRelations = relations(eventAttachments, ({one}) => ({
	event: one(events, {
		fields: [eventAttachments.eventId],
		references: [events.id]
	}),
}));

export const categoriesRelations = relations(categories, ({one, many}) => ({
	organization: one(organizations, {
		fields: [categories.organizationId],
		references: [organizations.id]
	}),
	user: one(users, {
		fields: [categories.createdBy],
		references: [users.id]
	}),
	categorySlugAliases: many(categorySlugAliases),
}));

export const registrationsRelations = relations(registrations, ({one, many}) => ({
	event: one(events, {
		fields: [registrations.eventId],
		references: [events.id]
	}),
	user: one(users, {
		fields: [registrations.userId],
		references: [users.id]
	}),
	registrationGuest: one(registrationGuests, {
		fields: [registrations.guestId],
		references: [registrationGuests.id],
		relationName: "registrations_guestId_registrationGuests_id"
	}),
	registration: one(registrations, {
		fields: [registrations.parentRegistrationId],
		references: [registrations.id],
		relationName: "registrations_parentRegistrationId_registrations_id"
	}),
	registrations: many(registrations, {
		relationName: "registrations_parentRegistrationId_registrations_id"
	}),
	tickets: many(tickets),
	payments: many(payments),
	transportBookings: many(transportBookings),
	registrationGuests: many(registrationGuests, {
		relationName: "registrationGuests_parentRegistrationId_registrations_id"
	}),
}));

export const registrationGuestsRelations = relations(registrationGuests, ({one, many}) => ({
	registrations: many(registrations, {
		relationName: "registrations_guestId_registrationGuests_id"
	}),
	registration: one(registrations, {
		fields: [registrationGuests.parentRegistrationId],
		references: [registrations.id],
		relationName: "registrationGuests_parentRegistrationId_registrations_id"
	}),
}));

export const notificationsRelations = relations(notifications, ({one}) => ({
	user: one(users, {
		fields: [notifications.userId],
		references: [users.id]
	}),
}));

export const ticketsRelations = relations(tickets, ({one, many}) => ({
	registration: one(registrations, {
		fields: [tickets.registrationId],
		references: [registrations.id]
	}),
	ticketScanLogs: many(ticketScanLogs),
}));

export const paymentsRelations = relations(payments, ({one, many}) => ({
	registration: one(registrations, {
		fields: [payments.registrationId],
		references: [registrations.id]
	}),
	user_userId: one(users, {
		fields: [payments.userId],
		references: [users.id],
		relationName: "payments_userId_users_id"
	}),
	transportBooking: one(transportBookings, {
		fields: [payments.transportBookingId],
		references: [transportBookings.id]
	}),
	user_verifiedBy: one(users, {
		fields: [payments.verifiedBy],
		references: [users.id],
		relationName: "payments_verifiedBy_users_id"
	}),
	platformTransactions: many(platformTransactions),
}));

export const transportBookingsRelations = relations(transportBookings, ({one, many}) => ({
	payments: many(payments),
	transportRoute: one(transportRoutes, {
		fields: [transportBookings.routeId],
		references: [transportRoutes.id]
	}),
	registration: one(registrations, {
		fields: [transportBookings.registrationId],
		references: [registrations.id]
	}),
	user: one(users, {
		fields: [transportBookings.userId],
		references: [users.id]
	}),
	transportStop: one(transportStops, {
		fields: [transportBookings.stopId],
		references: [transportStops.id]
	}),
}));

export const transportRoutesRelations = relations(transportRoutes, ({one, many}) => ({
	transportBookings: many(transportBookings),
	event: one(events, {
		fields: [transportRoutes.eventId],
		references: [events.id]
	}),
	transportStops: many(transportStops),
}));

export const transportStopsRelations = relations(transportStops, ({one, many}) => ({
	transportBookings: many(transportBookings),
	transportRoute: one(transportRoutes, {
		fields: [transportStops.routeId],
		references: [transportRoutes.id]
	}),
}));

export const activityLogsRelations = relations(activityLogs, ({one}) => ({
	user: one(users, {
		fields: [activityLogs.actorId],
		references: [users.id]
	}),
}));

export const broadcastJobDeliveriesRelations = relations(broadcastJobDeliveries, ({one}) => ({
	broadcastJob: one(broadcastJobs, {
		fields: [broadcastJobDeliveries.jobId],
		references: [broadcastJobs.id]
	}),
	user: one(users, {
		fields: [broadcastJobDeliveries.recipientId],
		references: [users.id]
	}),
}));

export const broadcastJobsRelations = relations(broadcastJobs, ({one, many}) => ({
	broadcastJobDeliveries: many(broadcastJobDeliveries),
	broadcastJobRecipients: many(broadcastJobRecipients),
	event: one(events, {
		fields: [broadcastJobs.eventId],
		references: [events.id]
	}),
	user: one(users, {
		fields: [broadcastJobs.senderId],
		references: [users.id]
	}),
}));

export const broadcastJobRecipientsRelations = relations(broadcastJobRecipients, ({one}) => ({
	broadcastJob: one(broadcastJobs, {
		fields: [broadcastJobRecipients.jobId],
		references: [broadcastJobs.id]
	}),
	user: one(users, {
		fields: [broadcastJobRecipients.recipientId],
		references: [users.id]
	}),
}));

export const eventPaymentMethodsRelations = relations(eventPaymentMethods, ({one}) => ({
	event: one(events, {
		fields: [eventPaymentMethods.eventId],
		references: [events.id]
	}),
	paymentMethod: one(paymentMethods, {
		fields: [eventPaymentMethods.paymentMethodId],
		references: [paymentMethods.id]
	}),
}));

export const paymentMethodsRelations = relations(paymentMethods, ({one, many}) => ({
	eventPaymentMethods: many(eventPaymentMethods),
	user: one(users, {
		fields: [paymentMethods.organizerId],
		references: [users.id]
	}),
}));

export const pushSubscriptionsRelations = relations(pushSubscriptions, ({one}) => ({
	user: one(users, {
		fields: [pushSubscriptions.userId],
		references: [users.id]
	}),
}));

export const platformTransactionsRelations = relations(platformTransactions, ({one}) => ({
	user: one(users, {
		fields: [platformTransactions.userId],
		references: [users.id]
	}),
	payment: one(payments, {
		fields: [platformTransactions.paymentId],
		references: [payments.id]
	}),
	subscription: one(subscriptions, {
		fields: [platformTransactions.subscriptionId],
		references: [subscriptions.id]
	}),
	subscriptionPayment: one(subscriptionPayments, {
		fields: [platformTransactions.subscriptionPaymentId],
		references: [subscriptionPayments.id]
	}),
}));

export const subscriptionsRelations = relations(subscriptions, ({one, many}) => ({
	platformTransactions: many(platformTransactions),
	user: one(users, {
		fields: [subscriptions.userId],
		references: [users.id]
	}),
	organization: one(organizations, {
		fields: [subscriptions.organizationId],
		references: [organizations.id]
	}),
	plan_planId: one(plans, {
		fields: [subscriptions.planId],
		references: [plans.id],
		relationName: "subscriptions_planId_plans_id"
	}),
	plan_pendingPlanId: one(plans, {
		fields: [subscriptions.pendingPlanId],
		references: [plans.id],
		relationName: "subscriptions_pendingPlanId_plans_id"
	}),
}));

export const subscriptionPaymentsRelations = relations(subscriptionPayments, ({one, many}) => ({
	platformTransactions: many(platformTransactions),
	user_userId: one(users, {
		fields: [subscriptionPayments.userId],
		references: [users.id],
		relationName: "subscriptionPayments_userId_users_id"
	}),
	plan: one(plans, {
		fields: [subscriptionPayments.planId],
		references: [plans.id]
	}),
	user_verifiedBy: one(users, {
		fields: [subscriptionPayments.verifiedBy],
		references: [users.id],
		relationName: "subscriptionPayments_verifiedBy_users_id"
	}),
}));

export const organizationMembersRelations = relations(organizationMembers, ({one}) => ({
	organization: one(organizations, {
		fields: [organizationMembers.organizationId],
		references: [organizations.id]
	}),
	user: one(users, {
		fields: [organizationMembers.userId],
		references: [users.id]
	}),
}));

export const plansRelations = relations(plans, ({many}) => ({
	subscriptions_planId: many(subscriptions, {
		relationName: "subscriptions_planId_plans_id"
	}),
	subscriptions_pendingPlanId: many(subscriptions, {
		relationName: "subscriptions_pendingPlanId_plans_id"
	}),
	subscriptionPayments: many(subscriptionPayments),
}));

export const platformSettingsRelations = relations(platformSettings, ({one}) => ({
	user: one(users, {
		fields: [platformSettings.updatedBy],
		references: [users.id]
	}),
	event: one(events, {
		fields: [platformSettings.eventBannerPinnedEventId],
		references: [events.id]
	}),
}));

export const broadcastLogsRelations = relations(broadcastLogs, ({one}) => ({
	event: one(events, {
		fields: [broadcastLogs.eventId],
		references: [events.id]
	}),
	user: one(users, {
		fields: [broadcastLogs.senderId],
		references: [users.id]
	}),
}));

export const ticketScanLogsRelations = relations(ticketScanLogs, ({one}) => ({
	ticket: one(tickets, {
		fields: [ticketScanLogs.ticketId],
		references: [tickets.id]
	}),
}));

export const chatConversationsRelations = relations(chatConversations, ({one, many}) => ({
	user: one(users, {
		fields: [chatConversations.userId],
		references: [users.id]
	}),
	chatFeedbacks: many(chatFeedback),
	chatMessages: many(chatMessages),
}));

export const chatFeedbackRelations = relations(chatFeedback, ({one}) => ({
	chatConversation: one(chatConversations, {
		fields: [chatFeedback.conversationId],
		references: [chatConversations.id]
	}),
	user: one(users, {
		fields: [chatFeedback.userId],
		references: [users.id]
	}),
}));

export const chatMessagesRelations = relations(chatMessages, ({one}) => ({
	chatConversation: one(chatConversations, {
		fields: [chatMessages.conversationId],
		references: [chatConversations.id]
	}),
}));

export const commissionInvoicesRelations = relations(commissionInvoices, ({one}) => ({
	user: one(users, {
		fields: [commissionInvoices.organizerId],
		references: [users.id]
	}),
	organization: one(organizations, {
		fields: [commissionInvoices.organizationId],
		references: [organizations.id]
	}),
}));

export const accountsRelations = relations(accounts, ({one}) => ({
	user: one(users, {
		fields: [accounts.userId],
		references: [users.id]
	}),
}));

export const categorySlugAliasesRelations = relations(categorySlugAliases, ({one}) => ({
	category: one(categories, {
		fields: [categorySlugAliases.categoryId],
		references: [categories.id]
	}),
}));

export const eventTypeSlugAliasesRelations = relations(eventTypeSlugAliases, ({one}) => ({
	eventType: one(eventTypes, {
		fields: [eventTypeSlugAliases.eventTypeId],
		references: [eventTypes.id]
	}),
}));