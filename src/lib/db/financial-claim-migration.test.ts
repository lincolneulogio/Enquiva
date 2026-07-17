import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getTableConfig } from "drizzle-orm/pg-core";
import {
  payments,
  platformTransactions,
  subscriptionPayments,
  subscriptions,
} from "@/lib/db/schema";

const migration = readFileSync(
  join(process.cwd(), "drizzle", "0022_financial_claim_idempotency.sql"),
  "utf8",
);

describe("0022 financial claim migration contract", () => {
  it("aligns daily claims and idempotency indexes with the schema", () => {
    const subscriptionColumns = getTableConfig(subscriptions).columns.map(
      (column) => column.name,
    );
    expect(subscriptionColumns).toEqual(
      expect.arrayContaining(["auto_renew_enabled", "auto_renew_last_attempt_at"]),
    );

    const paymentOrderIndex = getTableConfig(payments).indexes.find(
      (index) => index.config.name === "payments_gateway_order_unique_idx",
    );
    const ledgerIndex = getTableConfig(platformTransactions).indexes.find(
      (index) =>
        index.config.name ===
        "platform_transactions_subscription_payment_unique_idx",
    );
    expect(paymentOrderIndex?.config.unique).toBe(true);
    expect(paymentOrderIndex?.config.where).toBeDefined();
    expect(ledgerIndex?.config.unique).toBe(true);
    expect(ledgerIndex?.config.where).toBeDefined();
    const subscriptionChargeIndex = getTableConfig(subscriptionPayments).indexes.find(
      (index) => index.config.name === "subscription_payments_gateway_charge_uidx",
    );
    expect(subscriptionChargeIndex?.config.unique).toBe(true);
    expect(subscriptionChargeIndex?.config.where).toBeDefined();

    expect(migration).toContain('"payments_gateway_order_unique_idx"');
    expect(migration).toContain(
      '"platform_transactions_subscription_payment_unique_idx"',
    );
  });

  it("preserves legacy renewal state and rejects ambiguous duplicates", () => {
    expect(migration).toContain('column_name = \'auto_renew\'');
    expect(migration).toContain('column_name = \'last_auto_renew_attempt_at\'');
    expect(migration).toContain("Cannot enforce Culqi order idempotency");
    expect(migration).toContain("Cannot enforce subscription ledger idempotency");
    expect(migration).not.toMatch(/\bDELETE\s+FROM\b/i);
    expect(migration).not.toMatch(/\bDROP\s+(TABLE|COLUMN)\b/i);
  });
});
