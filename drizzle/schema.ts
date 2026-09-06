import { pgTable, uniqueIndex, index, foreignKey, uuid, text, boolean, integer, timestamp, unique, doublePrecision, numeric, jsonb, type AnyPgColumn, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const broadcastDeliveryChannel = pgEnum("broadcast_delivery_channel", ['email', 'in_app', 'pusher'])
export const broadcastJobStatus = pgEnum("broadcast_job_status", ['pending', 'retry', 'processing', 'completed', 'failed'])
export const eventStatus = pgEnum("event_status", ['draft', 'published', 'cancelled', 'completed'])
export const notificationType = pgEnum("notification_type", ['event_published', 'registration_confirmed', 'event_cancelled', 'event_updated', 'event_reminder', 'waitlist_promoted', 'payment_submitted', 'payment_status_updated', 'organizer_request', 'organizer_approved', 'organizer_rejected', 'subscription_alert', 'transport_alert', 'finance_digest'])
export const organizationMemberRole = pgEnum("organization_member_role", ['owner', 'organizer', 'member', 'scanner'])
export const organizationMemberStatus = pgEnum("organization_member_status", ['active', 'pending', 'rejected'])
export const paymentMethodType = pgEnum("payment_method_type", ['yape', 'plin', 'cash', 'culqi'])
export const paymentStatus = pgEnum("payment_status", ['pending', 'approved', 'rejected'])
export const platformTransactionType = pgEnum("platform_transaction_type", ['subscription', 'commission', 'adjustment'])
export const registrationStatus = pgEnum("registration_status", ['registered', 'waitlisted', 'checked_in', 'cancelled'])
export const role = pgEnum("role", ['super_admin', 'admin', 'organizer', 'member', 'scanner'])
export const subscriptionPaymentStatus = pgEnum("subscription_payment_status", ['pending', 'approved', 'rejected'])
export const subscriptionStatus = pgEnum("subscription_status", ['active', 'cancelled', 'past_due', 'trialing'])
export const ticketStatus = pgEnum("ticket_status", ['active', 'used', 'cancelled'])
export const transportBookingStatus = pgEnum("transport_booking_status", ['pending', 'confirmed', 'cancelled'])


export const categories = pgTable("categories", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	organizationId: uuid("organization_id"),
	slug: text().notNull(),
	label: text().notNull(),
	description: text(),
	colorClass: text("color_class").default('bg-gray-100 text-gray-800').notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	sortOrder: integer("sort_order").default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	createdBy: text("created_by"),
	labelEn: text("label_en"),
}, (table) => [
	uniqueIndex("categories_org_slug_unique_idx").using("btree", table.organizationId.asc().nullsLast().op("uuid_ops"), table.slug.asc().nullsLast().op("uuid_ops")).where(sql`(organization_id IS NOT NULL)`),
	index("categories_organization_idx").using("btree", table.organizationId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("categories_platform_slug_unique_idx").using("btree", table.slug.asc().nullsLast().op("text_ops")).where(sql`(organization_id IS NULL)`),
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "categories_organization_id_organizations_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "categories_created_by_users_id_fk"
		}),
]);

export const roles = pgTable("roles", {
	name: text().primaryKey().notNull(),
	label: text().notNull(),
	description: text().notNull(),
	color: text().default('gray').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
	id: text().primaryKey().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	token: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "sessions_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("sessions_token_unique").on(table.token),
]);

export const twoFactor = pgTable("two_factor", {
	id: text().primaryKey().notNull(),
	secret: text().notNull(),
	backupCodes: text("backup_codes").notNull(),
	userId: text("user_id").notNull(),
	verified: boolean().default(true),
	failedVerificationCount: integer("failed_verification_count").default(0),
	lockedUntil: timestamp("locked_until", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "two_factor_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const eventAttachments = pgTable("event_attachments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	eventId: uuid("event_id").notNull(),
	fileUrl: text("file_url").notNull(),
	fileName: text("file_name").notNull(),
	fileType: text("file_type").notNull(),
	fileSize: integer("file_size"),
	uploadedAt: timestamp("uploaded_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.eventId],
			foreignColumns: [events.id],
			name: "event_attachments_event_id_events_id_fk"
		}).onDelete("cascade"),
]);

export const rolePermissions = pgTable("role_permissions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	roleName: text("role_name").notNull(),
	permission: text().notNull(),
	allowed: boolean().default(true).notNull(),
	updatedBy: text("updated_by"),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("role_permissions_role_idx").using("btree", table.roleName.asc().nullsLast().op("text_ops")),
	uniqueIndex("role_permissions_role_permission_unique_idx").using("btree", table.roleName.asc().nullsLast().op("text_ops"), table.permission.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.roleName],
			foreignColumns: [roles.name],
			name: "role_permissions_role_name_roles_name_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.updatedBy],
			foreignColumns: [users.id],
			name: "role_permissions_updated_by_users_id_fk"
		}),
]);

export const verifications = pgTable("verifications", {
	id: text().primaryKey().notNull(),
	identifier: text().notNull(),
	value: text().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const events = pgTable("events", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	organizerId: text("organizer_id").notNull(),
	organizationId: uuid("organization_id"),
	title: text().notNull(),
	slug: text().notNull(),
	description: text().notNull(),
	coverImage: text("cover_image"),
	category: text().default('other').notNull(),
	date: timestamp({ mode: 'string' }).notNull(),
	endDate: timestamp("end_date", { mode: 'string' }),
	location: text(),
	locationUrl: text("location_url"),
	latitude: doublePrecision(),
	longitude: doublePrecision(),
	isVirtual: boolean("is_virtual").default(false).notNull(),
	virtualLink: text("virtual_link"),
	capacity: integer(),
	status: eventStatus().default('draft').notNull(),
	isFeatured: boolean("is_featured").default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	price: numeric({ precision: 10, scale:  2 }),
	hasTransport: boolean("has_transport").default(false).notNull(),
	holdMinutesCard: integer("hold_minutes_card").default(30).notNull(),
	holdHoursManual: integer("hold_hours_manual").default(24).notNull(),
	nearEventWindowHours: integer("near_event_window_hours").default(48).notNull(),
	nearEventHoldMinutes: integer("near_event_hold_minutes").default(15).notNull(),
	salesCutoffHoursBefore: integer("sales_cutoff_hours_before"),
	viewCount: integer("view_count").default(0).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	schedules: jsonb(),
	hasCertificate: boolean("has_certificate").default(false).notNull(),
	certificateTitle: text("certificate_title"),
	certificatePrice: numeric("certificate_price", { precision: 10, scale:  2 }).default('0').notNull(),
	eventTypeId: uuid("event_type_id"),
}, (table) => [
	index("events_category_idx").using("btree", table.category.asc().nullsLast().op("text_ops")),
	index("events_date_idx").using("btree", table.date.asc().nullsLast().op("timestamp_ops")),
	index("events_event_type_idx").using("btree", table.eventTypeId.asc().nullsLast().op("uuid_ops")),
	index("events_featured_status_date_idx").using("btree", table.isFeatured.asc().nullsLast().op("bool_ops"), table.status.asc().nullsLast().op("enum_ops"), table.date.asc().nullsLast().op("enum_ops")),
	index("events_organization_idx").using("btree", table.organizationId.asc().nullsLast().op("uuid_ops")),
	index("events_organizer_idx").using("btree", table.organizerId.asc().nullsLast().op("text_ops")),
	index("events_status_date_idx").using("btree", table.status.asc().nullsLast().op("timestamp_ops"), table.date.asc().nullsLast().op("enum_ops")),
	index("events_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	foreignKey({
			columns: [table.eventTypeId],
			foreignColumns: [eventTypes.id],
			name: "events_event_type_id_event_types_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.organizerId],
			foreignColumns: [users.id],
			name: "events_organizer_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "events_organization_id_organizations_id_fk"
		}).onDelete("set null"),
	unique("events_slug_unique").on(table.slug),
]);

export const registrations = pgTable("registrations", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	eventId: uuid("event_id").notNull(),
	userId: text("user_id"),
	guestId: uuid("guest_id"),
	status: registrationStatus().default('registered').notNull(),
	contactPhone: text("contact_phone"),
	notes: text(),
	parentRegistrationId: uuid("parent_registration_id"),
	registeredAt: timestamp("registered_at", { mode: 'string' }).defaultNow().notNull(),
	checkedInAt: timestamp("checked_in_at", { mode: 'string' }),
	holdExpiresAt: timestamp("hold_expires_at", { mode: 'string' }),
	holdReminderSentAt: timestamp("hold_reminder_sent_at", { mode: 'string' }),
	selectedScheduleId: text("selected_schedule_id"),
	selectedScheduleLabel: text("selected_schedule_label"),
	wantsCertificate: boolean("wants_certificate").default(false).notNull(),
	certificateCode: text("certificate_code"),
	certificateIssuedAt: timestamp("certificate_issued_at", { mode: 'string' }),
}, (table) => [
	uniqueIndex("registrations_certificate_code_unique_idx").using("btree", table.certificateCode.asc().nullsLast().op("text_ops")).where(sql`(certificate_code IS NOT NULL)`),
	uniqueIndex("registrations_event_guest_unique_idx").using("btree", table.eventId.asc().nullsLast().op("uuid_ops"), table.guestId.asc().nullsLast().op("uuid_ops")).where(sql`(guest_id IS NOT NULL)`),
	index("registrations_event_idx").using("btree", table.eventId.asc().nullsLast().op("uuid_ops")),
	index("registrations_event_status_idx").using("btree", table.eventId.asc().nullsLast().op("uuid_ops"), table.status.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("registrations_event_user_unique_idx").using("btree", table.eventId.asc().nullsLast().op("text_ops"), table.userId.asc().nullsLast().op("text_ops")).where(sql`(user_id IS NOT NULL)`),
	index("registrations_guest_idx").using("btree", table.guestId.asc().nullsLast().op("uuid_ops")),
	index("registrations_hold_expires_idx").using("btree", table.holdExpiresAt.asc().nullsLast().op("timestamp_ops")),
	index("registrations_parent_idx").using("btree", table.parentRegistrationId.asc().nullsLast().op("uuid_ops")),
	index("registrations_selected_schedule_idx").using("btree", table.eventId.asc().nullsLast().op("uuid_ops"), table.selectedScheduleId.asc().nullsLast().op("uuid_ops")),
	index("registrations_user_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.eventId],
			foreignColumns: [events.id],
			name: "registrations_event_id_events_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "registrations_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.guestId],
			foreignColumns: [registrationGuests.id],
			name: "registrations_guest_id_registration_guests_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.parentRegistrationId],
			foreignColumns: [table.id],
			name: "registrations_parent_registration_id_registrations_id_fk"
		}).onDelete("cascade"),
]);

export const notifications = pgTable("notifications", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	type: notificationType().notNull(),
	title: text().notNull(),
	message: text().notNull(),
	read: boolean().default(false).notNull(),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("notifications_read_idx").using("btree", table.read.asc().nullsLast().op("bool_ops")),
	index("notifications_user_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	index("notifications_user_unread_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")).where(sql`(read = false)`),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "notifications_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const ticketScanLogs = pgTable("ticket_scan_logs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	ticketId: uuid("ticket_id").notNull(),
	scannedBy: text("scanned_by"),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	result: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("ticket_scan_logs_ticket_idx").using("btree", table.ticketId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.ticketId],
			foreignColumns: [tickets.id],
			name: "ticket_scan_logs_ticket_id_tickets_id_fk"
		}).onDelete("cascade"),
]);

export const payments = pgTable("payments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	registrationId: uuid("registration_id").notNull(),
	userId: text("user_id").notNull(),
	amount: numeric({ precision: 12, scale:  2 }).default('0').notNull(),
	transportBookingId: uuid("transport_booking_id"),
	currency: text().default('PEN').notNull(),
	method: text().default('manual').notNull(),
	reference: text(),
	status: paymentStatus().default('pending').notNull(),
	receiptUrl: text("receipt_url"),
	receiptFileName: text("receipt_file_name"),
	notes: text(),
	verifiedBy: text("verified_by"),
	verifiedAt: timestamp("verified_at", { mode: 'string' }),
	gatewayProvider: text("gateway_provider"),
	gatewayChargeId: text("gateway_charge_id"),
	gatewayOrderId: text("gateway_order_id"),
	gatewayStatus: text("gateway_status"),
	platformFee: numeric("platform_fee", { precision: 12, scale:  2 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("payments_gateway_charge_idx").using("btree", table.gatewayChargeId.asc().nullsLast().op("text_ops")),
	uniqueIndex("payments_gateway_charge_uidx").using("btree", table.gatewayChargeId.asc().nullsLast().op("text_ops")).where(sql`(gateway_charge_id IS NOT NULL)`),
	uniqueIndex("payments_gateway_order_unique_idx").using("btree", table.gatewayOrderId.asc().nullsLast().op("text_ops")).where(sql`(gateway_order_id IS NOT NULL)`),
	index("payments_registration_idx").using("btree", table.registrationId.asc().nullsLast().op("uuid_ops")),
	index("payments_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	index("payments_transport_booking_idx").using("btree", table.transportBookingId.asc().nullsLast().op("uuid_ops")),
	index("payments_user_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.registrationId],
			foreignColumns: [registrations.id],
			name: "payments_registration_id_registrations_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "payments_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.transportBookingId],
			foreignColumns: [transportBookings.id],
			name: "payments_transport_booking_id_transport_bookings_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.verifiedBy],
			foreignColumns: [users.id],
			name: "payments_verified_by_users_id_fk"
		}),
]);

export const transportBookings = pgTable("transport_bookings", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	routeId: uuid("route_id").notNull(),
	registrationId: uuid("registration_id").notNull(),
	userId: text("user_id").notNull(),
	seats: integer().default(1).notNull(),
	status: transportBookingStatus().default('pending').notNull(),
	notes: text(),
	stopId: uuid("stop_id"),
	bookedAt: timestamp("booked_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("transport_bookings_registration_idx").using("btree", table.registrationId.asc().nullsLast().op("uuid_ops")),
	index("transport_bookings_route_idx").using("btree", table.routeId.asc().nullsLast().op("uuid_ops")),
	index("transport_bookings_status_booked_idx").using("btree", table.status.asc().nullsLast().op("timestamp_ops"), table.bookedAt.asc().nullsLast().op("timestamp_ops")),
	index("transport_bookings_stop_idx").using("btree", table.stopId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.routeId],
			foreignColumns: [transportRoutes.id],
			name: "transport_bookings_route_id_transport_routes_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.registrationId],
			foreignColumns: [registrations.id],
			name: "transport_bookings_registration_id_registrations_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "transport_bookings_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.stopId],
			foreignColumns: [transportStops.id],
			name: "transport_bookings_stop_id_transport_stops_id_fk"
		}).onDelete("set null"),
]);

export const transportRoutes = pgTable("transport_routes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	eventId: uuid("event_id").notNull(),
	name: text().notNull(),
	departurePoint: text("departure_point").notNull(),
	departureTime: timestamp("departure_time", { mode: 'string' }).notNull(),
	returnTime: timestamp("return_time", { mode: 'string' }),
	pricePerSeat: numeric("price_per_seat", { precision: 10, scale:  2 }).default('0').notNull(),
	totalSeats: integer("total_seats").default(0).notNull(),
	description: text(),
	driverName: text("driver_name"),
	vehiclePlate: text("vehicle_plate"),
	isRoundTrip: boolean("is_round_trip").default(true).notNull(),
	pendingHoldHours: integer("pending_hold_hours").default(24).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("transport_routes_event_idx").using("btree", table.eventId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.eventId],
			foreignColumns: [events.id],
			name: "transport_routes_event_id_events_id_fk"
		}).onDelete("cascade"),
]);

export const transportStops = pgTable("transport_stops", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	routeId: uuid("route_id").notNull(),
	name: text().notNull(),
	latitude: text(),
	longitude: text(),
	sortOrder: integer("sort_order").default(0).notNull(),
	estimatedArrivalTime: timestamp("estimated_arrival_time", { mode: 'string' }),
	maxSeats: integer("max_seats"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("transport_stops_route_idx").using("btree", table.routeId.asc().nullsLast().op("uuid_ops")),
	index("transport_stops_route_sort_idx").using("btree", table.routeId.asc().nullsLast().op("int4_ops"), table.sortOrder.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.routeId],
			foreignColumns: [transportRoutes.id],
			name: "transport_stops_route_id_transport_routes_id_fk"
		}).onDelete("cascade"),
]);

export const activityLogs = pgTable("activity_logs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	actorId: text("actor_id"),
	actorName: text("actor_name").notNull(),
	action: text().notNull(),
	entityType: text("entity_type").notNull(),
	entityId: text("entity_id").notNull(),
	details: text(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("activity_logs_action_idx").using("btree", table.action.asc().nullsLast().op("text_ops")),
	index("activity_logs_actor_idx").using("btree", table.actorId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.actorId],
			foreignColumns: [users.id],
			name: "activity_logs_actor_id_users_id_fk"
		}).onDelete("set null"),
]);

export const tickets = pgTable("tickets", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	registrationId: uuid("registration_id").notNull(),
	code: text().notNull(),
	signature: text(),
	status: ticketStatus().default('active').notNull(),
	issuedAt: timestamp("issued_at", { mode: 'string' }).defaultNow().notNull(),
	checkedInAt: timestamp("checked_in_at", { mode: 'string' }),
	metadata: jsonb(),
}, (table) => [
	uniqueIndex("tickets_registration_unique_idx").using("btree", table.registrationId.asc().nullsLast().op("uuid_ops")),
	index("tickets_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	foreignKey({
			columns: [table.registrationId],
			foreignColumns: [registrations.id],
			name: "tickets_registration_id_registrations_id_fk"
		}).onDelete("cascade"),
	unique("tickets_code_unique").on(table.code),
]);

export const eventPaymentMethods = pgTable("event_payment_methods", {
	eventId: uuid("event_id").notNull(),
	paymentMethodId: uuid("payment_method_id").notNull(),
}, (table) => [
	uniqueIndex("event_payment_methods_unique_idx").using("btree", table.eventId.asc().nullsLast().op("uuid_ops"), table.paymentMethodId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.eventId],
			foreignColumns: [events.id],
			name: "event_payment_methods_event_id_events_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.paymentMethodId],
			foreignColumns: [paymentMethods.id],
			name: "event_payment_methods_payment_method_id_payment_methods_id_fk"
		}).onDelete("cascade"),
]);

export const paymentMethods = pgTable("payment_methods", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	organizerId: text("organizer_id"),
	type: paymentMethodType().notNull(),
	label: text().notNull(),
	qrCodeUrl: text("qr_code_url"),
	phone: text(),
	holderName: text("holder_name").notNull(),
	culqiPublicKey: text("culqi_public_key"),
	culqiSecretKey: text("culqi_secret_key"),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("payment_methods_organizer_idx").using("btree", table.organizerId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.organizerId],
			foreignColumns: [users.id],
			name: "payment_methods_organizer_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const broadcastLogs = pgTable("broadcast_logs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	jobId: uuid("job_id"),
	eventId: uuid("event_id").notNull(),
	senderId: text("sender_id").notNull(),
	subject: text().notNull(),
	message: text().notNull(),
	recipientCount: text("recipient_count").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("broadcast_logs_event_idx").using("btree", table.eventId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.eventId],
			foreignColumns: [events.id],
			name: "broadcast_logs_event_id_events_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.senderId],
			foreignColumns: [users.id],
			name: "broadcast_logs_sender_id_users_id_fk"
		}).onDelete("cascade"),
	unique("broadcast_logs_job_id_unique").on(table.jobId),
]);

export const broadcastJobRecipients = pgTable("broadcast_job_recipients", {
	jobId: uuid("job_id").notNull(),
	recipientId: text("recipient_id").notNull(),
	name: text(),
	email: text().notNull(),
}, (table) => [
	uniqueIndex("broadcast_job_recipients_job_recipient_unique_idx").using("btree", table.jobId.asc().nullsLast().op("text_ops"), table.recipientId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.jobId],
			foreignColumns: [broadcastJobs.id],
			name: "broadcast_job_recipients_job_id_broadcast_jobs_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.recipientId],
			foreignColumns: [users.id],
			name: "broadcast_job_recipients_recipient_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const pushSubscriptions = pgTable("push_subscriptions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	endpoint: text().notNull(),
	p256Dh: text().notNull(),
	auth: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("push_subscriptions_user_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "push_subscriptions_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("push_subscriptions_endpoint_unique").on(table.endpoint),
]);

export const platformTransactions = pgTable("platform_transactions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	type: platformTransactionType().notNull(),
	amount: numeric({ precision: 12, scale:  2 }).notNull(),
	currency: text().default('PEN').notNull(),
	userId: text("user_id"),
	paymentId: uuid("payment_id"),
	subscriptionId: uuid("subscription_id"),
	subscriptionPaymentId: uuid("subscription_payment_id"),
	description: text(),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("platform_transactions_created_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	uniqueIndex("platform_transactions_subscription_payment_unique_idx").using("btree", table.subscriptionPaymentId.asc().nullsLast().op("uuid_ops")).where(sql`(subscription_payment_id IS NOT NULL)`),
	index("platform_transactions_type_idx").using("btree", table.type.asc().nullsLast().op("enum_ops")),
	index("platform_transactions_user_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.subscriptionPaymentId],
			foreignColumns: [subscriptionPayments.id],
			name: "platform_transactions_subscription_payment_id_subscription_paym"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "platform_transactions_user_id_users_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.paymentId],
			foreignColumns: [payments.id],
			name: "platform_transactions_payment_id_payments_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.subscriptionId],
			foreignColumns: [subscriptions.id],
			name: "platform_transactions_subscription_id_subscriptions_id_fk"
		}).onDelete("set null"),
]);

export const plans = pgTable("plans", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	slug: text().notNull(),
	name: text().notNull(),
	description: text(),
	priceMonthly: numeric("price_monthly", { precision: 10, scale:  2 }).default('0').notNull(),
	currency: text().default('PEN').notNull(),
	maxActiveEvents: integer("max_active_events"),
	maxAttendeesPerEvent: integer("max_attendees_per_event"),
	commissionPercent: numeric("commission_percent", { precision: 5, scale:  2 }).default('0').notNull(),
	commissionPerRegistration: numeric("commission_per_registration", { precision: 10, scale:  2 }).default('0').notNull(),
	maxBroadcastsPerMonth: integer("max_broadcasts_per_month"),
	maxAiMessagesPerMonth: integer("max_ai_messages_per_month"),
	maxOrganizers: integer("max_organizers"),
	featureCulqi: boolean("feature_culqi").default(false).notNull(),
	featureTransport: boolean("feature_transport").default(false).notNull(),
	featureAi: boolean("feature_ai").default(false).notNull(),
	featureExports: boolean("feature_exports").default(false).notNull(),
	featureCustomBranding: boolean("feature_custom_branding").default(false).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	sortOrder: integer("sort_order").default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("plans_active_idx").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	index("plans_sort_idx").using("btree", table.sortOrder.asc().nullsLast().op("int4_ops")),
	unique("plans_slug_unique").on(table.slug),
]);

export const broadcastJobs = pgTable("broadcast_jobs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	eventId: uuid("event_id").notNull(),
	senderId: text("sender_id").notNull(),
	subject: text().notNull(),
	message: text().notNull(),
	recipientStatus: text("recipient_status").notNull(),
	channels: jsonb().notNull(),
	locale: text().default('es').notNull(),
	status: broadcastJobStatus().default('pending').notNull(),
	totalRecipients: integer("total_recipients").default(0).notNull(),
	successCount: integer("success_count").default(0).notNull(),
	failureCount: integer("failure_count").default(0).notNull(),
	errorMessage: text("error_message"),
	attempts: integer().default(0).notNull(),
	maxAttempts: integer("max_attempts").default(5).notNull(),
	nextAttemptAt: timestamp("next_attempt_at", { mode: 'string' }).defaultNow().notNull(),
	lockedAt: timestamp("locked_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	startedAt: timestamp("started_at", { mode: 'string' }),
	completedAt: timestamp("completed_at", { mode: 'string' }),
}, (table) => [
	index("broadcast_jobs_sender_idx").using("btree", table.senderId.asc().nullsLast().op("text_ops")),
	index("broadcast_jobs_status_next_attempt_idx").using("btree", table.status.asc().nullsLast().op("timestamp_ops"), table.nextAttemptAt.asc().nullsLast().op("timestamp_ops")),
	foreignKey({
			columns: [table.eventId],
			foreignColumns: [events.id],
			name: "broadcast_jobs_event_id_events_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.senderId],
			foreignColumns: [users.id],
			name: "broadcast_jobs_sender_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const platformSettings = pgTable("platform_settings", {
	id: text().default('default').primaryKey().notNull(),
	organizationName: text("organization_name").notNull(),
	supportEmail: text("support_email").notNull(),
	publicContactEmail: text("public_contact_email").default('hola@enquiva.app').notNull(),
	publicLocation: text("public_location").default(').notNull(),
	socialFacebook: text("social_facebook").default(').notNull(),
	socialInstagram: text("social_instagram").default(').notNull(),
	socialX: text("social_x").default(').notNull(),
	socialLinkedin: text("social_linkedin").default(').notNull(),
	socialWhatsapp: text("social_whatsapp").default(').notNull(),
	socialYoutube: text("social_youtube").default(').notNull(),
	defaultAccentColor: text("default_accent_color").default('amber').notNull(),
	maintenanceMode: boolean("maintenance_mode").default(false).notNull(),
	maintenanceMessage: text("maintenance_message").default(').notNull(),
	maintenanceStartsAt: timestamp("maintenance_starts_at", { mode: 'string' }),
	maintenanceEndsAt: timestamp("maintenance_ends_at", { mode: 'string' }),
	announcementEnabled: boolean("announcement_enabled").default(false).notNull(),
	announcementMessage: text("announcement_message").default(').notNull(),
	announcementSeverity: text("announcement_severity").default('info').notNull(),
	announcementDismissible: boolean("announcement_dismissible").default(true).notNull(),
	announcementStartsAt: timestamp("announcement_starts_at", { mode: 'string' }),
	announcementEndsAt: timestamp("announcement_ends_at", { mode: 'string' }),
	announcementEventAt: timestamp("announcement_event_at", { mode: 'string' }),
	termsUrl: text("terms_url").default(').notNull(),
	privacyUrl: text("privacy_url").default(').notNull(),
	defaultLocale: text("default_locale").default('es').notNull(),
	defaultTimezone: text("default_timezone").default('America/Lima').notNull(),
	smtpUseCustom: boolean("smtp_use_custom").default(false).notNull(),
	smtpHost: text("smtp_host").default(').notNull(),
	smtpPort: integer("smtp_port").default(587).notNull(),
	smtpUser: text("smtp_user").default(').notNull(),
	smtpPassEncrypted: text("smtp_pass_encrypted").default(').notNull(),
	smtpFromEmail: text("smtp_from_email").default(').notNull(),
	smtpFromName: text("smtp_from_name").default(').notNull(),
	pushNotificationTitle: text("push_notification_title").default(').notNull(),
	alertNewPayments: boolean("alert_new_payments").default(true).notNull(),
	alertNewRegistrations: boolean("alert_new_registrations").default(true).notNull(),
	alertTransportCapacity: boolean("alert_transport_capacity").default(true).notNull(),
	alertOrganizerRequests: boolean("alert_organizer_requests").default(true).notNull(),
	alertEventPublished: boolean("alert_event_published").default(true).notNull(),
	alertSubscriptionPastDue: boolean("alert_subscription_past_due").default(true).notNull(),
	alertDailyFinanceSummary: boolean("alert_daily_finance_summary").default(false).notNull(),
	updatedBy: text("updated_by"),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	eventBannerEnabled: boolean("event_banner_enabled").default(false).notNull(),
	eventBannerMode: text("event_banner_mode").default('auto').notNull(),
	eventBannerCriteria: text("event_banner_criteria").default('auto').notNull(),
	eventBannerPinnedEventId: uuid("event_banner_pinned_event_id"),
	eventBannerCustomBadge: text("event_banner_custom_badge").default(').notNull(),
	eventBannerCustomText: text("event_banner_custom_text").default(').notNull(),
	impactCard1Title: text("impact_card_1_title").default('5+ años impulsando').notNull(),
	impactCard1Subtitle: text("impact_card_1_subtitle").default('Eventos de tecnología, negocios e innovación en Latinoamérica.').notNull(),
	impactCard1ImageUrl: text("impact_card_1_image_url").default(').notNull(),
	impactCard2Title: text("impact_card_2_title").default('Más de 250 empresas').notNull(),
	impactCard2Subtitle: text("impact_card_2_subtitle").default('Ya patrocinan y reclutan talento activamente en nuestros eventos.').notNull(),
	impactCard2ImageUrl: text("impact_card_2_image_url").default(').notNull(),
	impactSatisfactionRate: text("impact_satisfaction_rate").default('99.8%').notNull(),
	certificateSealUrl: text("certificate_seal_url").default('/images/enquiva-verified-seal.png').notNull(),
}, (table) => [
	foreignKey({
			columns: [table.eventBannerPinnedEventId],
			foreignColumns: [events.id],
			name: "platform_settings_event_banner_pinned_event_id_events_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.updatedBy],
			foreignColumns: [users.id],
			name: "platform_settings_updated_by_users_id_fk"
		}).onDelete("set null"),
]);

export const subscriptionPayments = pgTable("subscription_payments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	planId: uuid("plan_id").notNull(),
	amount: numeric({ precision: 12, scale:  2 }).notNull(),
	currency: text().default('PEN').notNull(),
	method: text().notNull(),
	reference: text(),
	receiptUrl: text("receipt_url"),
	receiptFileName: text("receipt_file_name"),
	status: subscriptionPaymentStatus().default('pending').notNull(),
	gatewayProvider: text("gateway_provider"),
	gatewayChargeId: text("gateway_charge_id"),
	notes: text(),
	verifiedBy: text("verified_by"),
	verifiedAt: timestamp("verified_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("subscription_payments_gateway_charge_uidx").using("btree", table.gatewayChargeId.asc().nullsLast().op("text_ops")).where(sql`(gateway_charge_id IS NOT NULL)`),
	index("subscription_payments_plan_idx").using("btree", table.planId.asc().nullsLast().op("uuid_ops")),
	index("subscription_payments_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	index("subscription_payments_user_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "subscription_payments_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.planId],
			foreignColumns: [plans.id],
			name: "subscription_payments_plan_id_plans_id_fk"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.verifiedBy],
			foreignColumns: [users.id],
			name: "subscription_payments_verified_by_users_id_fk"
		}),
]);

export const subscriptions = pgTable("subscriptions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	organizationId: uuid("organization_id"),
	planId: uuid("plan_id").notNull(),
	pendingPlanId: uuid("pending_plan_id"),
	pendingPlanEffectiveAt: timestamp("pending_plan_effective_at", { mode: 'string' }),
	status: subscriptionStatus().default('active').notNull(),
	currentPeriodStart: timestamp("current_period_start", { mode: 'string' }).defaultNow().notNull(),
	currentPeriodEnd: timestamp("current_period_end", { mode: 'string' }).notNull(),
	cancelledAt: timestamp("cancelled_at", { mode: 'string' }),
	culqiSubscriptionId: text("culqi_subscription_id"),
	autoRenewEnabled: boolean("auto_renew_enabled").default(false).notNull(),
	culqiCustomerId: text("culqi_customer_id"),
	culqiCardId: text("culqi_card_id"),
	culqiCardLastFour: text("culqi_card_last_four"),
	culqiCardBrand: text("culqi_card_brand"),
	renewalReminderSentAt: timestamp("renewal_reminder_sent_at", { mode: 'string' }),
	autoRenewLastAttemptAt: timestamp("auto_renew_last_attempt_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("subscriptions_org_idx").using("btree", table.organizationId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("subscriptions_org_user_unique_idx").using("btree", table.organizationId.asc().nullsLast().op("text_ops"), table.userId.asc().nullsLast().op("text_ops")).where(sql`(organization_id IS NOT NULL)`),
	index("subscriptions_pending_plan_idx").using("btree", table.pendingPlanId.asc().nullsLast().op("uuid_ops"), table.pendingPlanEffectiveAt.asc().nullsLast().op("uuid_ops")),
	index("subscriptions_plan_idx").using("btree", table.planId.asc().nullsLast().op("uuid_ops")),
	index("subscriptions_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	uniqueIndex("subscriptions_user_without_org_unique_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")).where(sql`(organization_id IS NULL)`),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "subscriptions_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "subscriptions_organization_id_organizations_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.planId],
			foreignColumns: [plans.id],
			name: "subscriptions_plan_id_plans_id_fk"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.pendingPlanId],
			foreignColumns: [plans.id],
			name: "subscriptions_pending_plan_id_plans_id_fk"
		}).onDelete("set null"),
]);

export const organizations = pgTable("organizations", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	slug: text().notNull(),
	inviteCode: text("invite_code").notNull(),
	ownerId: text("owner_id").notNull(),
	logoUrl: text("logo_url"),
	accentColor: text("accent_color"),
	brandingEnabled: boolean("branding_enabled").default(false).notNull(),
	whatsappNumber: text("whatsapp_number"),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("organizations_invite_code_idx").using("btree", table.inviteCode.asc().nullsLast().op("text_ops")),
	index("organizations_owner_idx").using("btree", table.ownerId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.ownerId],
			foreignColumns: [users.id],
			name: "organizations_owner_id_users_id_fk"
		}).onDelete("restrict"),
	unique("organizations_slug_unique").on(table.slug),
	unique("organizations_invite_code_unique").on(table.inviteCode),
]);

export const organizationMembers = pgTable("organization_members", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	organizationId: uuid("organization_id").notNull(),
	userId: text("user_id").notNull(),
	role: organizationMemberRole().notNull(),
	status: organizationMemberStatus().default('active').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("organization_members_org_idx").using("btree", table.organizationId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("organization_members_org_user_unique").using("btree", table.organizationId.asc().nullsLast().op("text_ops"), table.userId.asc().nullsLast().op("uuid_ops")),
	index("organization_members_user_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "organization_members_organization_id_organizations_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "organization_members_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const knowledgeChunks = pgTable("knowledge_chunks", {
	id: text().primaryKey().notNull(),
	title: text().notNull(),
	text: text().notNull(),
	kind: text().notNull(),
	moduleId: integer("module_id"),
	moduleName: text("module_name"),
	tags: jsonb().default([]).notNull(),
	embedding: jsonb(),
	embeddingModel: text("embedding_model"),
	syncedAt: timestamp("synced_at", { mode: 'string' }).defaultNow().notNull(),
	active: boolean().default(true).notNull(),
}, (table) => [
	index("knowledge_chunks_kind_idx").using("btree", table.kind.asc().nullsLast().op("text_ops")),
]);

export const accounts = pgTable("accounts", {
	id: text().primaryKey().notNull(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id").notNull(),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at", { mode: 'string' }),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { mode: 'string' }),
	scope: text(),
	password: text(),
	issuer: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "accounts_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const registrationGuests = pgTable("registration_guests", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	parentRegistrationId: uuid("parent_registration_id").notNull(),
	name: text().notNull(),
	phone: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("registration_guests_parent_idx").using("btree", table.parentRegistrationId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.parentRegistrationId],
			foreignColumns: [registrations.id],
			name: "registration_guests_parent_registration_id_registrations_id_fk"
		}).onDelete("cascade"),
]);

export const broadcastJobDeliveries = pgTable("broadcast_job_deliveries", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	jobId: uuid("job_id").notNull(),
	recipientId: text("recipient_id").notNull(),
	channel: broadcastDeliveryChannel().notNull(),
	status: text().default('processing').notNull(),
	attempts: integer().default(1).notNull(),
	lockedAt: timestamp("locked_at", { mode: 'string' }).defaultNow().notNull(),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	errorMessage: text("error_message"),
}, (table) => [
	uniqueIndex("broadcast_job_deliveries_job_recipient_channel_unique_idx").using("btree", table.jobId.asc().nullsLast().op("text_ops"), table.recipientId.asc().nullsLast().op("uuid_ops"), table.channel.asc().nullsLast().op("uuid_ops")),
	index("broadcast_job_deliveries_job_status_idx").using("btree", table.jobId.asc().nullsLast().op("uuid_ops"), table.status.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.jobId],
			foreignColumns: [broadcastJobs.id],
			name: "broadcast_job_deliveries_job_id_broadcast_jobs_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.recipientId],
			foreignColumns: [users.id],
			name: "broadcast_job_deliveries_recipient_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const chatConversations = pgTable("chat_conversations", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	title: text(),
	pathContext: text("path_context"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("chat_conversations_updated_idx").using("btree", table.updatedAt.asc().nullsLast().op("timestamp_ops")),
	index("chat_conversations_user_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "chat_conversations_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const chatFeedback = pgTable("chat_feedback", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	conversationId: uuid("conversation_id"),
	messageId: text("message_id").notNull(),
	userId: text("user_id").notNull(),
	rating: integer().notNull(),
	query: text(),
	citations: jsonb(),
	intent: text(),
	toolsUsed: jsonb("tools_used"),
	modelId: text("model_id"),
	note: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("chat_feedback_message_idx").using("btree", table.messageId.asc().nullsLast().op("text_ops")),
	index("chat_feedback_user_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.conversationId],
			foreignColumns: [chatConversations.id],
			name: "chat_feedback_conversation_id_chat_conversations_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "chat_feedback_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const chatMessages = pgTable("chat_messages", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	conversationId: uuid("conversation_id").notNull(),
	role: text().notNull(),
	content: text().notNull(),
	citations: jsonb(),
	intent: text(),
	modelId: text("model_id"),
	toolsUsed: jsonb("tools_used"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("chat_messages_conversation_idx").using("btree", table.conversationId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.conversationId],
			foreignColumns: [chatConversations.id],
			name: "chat_messages_conversation_id_chat_conversations_id_fk"
		}).onDelete("cascade"),
]);

export const commissionInvoices = pgTable("commission_invoices", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	organizerId: text("organizer_id").notNull(),
	organizationId: uuid("organization_id"),
	amount: numeric({ precision: 12, scale:  2 }).notNull(),
	currency: text().default('PEN').notNull(),
	status: text().default('draft').notNull(),
	periodStart: timestamp("period_start", { mode: 'string' }),
	periodEnd: timestamp("period_end", { mode: 'string' }),
	notes: text(),
	issuedAt: timestamp("issued_at", { mode: 'string' }),
	paidAt: timestamp("paid_at", { mode: 'string' }),
	createdBy: text("created_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("commission_invoices_organizer_idx").using("btree", table.organizerId.asc().nullsLast().op("text_ops")),
	index("commission_invoices_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.organizerId],
			foreignColumns: [users.id],
			name: "commission_invoices_organizer_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "commission_invoices_organization_id_organizations_id_fk"
		}).onDelete("set null"),
]);

export const newsletterSubscribers = pgTable("newsletter_subscribers", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	email: text().notNull(),
	source: text().default('footer').notNull(),
	status: text().default('active').notNull(),
	ipAddress: text("ip_address"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("newsletter_subscribers_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("newsletter_subscribers_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
	unique("newsletter_subscribers_email_unique").on(table.email),
]);

export const testimonials = pgTable("testimonials", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	role: text().notNull(),
	company: text().notNull(),
	quote: text().notNull(),
	avatarUrl: text("avatar_url"),
	rating: integer().default(5).notNull(),
	isFeatured: boolean("is_featured").default(true).notNull(),
	sortOrder: integer("sort_order").default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("testimonials_featured_idx").using("btree", table.isFeatured.asc().nullsLast().op("bool_ops")),
	index("testimonials_sort_order_idx").using("btree", table.sortOrder.asc().nullsLast().op("int4_ops")),
]);

export const users = pgTable("users", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	email: text().notNull(),
	phone: text(),
	address: text(),
	emailVerified: boolean("email_verified").default(false).notNull(),
	image: text(),
	role: role().default('member').notNull(),
	organizationId: uuid("organization_id"),
	bio: text(),
	isActive: boolean("is_active").default(true).notNull(),
	twoFactorEnabled: boolean("two_factor_enabled").default(false).notNull(),
	lastSeenAt: timestamp("last_seen_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	signatureUrl: text("signature_url"),
	signatureTitle: text("signature_title"),
}, (table) => [
	index("users_organization_idx").using("btree", table.organizationId.asc().nullsLast().op("uuid_ops")),
	index("users_role_idx").using("btree", table.role.asc().nullsLast().op("enum_ops")),
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "users_organization_id_organizations_id_fk"
		}).onDelete("set null"),
	unique("users_email_unique").on(table.email),
]);

export const eventTypes = pgTable("event_types", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	categorySlug: text("category_slug").notNull(),
	slug: text().notNull(),
	label: text().notNull(),
	description: text(),
	isActive: boolean("is_active").default(true).notNull(),
	sortOrder: integer("sort_order").default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	createdBy: text("created_by"),
	labelEn: text("label_en"),
}, (table) => [
	index("event_types_category_idx").using("btree", table.categorySlug.asc().nullsLast().op("text_ops")),
	uniqueIndex("event_types_slug_category_unique_idx").using("btree", table.categorySlug.asc().nullsLast().op("text_ops"), table.slug.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "event_types_created_by_users_id_fk"
		}).onDelete("set null"),
]);

export const categorySlugAliases = pgTable("category_slug_aliases", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	categoryId: uuid("category_id").notNull(),
	slug: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("category_slug_aliases_category_idx").using("btree", table.categoryId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("category_slug_aliases_slug_unique_idx").using("btree", table.slug.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [categories.id],
			name: "category_slug_aliases_category_id_categories_id_fk"
		}).onDelete("cascade"),
]);

export const eventTypeSlugAliases = pgTable("event_type_slug_aliases", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	eventTypeId: uuid("event_type_id").notNull(),
	categorySlug: text("category_slug").notNull(),
	slug: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("event_type_slug_aliases_cat_slug_unique_idx").using("btree", table.categorySlug.asc().nullsLast().op("text_ops"), table.slug.asc().nullsLast().op("text_ops")),
	index("event_type_slug_aliases_type_idx").using("btree", table.eventTypeId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.eventTypeId],
			foreignColumns: [eventTypes.id],
			name: "event_type_slug_aliases_event_type_id_event_types_id_fk"
		}).onDelete("cascade"),
]);
