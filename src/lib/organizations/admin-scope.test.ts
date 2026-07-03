import { describe, expect, it } from "vitest";
import {
  isUnassignedAdminScope,
  scopeDenyAllCondition,
  scopeEventCondition,
  scopeUserCondition,
  scopeCategoryCondition,
  type AdminScope,
} from "@/lib/organizations/admin-scope";

describe("admin-scope", () => {
  const orgScope: AdminScope = {
    mode: "org",
    organizationId: "org-1",
    organizationName: "Test Org",
    inviteCode: "INVITE",
  };

  it("identifies unassigned admin scope", () => {
    expect(isUnassignedAdminScope({ mode: "unassigned" })).toBe(true);
    expect(isUnassignedAdminScope(orgScope)).toBe(false);
    expect(isUnassignedAdminScope({ mode: "platform" })).toBe(false);
  });

  it("scopes events to organization for entity admin", () => {
    expect(scopeEventCondition(orgScope)).toBeDefined();
    expect(scopeEventCondition({ mode: "platform" })).toBeUndefined();
    const deny = scopeEventCondition({ mode: "unassigned" });
    expect(deny).toBeDefined();
    expect(String(deny)).toBe(String(scopeDenyAllCondition()));
  });

  it("scopes users to organization for entity admin", () => {
    expect(scopeUserCondition(orgScope)).toBeDefined();
    expect(scopeUserCondition({ mode: "platform" })).toBeUndefined();
  });

  it("scopes categories to organization for entity admin", () => {
    expect(scopeCategoryCondition(orgScope)).toBeDefined();
    const deny = scopeCategoryCondition({ mode: "unassigned" });
    expect(deny).toBeDefined();
    expect(String(deny)).toBe(String(scopeDenyAllCondition()));
  });
});
