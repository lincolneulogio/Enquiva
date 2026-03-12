import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);

async function main() {
  console.log("🚌 Migrando tablas de transporte...\n");

  // 1. Enum de estado para bookings
  await sql`
    DO $$ BEGIN
      CREATE TYPE transport_booking_status AS ENUM ('pending', 'confirmed', 'cancelled');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `;
  console.log("✅ Enum transport_booking_status creado");

  // 2. Columna has_transport en events
  await sql`
    ALTER TABLE events
    ADD COLUMN IF NOT EXISTS has_transport boolean NOT NULL DEFAULT false;
  `;
  console.log("✅ Columna has_transport agregada a events");

  // 3. Columna transport_booking_id en payments (nullable)
  await sql`
    ALTER TABLE payments
    ADD COLUMN IF NOT EXISTS transport_booking_id uuid;
  `;
  console.log("✅ Columna transport_booking_id agregada a payments");

  // 4. Tabla transport_routes
  await sql`
    CREATE TABLE IF NOT EXISTS transport_routes (
      id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      event_id     uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      name         text NOT NULL,
      departure_point text NOT NULL,
      departure_time  timestamp NOT NULL,
      return_time     timestamp,
      price_per_seat  numeric(10,2) NOT NULL DEFAULT 0,
      total_seats     integer NOT NULL DEFAULT 0,
      description     text,
      is_active       boolean NOT NULL DEFAULT true,
      created_at      timestamp NOT NULL DEFAULT now(),
      updated_at      timestamp NOT NULL DEFAULT now()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS transport_routes_event_idx ON transport_routes(event_id);`;
  console.log("✅ Tabla transport_routes creada");

  // 5. Tabla transport_bookings
  await sql`
    CREATE TABLE IF NOT EXISTS transport_bookings (
      id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      route_id        uuid NOT NULL REFERENCES transport_routes(id) ON DELETE CASCADE,
      registration_id uuid NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
      user_id         text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      seats           integer NOT NULL DEFAULT 1,
      status          transport_booking_status NOT NULL DEFAULT 'pending',
      notes           text,
      booked_at       timestamp NOT NULL DEFAULT now(),
      updated_at      timestamp NOT NULL DEFAULT now()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS transport_bookings_route_idx ON transport_bookings(route_id);`;
  await sql`CREATE INDEX IF NOT EXISTS transport_bookings_registration_idx ON transport_bookings(registration_id);`;
  console.log("✅ Tabla transport_bookings creada");

  // 6. FK transport_booking_id en payments
  await sql`
    DO $$ BEGIN
      ALTER TABLE payments
        ADD CONSTRAINT payments_transport_booking_id_fkey
        FOREIGN KEY (transport_booking_id) REFERENCES transport_bookings(id) ON DELETE SET NULL;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `;
  console.log("✅ FK transport_booking_id en payments agregada");

  console.log("\n🎉 Migración completada exitosamente.");
}

main().catch((err) => {
  console.error("❌ Error en migración:", err);
  process.exit(1);
});
