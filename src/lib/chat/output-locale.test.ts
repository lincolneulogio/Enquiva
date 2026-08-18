import { describe, expect, it } from "vitest";
import { chatOutputLanguageLock, parseChatLocale } from "./output-locale";

describe("parseChatLocale", () => {
  it("acepta es y en", () => {
    expect(parseChatLocale("es")).toBe("es");
    expect(parseChatLocale("en")).toBe("en");
  });

  it("cae a español si el valor no es válido", () => {
    expect(parseChatLocale("fr")).toBe("es");
    expect(parseChatLocale(undefined)).toBe("es");
  });
});

describe("chatOutputLanguageLock", () => {
  it("obliga español cuando el header está en ES", () => {
    expect(chatOutputLanguageLock("es")).toMatch(/enteramente en español/i);
    expect(chatOutputLanguageLock("es")).toMatch(/Prohibido mezclar inglés/i);
  });

  it("obliga inglés cuando el header está en EN", () => {
    expect(chatOutputLanguageLock("en")).toMatch(/entirely in English/i);
  });
});
