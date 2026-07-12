import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/env", () => ({
  env: {
    NEXT_PUBLIC_APP_URL: "https://app.evora.test",
    NEXT_PUBLIC_DOCS_URL: "https://docs.evora.test",
  },
}));

describe("docs CORS allowlist", () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env.DOCS_CORS_ORIGINS;
  });

  it("allows exact configured origins", async () => {
    const { isDocsCorsOriginAllowed } = await import("@/lib/docs/cors");
    expect(isDocsCorsOriginAllowed("https://app.evora.test")).toBe(true);
    expect(isDocsCorsOriginAllowed("https://docs.evora.test")).toBe(true);
    expect(isDocsCorsOriginAllowed("http://localhost:4321")).toBe(true);
  });

  it("rejects substring spoof origins", async () => {
    const { isDocsCorsOriginAllowed } = await import("@/lib/docs/cors");
    expect(isDocsCorsOriginAllowed("https://evil-evora.app.attacker.com")).toBe(false);
    expect(isDocsCorsOriginAllowed("https://localhost.evil.com")).toBe(false);
    expect(isDocsCorsOriginAllowed(null)).toBe(false);
  });

  it("allows extra origins from DOCS_CORS_ORIGINS", async () => {
    process.env.DOCS_CORS_ORIGINS = "https://custom.docs.local";
    const { isDocsCorsOriginAllowed } = await import("@/lib/docs/cors");
    expect(isDocsCorsOriginAllowed("https://custom.docs.local")).toBe(true);
  });
});
