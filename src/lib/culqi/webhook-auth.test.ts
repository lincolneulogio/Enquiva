import crypto from "crypto";
import { describe, expect, it } from "vitest";
import { verifyCulqiWebhookAuth } from "@/lib/culqi/webhook-auth";

const secret = "test-webhook-secret-value-32chars!!";

describe("verifyCulqiWebhookAuth", () => {
  it("accepts HMAC-SHA256 hex of raw body", () => {
    const rawBody = JSON.stringify({ type: "charge.succeeded", id: "evt_1" });
    const signature = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");

    const result = verifyCulqiWebhookAuth({
      rawBody,
      signatureHeader: signature,
      queryToken: null,
      secret,
    });

    expect(result).toEqual({ ok: true, mode: "hmac" });
  });

  it("accepts sha256= prefixed hex", () => {
    const rawBody = '{"ok":true}';
    const hex = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");

    expect(
      verifyCulqiWebhookAuth({
        rawBody,
        signatureHeader: `sha256=${hex}`,
        queryToken: null,
        secret,
      }).ok,
    ).toBe(true);
  });

  it("accepts query token equal to secret", () => {
    const result = verifyCulqiWebhookAuth({
      rawBody: "{}",
      signatureHeader: null,
      queryToken: secret,
      secret,
    });
    expect(result).toEqual({ ok: true, mode: "query-token" });
  });

  it("accepts legacy header equal to secret", () => {
    const result = verifyCulqiWebhookAuth({
      rawBody: '{"x":1}',
      signatureHeader: secret,
      queryToken: null,
      secret,
    });
    expect(result).toEqual({ ok: true, mode: "legacy-header" });
  });

  it("rejects forged signatures", () => {
    const rawBody = JSON.stringify({ amount: 100 });
    expect(
      verifyCulqiWebhookAuth({
        rawBody,
        signatureHeader: "deadbeef",
        queryToken: null,
        secret,
      }),
    ).toEqual({ ok: false, reason: "mismatch" });
  });

  it("rejects missing signature when no query token", () => {
    expect(
      verifyCulqiWebhookAuth({
        rawBody: "{}",
        signatureHeader: null,
        queryToken: null,
        secret,
      }),
    ).toEqual({ ok: false, reason: "missing" });
  });
});
