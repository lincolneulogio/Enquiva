import { describe, expect, it } from "vitest";
import { getDefaultPermissionMatrix, type Permission } from "@/lib/auth/rbac";
import { enabledChatTools } from "./chat-tool-policy";

function grantedFor(role: "member" | "scanner" | "organizer" | "admin"): Set<Permission> {
  const matrix = getDefaultPermissionMatrix();
  return new Set(
    (Object.keys(matrix[role]) as Permission[]).filter((permission) => matrix[role][permission]),
  );
}

describe("enabledChatTools", () => {
  it("no da tools de staff al miembro", () => {
    const tools = enabledChatTools(grantedFor("member"), "member");
    expect(tools.has("getMyTickets")).toBe(true);
    expect(tools.has("getPaymentStatus")).toBe(true);
    expect(tools.has("getRegistrationsList")).toBe(false);
    expect(tools.has("getEventStats")).toBe(false);
    expect(tools.has("getUsersList")).toBe(false);
    expect(tools.has("sendMassNotification")).toBe(false);
  });

  it("el scanner ve check-in de entidad, no analítica ni usuarios", () => {
    const tools = enabledChatTools(grantedFor("scanner"), "scanner");
    expect(tools.has("getCheckInStats")).toBe(true);
    expect(tools.has("getRegistrationsList")).toBe(true);
    expect(tools.has("getEventStats")).toBe(false);
    expect(tools.has("getUsersList")).toBe(false);
    expect(tools.has("getMyPlanBilling")).toBe(false);
    expect(tools.has("sendMassNotification")).toBe(false);
  });

  it("el organizador no aprueba pagos ajenos desde el chat de usuarios", () => {
    const tools = enabledChatTools(grantedFor("organizer"), "organizer");
    expect(tools.has("getUsersList")).toBe(false);
    expect(tools.has("getEventStats")).toBe(true);
    expect(tools.has("sendMassNotification")).toBe(true);
  });
});
