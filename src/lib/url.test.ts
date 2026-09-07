import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getAppBaseUrl, absoluteUrl } from "./url";

const PREV_URL = process.env.NEXT_PUBLIC_APP_URL;

beforeEach(() => {
  process.env.NEXT_PUBLIC_APP_URL = "https://enquiva.site/";
  vi.stubGlobal("window", undefined);
});

afterEach(() => {
  if (PREV_URL === undefined) {
    delete process.env.NEXT_PUBLIC_APP_URL;
  } else {
    process.env.NEXT_PUBLIC_APP_URL = PREV_URL;
  }
  vi.unstubAllGlobals();
});

describe("getAppBaseUrl", () => {
  it("normaliza sin barra final", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://enquiva.site/";
    expect(getAppBaseUrl()).toBe("https://enquiva.site");
  });

  it("ignora múltiples barras finales", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://enquiva.site///";
    expect(getAppBaseUrl()).toBe("https://enquiva.site");
  });

  it("usa el origin del navegador si no hay variable", () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    vi.stubGlobal("window", { location: { origin: "http://localhost:3000" } });
    expect(getAppBaseUrl()).toBe("http://localhost:3000");
  });

  it("cae a localhost en servidor sin variable", () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    vi.stubGlobal("window", undefined);
    expect(getAppBaseUrl()).toBe("http://localhost:3000");
  });
});

describe("absoluteUrl", () => {
  it("adjunta ruta relativa de forma segura", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://enquiva.site";
    expect(absoluteUrl("/ticket/abc?s=x")).toBe("https://enquiva.site/ticket/abc?s=x");
  });

  it("acepta rutas sin barra inicial", () => {
    expect(absoluteUrl("events")).toBe("https://enquiva.site/events");
  });

  it("evita barras dobles internas al unir", () => {
    expect(absoluteUrl("/events")).toBe("https://enquiva.site/events");
  });

  it("sin ruta devuelve la base", () => {
    expect(absoluteUrl()).toBe("https://enquiva.site");
  });
});