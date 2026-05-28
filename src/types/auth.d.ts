import "better-auth";

declare module "better-auth" {
  interface User {
    role: "super_admin" | "admin" | "organizer" | "member";
    bio?: string | null;
    phone?: string | null;
    isActive?: boolean;
    lastSeenAt?: Date | null;
  }
}
