import { describe, it, expect } from "vitest";
import { es } from "./locales/es";
import { en } from "./locales/en";

function getKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  let keys: string[] = [];
  for (const k of Object.keys(obj)) {
    const val = obj[k];
    const p = prefix ? `${prefix}.${k}` : k;
    if (typeof val === "object" && val !== null && !Array.isArray(val)) {
      keys = keys.concat(getKeys(val as Record<string, unknown>, p));
    } else {
      keys.push(p);
    }
  }
  return keys;
}

describe("Audit locales", () => {
  it("compares es and en keys", () => {
    const esKeys = new Set(getKeys(es as Record<string, unknown>));
    const enKeys = new Set(getKeys(en as Record<string, unknown>));

    const missingInEn = [...esKeys].filter((k) => !enKeys.has(k));
    const missingInEs = [...enKeys].filter((k) => !esKeys.has(k));

    console.log("Total ES keys:", esKeys.size);
    console.log("Total EN keys:", enKeys.size);
    console.log("Missing in EN count:", missingInEn.length);
    if (missingInEn.length > 0) {
      console.log("Sample missing in EN:", missingInEn.slice(0, 30));
    }
    console.log("Missing in ES count:", missingInEs.length);
    if (missingInEs.length > 0) {
      console.log("Sample missing in ES:", missingInEs.slice(0, 30));
    }
  });

  it("checks for untranslated or mismatched strings between es and en", () => {
    function flatten(obj: Record<string, unknown>, prefix = ""): Record<string, string> {
      let res: Record<string, string> = {};
      for (const k of Object.keys(obj)) {
        const val = obj[k];
        const p = prefix ? `${prefix}.${k}` : k;
        if (typeof val === "string") {
          res[p] = val;
        } else if (typeof val === "object" && val !== null && !Array.isArray(val)) {
          Object.assign(res, flatten(val as Record<string, unknown>, p));
        }
      }
      return res;
    }

    const flatEs = flatten(es as Record<string, unknown>);
    const flatEn = flatten(en as Record<string, unknown>);

    const spanishInEn: { key: string; text: string }[] = [];
    const englishInEs: { key: string; text: string }[] = [];

    // Check for obvious Spanish patterns in EN
    const spanishWordRegex = /\b(el|la|los|las|un|una|de|en|por|para|con|sin|sobre|este|esta|estos|estas|evento|eventos|guardar|cancelar|eliminar|editar|configuración|horario|horarios|turno|asistentes|inscripción|inscripciones|método|métodos|pago|pagos|comprobante|cargando)\b/i;
    // Check for obvious English patterns in ES
    const englishWordRegex = /\b(the|this|that|these|those|please|select|delete|save|cancel|loading|search|events|attendees|tickets|schedules|settings|dashboard|payment|payments|overview|management|broadcasts|analytics)\b/i;

    for (const [key, text] of Object.entries(flatEn)) {
      // Ignore keys that are technical, brands, or same words (e.g. Email, ID, QR)
      if (key.startsWith("legal.") || key.includes("brand")) continue;
      if (spanishWordRegex.test(text)) {
        // Only if it has spanish accents or common words
        if (/[áéíóúñ¿¡]/.test(text) || /\b(de|el|la|los|las|para|en|con|por)\b/i.test(text)) {
          spanishInEn.push({ key, text });
        }
      }
    }

    for (const [key, text] of Object.entries(flatEs)) {
      if (key.startsWith("legal.") || key.includes("brand")) continue;
      if (englishWordRegex.test(text)) {
        if (/\b(the|please|select your|delete this|save changes|loading\.\.\.)\b/i.test(text)) {
          englishInEs.push({ key, text });
        }
      }
    }
  });

  it("scans all src files for t('...') calls and verifies they exist in es and en", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const { translate } = await import("./core");

    function getFiles(dir: string): string[] {
      let files: string[] = [];
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (
            entry.name === "node_modules" ||
            entry.name === ".next" ||
            entry.name === ".git"
          )
            continue;
          files = files.concat(getFiles(fullPath));
        } else if (
          entry.name.endsWith(".tsx") ||
          entry.name.endsWith(".ts")
        ) {
          if (!entry.name.includes(".test.") && !entry.name.includes("audit-locales")) {
            files.push(fullPath);
          }
        }
      }
      return files;
    }

    const srcDir = path.resolve(process.cwd(), "src");
    const files = getFiles(srcDir);

    const regex = /\bt\(\s*["'`]([a-zA-Z0-9_.-]+)["'`]/g;
    const foundKeys = new Set<string>();

    for (const file of files) {
      const content = fs.readFileSync(file, "utf8");
      let match: RegExpExecArray | null;
      while ((match = regex.exec(content)) !== null) {
        foundKeys.add(match[1]);
      }
    }

    console.log("Total unique t() keys found in code:", foundKeys.size);

    const missingInEs: string[] = [];
    const missingInEn: string[] = [];

    for (const key of foundKeys) {
      const transEs = translate("es", key);
      if (transEs === key) {
        missingInEs.push(key);
      }
      const transEn = translate("en", key);
      if (transEn === key) {
        missingInEn.push(key);
      }
    }

    console.log("ALL_MISSING_ES:" + JSON.stringify(missingInEs));
    console.log("ALL_MISSING_EN:" + JSON.stringify(missingInEn));

    expect(missingInEs).toEqual([]);
    expect(missingInEn).toEqual([]);
  });
});
