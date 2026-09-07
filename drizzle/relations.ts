import { relations } from "drizzle-orm/relations";
import { organizations, categories, users, sessions, twoFactor, events, eventAttachments, roles, rolePermissions, eventTypes, registrations, registrationGuests, notifications, tickets, ticketScanLogs, payments, transportBookings, transportRoutes, transportStops, activityLogs, eventPaymentMethods, paymentMethods, broadcastLogs, broadcastJobs, broadcastJobRecipients, pushSubscriptions, subscriptionPayments, platformTransactions, subscriptions, platformSettings, plans, organizationMembers, accounts, broadcastJobDeliveries, chatConversations, chatFeedback, chatMessages, commissionInvoices, categorySlugAliases, eventTypeSlugAliases } from "./schema";

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

export const organizationsRelations = relations(organizations, ({one, many}) => ({
	categories: many(categories),
	events: many(events),
	subscriptions: many(subscriptions),
	user: one(users, {
		fields: [organizations.ownerId],
		references: [users.id],
		relationName: "organizations_ownerId_users_id"
	}),
	organizationMembers: many(organizationMembers),
	commissionInvoices: many(commissionInvoices),
	users: many(users, {
		relationName: "users_organizationId_organizations_id"
	}),
}));

export const usersRelations = relations(users, ({one, many}) => ({
	categories: many(categories),
	sessions: many(sessions),
	twoFactors: many(twoFactor),
	rolePermissions: many(rolePermissions),
	events: many(events),
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
	paymentMethods: many(paymentMethods),
	broadcastLogs: many(broadcastLogs),
	broadcastJobRecipients: many(broadcastJobRecipients),
	pushSubscriptions: many(pushSubscriptions),
	platformTransactions: many(platformTransactions),
	broadcastJobs: many(broadcastJobs),
	platformSettings: many(platformSettings),
	subscriptionPayments_userId: many(subscriptionPayments, {
		relationName: "subscriptionPayments_userId_users_id"
	}),
	subscriptionPayments_verifiedBy: many(subscriptionPayments, {
		relationName: "subscriptionPayments_verifiedBy_users_id"
	}),
	subscriptions: many(subscriptions),
	organizations: many(organizations, {
		relationName: "organizations_ownerId_users_id"
	}),
	organizationMembers: many(organizationMembers),
	accounts: many(accounts),
	broadcastJobDeliveries: many(broadcastJobDeliveries),
	chatConversations: many(chatConversations),
	chatFeedbacks: many(chatFeedback),
	commissionInvoices: many(commissionInvoices),
	organization: one(organizations, {
		fields: [users.organizationId],
		references: [organizations.id],
		relationName: "users_organizationId_organizations_id"
	}),
	eventTypes: many(eventTypes),
}));

export const sessionsRelations = relations(sessions, ({one}) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id]
	}),
}));

export const twoFactorRelations = relations(twoFactor, ({one}) => ({
	user: one(users, {
		fields: [twoFactor.userId],
		references: [users.id]
	}),
}));

export const eventAttachmentsRelations = relations(eventAttachments, ({one}) => ({
	event: one(events, {
		fields: [eventAttachments.eventId],
		references: [events.id]
	}),
}));

export const eventsRelations = relations(events, ({one, many}) => ({
	eventAttachments: many(eventAttachments),
	eventType: one(eventTypes, {
		fields: [events.eventTypeId],
		references: [eventTypes.id]
	}),
	user: one(users, {
		fields: [events.organizerId],
		references: [users.id]
	}),
	organization: one(organizations, {
		fields: [events.organizationId],
		references: [organizations.id]
	}),
	registrations: many(registrations),
	transportRoutes: many(transportRoutes),
	eventPaymentMethods: many(eventPaymentMethods),
	broadcastLogs: many(broadcastLogs),
	broadcastJobs: many(broadcastJobs),
	platformSettings: many(platformSettings),
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

export const eventTypesRelations = relations(eventTypes, ({one, many}) => ({
	events: many(events),
	user: one(users, {
		fields: [eventTypes.createdBy],
		references: [users.id]
	}),
	eventTypeSlugAliases: many(eventTypeSlugAliases),
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
	payments: many(payments),
	transportBookings: many(transportBookings),
	tickets: many(tickets),
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

export const ticketScanLogsRelations = relations(ticketScanLogs, ({one}) => ({
	ticket: one(tickets, {
		fields: [ticketScanLogs.ticketId],
		references: [tickets.id]
	}),
}));

export const ticketsRelations = relations(tickets, ({one, many}) => ({
	ticketScanLogs: many(ticketScanLogs),
	registration: one(registrations, {
		fields: [tickets.registrationId],
		references: [registrations.id]
	}),
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

export const broadcastJobsRelations = relations(broadcastJobs, ({one, many}) => ({
	broadcastJobRecipients: many(broadcastJobRecipients),
	event: one(events, {
		fields: [broadcastJobs.eventId],
		references: [events.id]
	}),
	user: one(users, {
		fields: [broadcastJobs.senderId],
		references: [users.id]
	}),
	broadcastJobDeliveries: many(broadcastJobDeliveries),
}));

export const pushSubscriptionsRelations = relations(pushSubscriptions, ({one}) => ({
	user: one(users, {
		fields: [pushSubscriptions.userId],
		references: [users.id]
	}),
}));

export const platformTransactionsRelations = relations(platformTransactions, ({one}) => ({
	subscriptionPayment: one(subscriptionPayments, {
		fields: [platformTransactions.subscriptionPaymentId],
		references: [subscriptionPayments.id]
	}),
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

export const platformSettingsRelations = relations(platformSettings, ({one}) => ({
	event: one(events, {
		fields: [platformSettings.eventBannerPinnedEventId],
		references: [events.id]
	}),
	user: one(users, {
		fields: [platformSettings.updatedBy],
		references: [users.id]
	}),
}));

export const plansRelations = relations(plans, ({many}) => ({
	subscriptionPayments: many(subscriptionPayments),
	subscriptions_planId: many(subscriptions, {
		relationName: "subscriptions_planId_plans_id"
	}),
	subscriptions_pendingPlanId: many(subscriptions, {
		relationName: "subscriptions_pendingPlanId_plans_id"
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

export const accountsRelations = relations(accounts, ({one}) => ({
	user: one(users, {
		fields: [accounts.userId],
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