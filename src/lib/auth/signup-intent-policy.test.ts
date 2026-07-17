import { describe, expect, it } from "vitest";
import { canUsePlatformOwnerSignupIntent } from "./signup-intent-policy";

describe("canUsePlatformOwnerSignupIntent", () => {
  it("rechaza elevar una cuenta común sin intención preparada", () => {
    expect(
      canUsePlatformOwnerSignupIntent({
        preparedIntentType: "member",
        existingUserRole: "member",
      }),
    ).toBe(false);
  });

  it("acepta solo la intención privilegiada preparada server-side", () => {
    expect(
      canUsePlatformOwnerSignupIntent({
        preparedIntentType: "platform_owner",
        existingUserRole: "member",
      }),
    ).toBe(true);
  });

  it("permite a un super_admin existente regenerar su intención de verificación", () => {
    expect(
      canUsePlatformOwnerSignupIntent({
        preparedIntentType: "member",
        existingUserRole: "super_admin",
      }),
    ).toBe(true);
  });
});
