ALTER TABLE "transport_routes"
  ADD COLUMN IF NOT EXISTS "driver_name" text,
  ADD COLUMN IF NOT EXISTS "vehicle_plate" text,
  ADD COLUMN IF NOT EXISTS "is_round_trip" boolean DEFAULT true NOT NULL,
  ADD COLUMN IF NOT EXISTS "pending_hold_hours" integer DEFAULT 24 NOT NULL;

ALTER TABLE "transport_stops"
  ADD COLUMN IF NOT EXISTS "sort_order" integer DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS "estimated_arrival_time" timestamp,
  ADD COLUMN IF NOT EXISTS "max_seats" integer;

CREATE INDEX IF NOT EXISTS "transport_stops_route_sort_idx"
  ON "transport_stops" ("route_id", "sort_order");

CREATE INDEX IF NOT EXISTS "transport_bookings_status_booked_idx"
  ON "transport_bookings" ("status", "booked_at");
