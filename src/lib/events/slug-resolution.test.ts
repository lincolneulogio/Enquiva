import { describe, expect, it } from "vitest";
import { isUUID, resolveCategoryCurrentSlug } from "./slug-resolution";

describe("slug-resolution (ruta estática, sin BD)", () => {
  it("isUUID valida identificadores v4", () => {
    expect(isUUID("123e4567-e89b-12d3-a456-426614174000")).toBe(true);
    expect(isUUID("no-es-uuid")).toBe(false);
    expect(isUUID("18921ee3-4c5e-4cee-9023-4027dee0a0f4")).toBe(true);
  });

  it("resuelve slugs canónicos sin consultar la BD", async () => {
    await expect(resolveCategoryCurrentSlug("music")).resolves.toBe("music");
    await expect(resolveCategoryCurrentSlug("technology")).resolves.toBe("technology");
  });

  it("resuelve slugs legados al canónico", async () => {
    await expect(resolveCategoryCurrentSlug("worship")).resolves.toBe("religion");
    await expect(resolveCategoryCurrentSlug("retreat")).resolves.toBe("religion");
    await expect(resolveCategoryCurrentSlug("youth")).resolves.toBe("family");
    await expect(resolveCategoryCurrentSlug("conference")).resolves.toBe("conferences");
  });

  it("devuelve null para filtros vacíos o 'all'", async () => {
    await expect(resolveCategoryCurrentSlug("all")).resolves.toBeNull();
    await expect(resolveCategoryCurrentSlug(null)).resolves.toBeNull();
    await expect(resolveCategoryCurrentSlug(undefined)).resolves.toBeNull();
    await expect(resolveCategoryCurrentSlug("")).resolves.toBeNull();
  });
});