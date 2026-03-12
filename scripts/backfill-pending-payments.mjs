import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");

const sql = neon(databaseUrl);

try {
  const result = await sql`
    insert into payments (
      registration_id,
      user_id,
      amount,
      currency,
      method,
      status,
      notes
    )
    select
      r.id,
      r.user_id,
      1.00,
      'PEN',
      'Pendiente de selección',
      'pending',
      'Pago pendiente creado por backfill histórico'
    from registrations r
    left join payments p
      on p.registration_id = r.id
      and p.user_id = r.user_id
    where p.id is null
      and r.status in ('registered', 'checked_in')
    returning id, registration_id
  `;

  console.log(`✓ Pending payments backfilled: ${result.length}`);

  const [summary] = await sql`
    select
      count(*)::int as total_payments,
      count(*) filter (where status = 'pending')::int as pending_payments,
      count(*) filter (where status = 'approved')::int as approved_payments
    from payments
  `;

  console.log("Current payment summary:");
  console.log(`- Total: ${summary.total_payments}`);
  console.log(`- Pending: ${summary.pending_payments}`);
  console.log(`- Paid(approved): ${summary.approved_payments}`);
} catch (error) {
  console.error("Error backfilling pending payments:", error.message);
  process.exit(1);
}
