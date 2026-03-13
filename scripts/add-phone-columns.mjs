import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

async function main() {
  console.log("📱 Agregando columnas de teléfono...\n");

  await sql`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS phone text;
  `;
  console.log("✅ Columna users.phone lista");

  await sql`
    ALTER TABLE registrations
    ADD COLUMN IF NOT EXISTS contact_phone text;
  `;
  console.log("✅ Columna registrations.contact_phone lista");

  await sql`
    ALTER TABLE users
    DROP CONSTRAINT IF EXISTS users_phone_peru_format_check;
  `;

  await sql`
    ALTER TABLE users
    ADD CONSTRAINT users_phone_peru_format_check
    CHECK (phone IS NULL OR phone ~ '^\\+519[0-9]{8}$');
  `;
  console.log("✅ Validación CHECK para users.phone aplicada");

  await sql`
    ALTER TABLE registrations
    DROP CONSTRAINT IF EXISTS registrations_contact_phone_peru_format_check;
  `;

  await sql`
    ALTER TABLE registrations
    ADD CONSTRAINT registrations_contact_phone_peru_format_check
    CHECK (contact_phone IS NULL OR contact_phone ~ '^\\+519[0-9]{8}$');
  `;
  console.log("✅ Validación CHECK para registrations.contact_phone aplicada");

  await sql`
    UPDATE registrations r
    SET contact_phone = u.phone
    FROM users u
    WHERE r.user_id = u.id
      AND r.contact_phone IS NULL
      AND u.phone IS NOT NULL;
  `;
  console.log("✅ Snapshot inicial de teléfono completado");

  console.log("\n🎉 Migración de teléfonos completada.");
}

main().catch((err) => {
  console.error("❌ Error en migración:", err);
  process.exit(1);
});
