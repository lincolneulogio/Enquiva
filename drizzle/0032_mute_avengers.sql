CREATE TYPE "public"."payment_method_type" AS ENUM('yape', 'plin', 'cash', 'culqi');--> statement-breakpoint
CREATE TYPE "public"."transport_booking_status" AS ENUM('pending', 'confirmed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."broadcast_delivery_channel" AS ENUM('email', 'in_app', 'pusher');--> statement-breakpoint
CREATE TYPE "public"."broadcast_job_status" AS ENUM('pending', 'retry', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."platform_transaction_type" AS ENUM('subscription', 'commission', 'adjustment');--> statement-breakpoint
CREATE TYPE "public"."subscription_payment_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('active', 'cancelled', 'past_due', 'trialing');--> statement-breakpoint
CREATE TYPE "public"."organization_member_role" AS ENUM('owner', 'organizer', 'member', 'scanner');--> statement-breakpoint
CREATE TYPE "public"."organization_member_status" AS ENUM('active', 'pending', 'rejected');--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'organizer_request';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'organizer_approved';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'organizer_rejected';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'subscription_alert';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'transport_alert';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'finance_digest';--> statement-breakpoint
ALTER TYPE "public"."role" ADD VALUE 'scanner';--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"role_name" text NOT NULL,
	"permission" text NOT NULL,
	"allowed" boolean DEFAULT true NOT NULL,
	"updated_by" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "two_factor" (
	"id" text PRIMARY KEY NOT NULL,
	"secret" text NOT NULL,
	"backup_codes" text NOT NULL,
	"user_id" text NOT NULL,
	"verified" boolean DEFAULT true,
	"failed_verification_count" integer DEFAULT 0,
	"locked_until" timestamp
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid,
	"slug" text NOT NULL,
	"label" text NOT NULL,
	"label_en" text,
	"description" text,
	"color_class" text DEFAULT 'bg-gray-100 text-gray-800' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text
);
--> statement-breakpoint
CREATE TABLE "category_slug_aliases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_type_slug_aliases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_type_id" uuid NOT NULL,
	"category_slug" text NOT NULL,
	"slug" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_slug" text NOT NULL,
	"slug" text NOT NULL,
	"label" text NOT NULL,
	"label_en" text,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text
);
--> statement-breakpoint
CREATE TABLE "registration_guests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_registration_id" uuid NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ticket_scan_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"scanned_by" text,
	"ip_address" text,
	"user_agent" text,
	"result" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_payment_methods" (
	"event_id" uuid NOT NULL,
	"payment_method_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_methods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organizer_id" text,
	"type" "payment_method_type" NOT NULL,
	"label" text NOT NULL,
	"qr_code_url" text,
	"phone" text,
	"holder_name" text NOT NULL,
	"culqi_public_key" text,
	"culqi_secret_key" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transport_bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"route_id" uuid NOT NULL,
	"registration_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"seats" integer DEFAULT 1 NOT NULL,
	"status" "transport_booking_status" DEFAULT 'pending' NOT NULL,
	"notes" text,
	"stop_id" uuid,
	"booked_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transport_routes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"name" text NOT NULL,
	"departure_point" text NOT NULL,
	"departure_time" timestamp NOT NULL,
	"return_time" timestamp,
	"price_per_seat" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total_seats" integer DEFAULT 0 NOT NULL,
	"description" text,
	"driver_name" text,
	"vehicle_plate" text,
	"is_round_trip" boolean DEFAULT true NOT NULL,
	"pending_hold_hours" integer DEFAULT 24 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transport_stops" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"route_id" uuid NOT NULL,
	"name" text NOT NULL,
	"latitude" text,
	"longitude" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"estimated_arrival_time" timestamp,
	"max_seats" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" text,
	"actor_name" text NOT NULL,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"details" text,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "broadcast_job_deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"recipient_id" text NOT NULL,
	"channel" "broadcast_delivery_channel" NOT NULL,
	"status" text DEFAULT 'processing' NOT NULL,
	"attempts" integer DEFAULT 1 NOT NULL,
	"locked_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"error_message" text
);
--> statement-breakpoint
CREATE TABLE "broadcast_job_recipients" (
	"job_id" uuid NOT NULL,
	"recipient_id" text NOT NULL,
	"name" text,
	"email" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "broadcast_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"sender_id" text NOT NULL,
	"subject" text NOT NULL,
	"message" text NOT NULL,
	"recipient_status" text NOT NULL,
	"channels" jsonb NOT NULL,
	"locale" text DEFAULT 'es' NOT NULL,
	"status" "broadcast_job_status" DEFAULT 'pending' NOT NULL,
	"total_recipients" integer DEFAULT 0 NOT NULL,
	"success_count" integer DEFAULT 0 NOT NULL,
	"failure_count" integer DEFAULT 0 NOT NULL,
	"error_message" text,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 5 NOT NULL,
	"next_attempt_at" timestamp DEFAULT now() NOT NULL,
	"locked_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "broadcast_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid,
	"event_id" uuid NOT NULL,
	"sender_id" text NOT NULL,
	"subject" text NOT NULL,
	"message" text NOT NULL,
	"recipient_count" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "broadcast_logs_job_id_unique" UNIQUE("job_id")
);
--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "push_subscriptions_endpoint_unique" UNIQUE("endpoint")
);
--> statement-breakpoint
CREATE TABLE "plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"price_monthly" numeric(10, 2) DEFAULT '0' NOT NULL,
	"currency" text DEFAULT 'PEN' NOT NULL,
	"max_active_events" integer,
	"max_attendees_per_event" integer,
	"commission_percent" numeric(5, 2) DEFAULT '0' NOT NULL,
	"commission_per_registration" numeric(10, 2) DEFAULT '0' NOT NULL,
	"max_broadcasts_per_month" integer,
	"max_ai_messages_per_month" integer,
	"max_organizers" integer,
	"feature_culqi" boolean DEFAULT false NOT NULL,
	"feature_transport" boolean DEFAULT false NOT NULL,
	"feature_ai" boolean DEFAULT false NOT NULL,
	"feature_exports" boolean DEFAULT false NOT NULL,
	"feature_custom_branding" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "plans_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "platform_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "platform_transaction_type" NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"currency" text DEFAULT 'PEN' NOT NULL,
	"user_id" text,
	"payment_id" uuid,
	"subscription_id" uuid,
	"subscription_payment_id" uuid,
	"description" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscription_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"plan_id" uuid NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"currency" text DEFAULT 'PEN' NOT NULL,
	"method" text NOT NULL,
	"reference" text,
	"receipt_url" text,
	"receipt_file_name" text,
	"status" "subscription_payment_status" DEFAULT 'pending' NOT NULL,
	"gateway_provider" text,
	"gateway_charge_id" text,
	"notes" text,
	"verified_by" text,
	"verified_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"organization_id" uuid,
	"plan_id" uuid NOT NULL,
	"pending_plan_id" uuid,
	"pending_plan_effective_at" timestamp,
	"status" "subscription_status" DEFAULT 'active' NOT NULL,
	"current_period_start" timestamp DEFAULT now() NOT NULL,
	"current_period_end" timestamp NOT NULL,
	"cancelled_at" timestamp,
	"culqi_subscription_id" text,
	"auto_renew_enabled" boolean DEFAULT false NOT NULL,
	"culqi_customer_id" text,
	"culqi_card_id" text,
	"culqi_card_last_four" text,
	"culqi_card_brand" text,
	"renewal_reminder_sent_at" timestamp,
	"auto_renew_last_attempt_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"role" "organization_member_role" NOT NULL,
	"status" "organization_member_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"invite_code" text NOT NULL,
	"owner_id" text NOT NULL,
	"logo_url" text,
	"accent_color" text,
	"branding_enabled" boolean DEFAULT false NOT NULL,
	"whatsapp_number" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug"),
	CONSTRAINT "organizations_invite_code_unique" UNIQUE("invite_code")
);
--> statement-breakpoint
CREATE TABLE "platform_settings" (
	"id" text PRIMARY KEY DEFAULT 'default' NOT NULL,
	"organization_name" text NOT NULL,
	"support_email" text NOT NULL,
	"public_contact_email" text DEFAULT 'hola@enquiva.app' NOT NULL,
	"public_location" text DEFAULT '' NOT NULL,
	"social_facebook" text DEFAULT '' NOT NULL,
	"social_instagram" text DEFAULT '' NOT NULL,
	"social_x" text DEFAULT '' NOT NULL,
	"social_linkedin" text DEFAULT '' NOT NULL,
	"social_whatsapp" text DEFAULT '' NOT NULL,
	"social_youtube" text DEFAULT '' NOT NULL,
	"default_accent_color" text DEFAULT 'amber' NOT NULL,
	"maintenance_mode" boolean DEFAULT false NOT NULL,
	"maintenance_message" text DEFAULT '' NOT NULL,
	"maintenance_starts_at" timestamp,
	"maintenance_ends_at" timestamp,
	"announcement_enabled" boolean DEFAULT false NOT NULL,
	"announcement_message" text DEFAULT '' NOT NULL,
	"announcement_severity" text DEFAULT 'info' NOT NULL,
	"announcement_dismissible" boolean DEFAULT true NOT NULL,
	"announcement_starts_at" timestamp,
	"announcement_ends_at" timestamp,
	"announcement_event_at" timestamp,
	"event_banner_enabled" boolean DEFAULT false NOT NULL,
	"event_banner_mode" text DEFAULT 'auto' NOT NULL,
	"event_banner_criteria" text DEFAULT 'auto' NOT NULL,
	"event_banner_pinned_event_id" uuid,
	"event_banner_custom_badge" text DEFAULT '' NOT NULL,
	"event_banner_custom_text" text DEFAULT '' NOT NULL,
	"terms_url" text DEFAULT '' NOT NULL,
	"privacy_url" text DEFAULT '' NOT NULL,
	"default_locale" text DEFAULT 'es' NOT NULL,
	"default_timezone" text DEFAULT 'America/Lima' NOT NULL,
	"smtp_use_custom" boolean DEFAULT false NOT NULL,
	"smtp_host" text DEFAULT '' NOT NULL,
	"smtp_port" integer DEFAULT 587 NOT NULL,
	"smtp_user" text DEFAULT '' NOT NULL,
	"smtp_pass_encrypted" text DEFAULT '' NOT NULL,
	"smtp_from_email" text DEFAULT '' NOT NULL,
	"smtp_from_name" text DEFAULT '' NOT NULL,
	"push_notification_title" text DEFAULT '' NOT NULL,
	"alert_new_payments" boolean DEFAULT true NOT NULL,
	"alert_new_registrations" boolean DEFAULT true NOT NULL,
	"alert_transport_capacity" boolean DEFAULT true NOT NULL,
	"alert_organizer_requests" boolean DEFAULT true NOT NULL,
	"alert_event_published" boolean DEFAULT true NOT NULL,
	"alert_subscription_past_due" boolean DEFAULT true NOT NULL,
	"alert_daily_finance_summary" boolean DEFAULT false NOT NULL,
	"impact_card_1_title" text DEFAULT '5+ años impulsando' NOT NULL,
	"impact_card_1_subtitle" text DEFAULT 'Eventos de tecnología, negocios e innovación en Latinoamérica.' NOT NULL,
	"impact_card_1_image_url" text DEFAULT '' NOT NULL,
	"impact_card_2_title" text DEFAULT 'Más de 250 empresas' NOT NULL,
	"impact_card_2_subtitle" text DEFAULT 'Ya patrocinan y reclutan talento activamente en nuestros eventos.' NOT NULL,
	"impact_card_2_image_url" text DEFAULT '' NOT NULL,
	"impact_satisfaction_rate" text DEFAULT '99.8%' NOT NULL,
	"certificate_seal_url" text DEFAULT '/images/enquiva-verified-seal.png' NOT NULL,
	"updated_by" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"title" text,
	"path_context" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid,
	"message_id" text NOT NULL,
	"user_id" text NOT NULL,
	"rating" integer NOT NULL,
	"query" text,
	"citations" jsonb,
	"intent" text,
	"tools_used" jsonb,
	"model_id" text,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"citations" jsonb,
	"intent" text,
	"model_id" text,
	"tools_used" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_chunks" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"text" text NOT NULL,
	"kind" text NOT NULL,
	"module_id" integer,
	"module_name" text,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"embedding" jsonb,
	"embedding_model" text,
	"synced_at" timestamp DEFAULT now() NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "commission_invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organizer_id" text NOT NULL,
	"organization_id" uuid,
	"amount" numeric(12, 2) NOT NULL,
	"currency" text DEFAULT 'PEN' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"period_start" timestamp,
	"period_end" timestamp,
	"notes" text,
	"issued_at" timestamp,
	"paid_at" timestamp,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "newsletter_subscribers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"source" text DEFAULT 'footer' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"ip_address" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "newsletter_subscribers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "testimonials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"company" text NOT NULL,
	"quote" text NOT NULL,
	"avatar_url" text,
	"rating" integer DEFAULT 5 NOT NULL,
	"is_featured" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_logs" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "audit_logs" CASCADE;--> statement-breakpoint
DROP INDEX "tickets_registration_idx";--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "category" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "category" SET DEFAULT 'other';--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "currency" SET DEFAULT 'PEN';--> statement-breakpoint
ALTER TABLE "registrations" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "issuer" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "organization_id" uuid;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "event_type_id" uuid;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "schedules" jsonb;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "latitude" double precision;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "longitude" double precision;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "price" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "has_transport" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "has_certificate" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "certificate_title" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "certificate_price" numeric(10, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "hold_minutes_card" integer DEFAULT 30 NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "hold_hours_manual" integer DEFAULT 24 NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "near_event_window_hours" integer DEFAULT 48 NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "near_event_hold_minutes" integer DEFAULT 15 NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "sales_cutoff_hours_before" integer;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "view_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "transport_booking_id" uuid;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "gateway_provider" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "gateway_charge_id" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "gateway_order_id" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "gateway_status" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "platform_fee" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "registrations" ADD COLUMN "guest_id" uuid;--> statement-breakpoint
ALTER TABLE "registrations" ADD COLUMN "contact_phone" text;--> statement-breakpoint
ALTER TABLE "registrations" ADD COLUMN "parent_registration_id" uuid;--> statement-breakpoint
ALTER TABLE "registrations" ADD COLUMN "hold_expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "registrations" ADD COLUMN "hold_reminder_sent_at" timestamp;--> statement-breakpoint
ALTER TABLE "registrations" ADD COLUMN "selected_schedule_id" text;--> statement-breakpoint
ALTER TABLE "registrations" ADD COLUMN "selected_schedule_label" text;--> statement-breakpoint
ALTER TABLE "registrations" ADD COLUMN "wants_certificate" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "registrations" ADD COLUMN "certificate_code" text;--> statement-breakpoint
ALTER TABLE "registrations" ADD COLUMN "certificate_issued_at" timestamp;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "signature" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "signature_url" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "signature_title" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "organization_id" uuid;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "two_factor_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_name_roles_name_fk" FOREIGN KEY ("role_name") REFERENCES "public"."roles"("name") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "two_factor" ADD CONSTRAINT "two_factor_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_slug_aliases" ADD CONSTRAINT "category_slug_aliases_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_type_slug_aliases" ADD CONSTRAINT "event_type_slug_aliases_event_type_id_event_types_id_fk" FOREIGN KEY ("event_type_id") REFERENCES "public"."event_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_types" ADD CONSTRAINT "event_types_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration_guests" ADD CONSTRAINT "registration_guests_parent_registration_id_registrations_id_fk" FOREIGN KEY ("parent_registration_id") REFERENCES "public"."registrations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_scan_logs" ADD CONSTRAINT "ticket_scan_logs_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_payment_methods" ADD CONSTRAINT "event_payment_methods_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_payment_methods" ADD CONSTRAINT "event_payment_methods_payment_method_id_payment_methods_id_fk" FOREIGN KEY ("payment_method_id") REFERENCES "public"."payment_methods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_organizer_id_users_id_fk" FOREIGN KEY ("organizer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transport_bookings" ADD CONSTRAINT "transport_bookings_route_id_transport_routes_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."transport_routes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transport_bookings" ADD CONSTRAINT "transport_bookings_registration_id_registrations_id_fk" FOREIGN KEY ("registration_id") REFERENCES "public"."registrations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transport_bookings" ADD CONSTRAINT "transport_bookings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transport_bookings" ADD CONSTRAINT "transport_bookings_stop_id_transport_stops_id_fk" FOREIGN KEY ("stop_id") REFERENCES "public"."transport_stops"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transport_routes" ADD CONSTRAINT "transport_routes_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transport_stops" ADD CONSTRAINT "transport_stops_route_id_transport_routes_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."transport_routes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "broadcast_job_deliveries" ADD CONSTRAINT "broadcast_job_deliveries_job_id_broadcast_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."broadcast_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "broadcast_job_deliveries" ADD CONSTRAINT "broadcast_job_deliveries_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "broadcast_job_recipients" ADD CONSTRAINT "broadcast_job_recipients_job_id_broadcast_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."broadcast_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "broadcast_job_recipients" ADD CONSTRAINT "broadcast_job_recipients_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "broadcast_jobs" ADD CONSTRAINT "broadcast_jobs_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "broadcast_jobs" ADD CONSTRAINT "broadcast_jobs_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "broadcast_logs" ADD CONSTRAINT "broadcast_logs_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "broadcast_logs" ADD CONSTRAINT "broadcast_logs_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_transactions" ADD CONSTRAINT "platform_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_transactions" ADD CONSTRAINT "platform_transactions_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_transactions" ADD CONSTRAINT "platform_transactions_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_transactions" ADD CONSTRAINT "platform_transactions_subscription_payment_id_subscription_payments_id_fk" FOREIGN KEY ("subscription_payment_id") REFERENCES "public"."subscription_payments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_payments" ADD CONSTRAINT "subscription_payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_payments" ADD CONSTRAINT "subscription_payments_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_payments" ADD CONSTRAINT "subscription_payments_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_pending_plan_id_plans_id_fk" FOREIGN KEY ("pending_plan_id") REFERENCES "public"."plans"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_settings" ADD CONSTRAINT "platform_settings_event_banner_pinned_event_id_events_id_fk" FOREIGN KEY ("event_banner_pinned_event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_settings" ADD CONSTRAINT "platform_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_conversations" ADD CONSTRAINT "chat_conversations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_feedback" ADD CONSTRAINT "chat_feedback_conversation_id_chat_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."chat_conversations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_feedback" ADD CONSTRAINT "chat_feedback_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_conversation_id_chat_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."chat_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commission_invoices" ADD CONSTRAINT "commission_invoices_organizer_id_users_id_fk" FOREIGN KEY ("organizer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commission_invoices" ADD CONSTRAINT "commission_invoices_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "role_permissions_role_permission_unique_idx" ON "role_permissions" USING btree ("role_name","permission");--> statement-breakpoint
CREATE INDEX "role_permissions_role_idx" ON "role_permissions" USING btree ("role_name");--> statement-breakpoint
CREATE INDEX "categories_organization_idx" ON "categories" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "categories_org_slug_unique_idx" ON "categories" USING btree ("organization_id","slug") WHERE "categories"."organization_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "categories_platform_slug_unique_idx" ON "categories" USING btree ("slug") WHERE "categories"."organization_id" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "category_slug_aliases_slug_unique_idx" ON "category_slug_aliases" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "category_slug_aliases_category_idx" ON "category_slug_aliases" USING btree ("category_id");--> statement-breakpoint
CREATE UNIQUE INDEX "event_type_slug_aliases_cat_slug_unique_idx" ON "event_type_slug_aliases" USING btree ("category_slug","slug");--> statement-breakpoint
CREATE INDEX "event_type_slug_aliases_type_idx" ON "event_type_slug_aliases" USING btree ("event_type_id");--> statement-breakpoint
CREATE INDEX "event_types_category_idx" ON "event_types" USING btree ("category_slug");--> statement-breakpoint
CREATE UNIQUE INDEX "event_types_slug_category_unique_idx" ON "event_types" USING btree ("category_slug","slug");--> statement-breakpoint
CREATE INDEX "registration_guests_parent_idx" ON "registration_guests" USING btree ("parent_registration_id");--> statement-breakpoint
CREATE INDEX "ticket_scan_logs_ticket_idx" ON "ticket_scan_logs" USING btree ("ticket_id");--> statement-breakpoint
CREATE UNIQUE INDEX "event_payment_methods_unique_idx" ON "event_payment_methods" USING btree ("event_id","payment_method_id");--> statement-breakpoint
CREATE INDEX "payment_methods_organizer_idx" ON "payment_methods" USING btree ("organizer_id");--> statement-breakpoint
CREATE INDEX "transport_bookings_route_idx" ON "transport_bookings" USING btree ("route_id");--> statement-breakpoint
CREATE INDEX "transport_bookings_registration_idx" ON "transport_bookings" USING btree ("registration_id");--> statement-breakpoint
CREATE INDEX "transport_bookings_stop_idx" ON "transport_bookings" USING btree ("stop_id");--> statement-breakpoint
CREATE INDEX "transport_bookings_status_booked_idx" ON "transport_bookings" USING btree ("status","booked_at");--> statement-breakpoint
CREATE INDEX "transport_routes_event_idx" ON "transport_routes" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "transport_stops_route_idx" ON "transport_stops" USING btree ("route_id");--> statement-breakpoint
CREATE INDEX "transport_stops_route_sort_idx" ON "transport_stops" USING btree ("route_id","sort_order");--> statement-breakpoint
CREATE INDEX "activity_logs_actor_idx" ON "activity_logs" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "activity_logs_action_idx" ON "activity_logs" USING btree ("action");--> statement-breakpoint
CREATE UNIQUE INDEX "broadcast_job_deliveries_job_recipient_channel_unique_idx" ON "broadcast_job_deliveries" USING btree ("job_id","recipient_id","channel");--> statement-breakpoint
CREATE INDEX "broadcast_job_deliveries_job_status_idx" ON "broadcast_job_deliveries" USING btree ("job_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "broadcast_job_recipients_job_recipient_unique_idx" ON "broadcast_job_recipients" USING btree ("job_id","recipient_id");--> statement-breakpoint
CREATE INDEX "broadcast_jobs_status_next_attempt_idx" ON "broadcast_jobs" USING btree ("status","next_attempt_at");--> statement-breakpoint
CREATE INDEX "broadcast_jobs_sender_idx" ON "broadcast_jobs" USING btree ("sender_id");--> statement-breakpoint
CREATE INDEX "broadcast_logs_event_idx" ON "broadcast_logs" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "push_subscriptions_user_idx" ON "push_subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "plans_active_idx" ON "plans" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "plans_sort_idx" ON "plans" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "platform_transactions_type_idx" ON "platform_transactions" USING btree ("type");--> statement-breakpoint
CREATE INDEX "platform_transactions_user_idx" ON "platform_transactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "platform_transactions_created_idx" ON "platform_transactions" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "platform_transactions_subscription_payment_unique_idx" ON "platform_transactions" USING btree ("subscription_payment_id") WHERE "platform_transactions"."subscription_payment_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "subscription_payments_user_idx" ON "subscription_payments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "subscription_payments_status_idx" ON "subscription_payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "subscription_payments_plan_idx" ON "subscription_payments" USING btree ("plan_id");--> statement-breakpoint
CREATE UNIQUE INDEX "subscription_payments_gateway_charge_uidx" ON "subscription_payments" USING btree ("gateway_charge_id") WHERE "subscription_payments"."gateway_charge_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "subscriptions_org_idx" ON "subscriptions" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "subscriptions_plan_idx" ON "subscriptions" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "subscriptions_pending_plan_idx" ON "subscriptions" USING btree ("pending_plan_id","pending_plan_effective_at");--> statement-breakpoint
CREATE INDEX "subscriptions_status_idx" ON "subscriptions" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "subscriptions_org_user_unique_idx" ON "subscriptions" USING btree ("organization_id","user_id") WHERE "subscriptions"."organization_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "subscriptions_user_without_org_unique_idx" ON "subscriptions" USING btree ("user_id") WHERE "subscriptions"."organization_id" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "organization_members_org_user_unique" ON "organization_members" USING btree ("organization_id","user_id");--> statement-breakpoint
CREATE INDEX "organization_members_user_idx" ON "organization_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "organization_members_org_idx" ON "organization_members" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "organizations_owner_idx" ON "organizations" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "organizations_invite_code_idx" ON "organizations" USING btree ("invite_code");--> statement-breakpoint
CREATE INDEX "chat_conversations_user_idx" ON "chat_conversations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "chat_conversations_updated_idx" ON "chat_conversations" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "chat_feedback_user_idx" ON "chat_feedback" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "chat_feedback_message_idx" ON "chat_feedback" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "chat_messages_conversation_idx" ON "chat_messages" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "knowledge_chunks_kind_idx" ON "knowledge_chunks" USING btree ("kind");--> statement-breakpoint
CREATE INDEX "commission_invoices_organizer_idx" ON "commission_invoices" USING btree ("organizer_id");--> statement-breakpoint
CREATE INDEX "commission_invoices_status_idx" ON "commission_invoices" USING btree ("status");--> statement-breakpoint
CREATE INDEX "newsletter_subscribers_status_idx" ON "newsletter_subscribers" USING btree ("status");--> statement-breakpoint
CREATE INDEX "newsletter_subscribers_created_at_idx" ON "newsletter_subscribers" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "testimonials_featured_idx" ON "testimonials" USING btree ("is_featured");--> statement-breakpoint
CREATE INDEX "testimonials_sort_order_idx" ON "testimonials" USING btree ("sort_order");--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_event_type_id_event_types_id_fk" FOREIGN KEY ("event_type_id") REFERENCES "public"."event_types"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_transport_booking_id_transport_bookings_id_fk" FOREIGN KEY ("transport_booking_id") REFERENCES "public"."transport_bookings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_guest_id_registration_guests_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."registration_guests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_parent_registration_id_registrations_id_fk" FOREIGN KEY ("parent_registration_id") REFERENCES "public"."registrations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "events_organization_idx" ON "events" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "events_event_type_idx" ON "events" USING btree ("event_type_id");--> statement-breakpoint
CREATE INDEX "events_status_date_idx" ON "events" USING btree ("status","date");--> statement-breakpoint
CREATE INDEX "events_featured_status_date_idx" ON "events" USING btree ("is_featured","status","date");--> statement-breakpoint
CREATE INDEX "notifications_user_unread_idx" ON "notifications" USING btree ("user_id") WHERE "notifications"."read" = false;--> statement-breakpoint
CREATE INDEX "payments_user_idx" ON "payments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "payments_gateway_charge_idx" ON "payments" USING btree ("gateway_charge_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_gateway_charge_uidx" ON "payments" USING btree ("gateway_charge_id") WHERE "payments"."gateway_charge_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "payments_gateway_order_unique_idx" ON "payments" USING btree ("gateway_order_id") WHERE "payments"."gateway_order_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "payments_transport_booking_idx" ON "payments" USING btree ("transport_booking_id");--> statement-breakpoint
CREATE UNIQUE INDEX "registrations_event_user_unique_idx" ON "registrations" USING btree ("event_id","user_id") WHERE "registrations"."user_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "registrations_event_guest_unique_idx" ON "registrations" USING btree ("event_id","guest_id") WHERE "registrations"."guest_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "registrations_hold_expires_idx" ON "registrations" USING btree ("hold_expires_at");--> statement-breakpoint
CREATE INDEX "registrations_parent_idx" ON "registrations" USING btree ("parent_registration_id");--> statement-breakpoint
CREATE INDEX "registrations_event_status_idx" ON "registrations" USING btree ("event_id","status");--> statement-breakpoint
CREATE INDEX "registrations_guest_idx" ON "registrations" USING btree ("guest_id");--> statement-breakpoint
CREATE INDEX "registrations_selected_schedule_idx" ON "registrations" USING btree ("event_id","selected_schedule_id");--> statement-breakpoint
CREATE UNIQUE INDEX "registrations_certificate_code_unique_idx" ON "registrations" USING btree ("certificate_code") WHERE "registrations"."certificate_code" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "tickets_registration_unique_idx" ON "tickets" USING btree ("registration_id");--> statement-breakpoint
CREATE INDEX "users_organization_idx" ON "users" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
ALTER TABLE "registrations" DROP COLUMN "qr_code";--> statement-breakpoint
ALTER TABLE "tickets" DROP COLUMN "qr_code";--> statement-breakpoint
DROP TYPE "public"."event_category";