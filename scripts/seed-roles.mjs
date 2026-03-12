import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to seed roles");
}

const sql = neon(databaseUrl);

const defaultRoles = [
  {
    name: "super_admin",
    label: "Super Admin",
    description: "Full platform access: manage users, events and all settings.",
    color: "purple",
  },
  {
    name: "admin",
    label: "Administrador",
    description: "Oversee operations, payments and participant workflows.",
    color: "rose",
  },
  {
    name: "organizer",
    label: "Organizer",
    description: "Create and manage events, view attendees and analytics.",
    color: "blue",
  },
  {
    name: "member",
    label: "Cliente",
    description: "Browse and register for events in the community.",
    color: "green",
  },
];

for (const role of defaultRoles) {
  await sql`
    insert into roles (name, label, description, color)
    values (${role.name}, ${role.label}, ${role.description}, ${role.color})
    on conflict (name) do update
    set
      label = excluded.label,
      description = excluded.description,
      color = excluded.color,
      updated_at = now()
  `;
}

const seededRoles = await sql`
  select name, label, color
  from roles
  order by name asc
`;

console.log(`Roles seeded successfully: ${seededRoles.length}`);
for (const role of seededRoles) {
  console.log(`- ${role.name}: ${role.label} (${role.color})`);
}
