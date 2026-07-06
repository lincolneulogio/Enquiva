import { describe, expect, it } from "vitest";
import { isDevMailProvider, getMailProviderLabel } from "@/lib/mail/config";

describe("mail config", () => {
  it("detects mailtrap as dev provider", () => {
    expect(isDevMailProvider("sandbox.smtp.mailtrap.io")).toBe(true);
    expect(isDevMailProvider("smtp.resend.com")).toBe(false);
  });

  it("labels provider from host", () => {
    expect(getMailProviderLabel()).toBeDefined();
  });
});
