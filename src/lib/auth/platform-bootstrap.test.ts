import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(),
    transaction: vi.fn(),
  },
}));

import { db } from "@/lib/db";
import { hasSuperAdmin, resolveSignupRole } from "@/lib/auth/platform-bootstrap";

function mockSuperAdminCount(count: number) {
  const chain = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue([{ count }]),
  };
  vi.mocked(db.select).mockReturnValue(chain as never);
}

describe("platform-bootstrap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("resolveSignupRole always returns member (public register)", async () => {
    mockSuperAdminCount(0);
    await expect(resolveSignupRole()).resolves.toBe("member");
    mockSuperAdminCount(1);
    await expect(resolveSignupRole()).resolves.toBe("member");
  });

  it("hasSuperAdmin reflects count", async () => {
    mockSuperAdminCount(0);
    await expect(hasSuperAdmin()).resolves.toBe(false);
    mockSuperAdminCount(1);
    await expect(hasSuperAdmin()).resolves.toBe(true);
  });
});
