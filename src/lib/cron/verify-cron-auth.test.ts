import { describe, expect, it } from "vitest";
import { verifyCronAuth } from "@/lib/cron/verify-cron-auth";

describe("verifyCronAuth", () => {
  const secret = "test-cron-secret-16";

  it("rejects when secret is not configured", () => {
    const result = verifyCronAuth(new Request("http://localhost/api/cron/events"), undefined);
    expect(result).not.toBeNull();
    expect(result?.response.status).toBe(503);
  });

  it("rejects invalid bearer token", () => {
    const req = new Request("http://localhost/api/cron/events", {
      headers: { authorization: "Bearer wrong" },
    });
    const result = verifyCronAuth(req, secret);
    expect(result).not.toBeNull();
    expect(result?.response.status).toBe(401);
  });

  it("allows valid bearer token", () => {
    const req = new Request("http://localhost/api/cron/events", {
      headers: { authorization: `Bearer ${secret}` },
    });
    expect(verifyCronAuth(req, secret)).toBeNull();
  });
});
