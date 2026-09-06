export function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

export function randomInviteCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export type SignupIntentPayload =
  | { type: "member" }
  | { type: "organizer"; inviteCode?: string }
  | { type: "entity_admin"; orgName: string }
  | { type: "platform_owner" };

export function serializeSignupIntent(payload: SignupIntentPayload): string {
  return JSON.stringify(payload);
}

export function parseSignupIntent(raw: string): SignupIntentPayload {
  try {
    const parsed = JSON.parse(raw) as SignupIntentPayload;
    if (parsed.type === "entity_admin" && parsed.orgName?.trim()) return parsed;
    if (parsed.type === "organizer") {
      const inviteCode = parsed.inviteCode?.trim();
      return inviteCode
        ? { type: "organizer", inviteCode }
        : { type: "organizer" };
    }
    if (parsed.type === "member") return parsed;
    if (parsed.type === "platform_owner") return parsed;
  } catch {
    // legacy plain string
  }
  if (raw === "organizer") return { type: "member" };
  return { type: "member" };
}
