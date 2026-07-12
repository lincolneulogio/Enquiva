/** Roles de plataforma — único seed permitido en arranque limpio. */
export const DEFAULT_ROLES = [
  {
    name: "super_admin",
    label: "Super Admin",
    description: "Full platform access: manage users, events and all settings.",
    color: "purple",
  },
  {
    name: "admin",
    label: "Admin",
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
    label: "Member",
    description: "Browse and register for events in the community.",
    color: "green",
  },
] as const;

export type DefaultRoleName = (typeof DEFAULT_ROLES)[number]["name"];
