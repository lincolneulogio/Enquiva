import { describe, expect, it } from "vitest";
import {
    DEFAULT_PLATFORM_LOCALE,
    DEFAULT_PLATFORM_TIMEZONE,
    PLATFORM_TIMEZONE_OPTIONS,
    formatDateTimeInTimezone,
    getTimezoneDisplayLabel,
    getTimezoneOffsetLabel,
    isValidIanaTimezone,
    normalizePlatformLocale,
    normalizePlatformTimezone,
} from "./platform-locale";

describe("platform-locale", () => {
    it("has Lima, Peru as the primary default timezone", () => {
        expect(DEFAULT_PLATFORM_TIMEZONE).toBe("America/Lima");
        expect(PLATFORM_TIMEZONE_OPTIONS[0]?.value).toBe("America/Lima");
        expect(PLATFORM_TIMEZONE_OPTIONS[0]?.countryCode).toBe("PE");
    });

    it("has Spanish as the default platform locale", () => {
        expect(DEFAULT_PLATFORM_LOCALE).toBe("es");
        expect(normalizePlatformLocale(undefined)).toBe("es");
        expect(normalizePlatformLocale("en")).toBe("en");
        expect(normalizePlatformLocale("fr")).toBe("es");
    });

    it("validates and normalizes IANA timezones accurately", () => {
        expect(isValidIanaTimezone("America/Lima")).toBe(true);
        expect(isValidIanaTimezone("America/Bogota")).toBe(true);
        expect(isValidIanaTimezone("Invalid/Zone")).toBe(false);

        expect(normalizePlatformTimezone("America/Lima")).toBe("America/Lima");
        expect(normalizePlatformTimezone("Europe/Madrid")).toBe("Europe/Madrid");
        expect(normalizePlatformTimezone("")).toBe("America/Lima");
        expect(normalizePlatformTimezone("Invalid/Timezone")).toBe("America/Lima");
    });

    it("calculates timezone GMT offset label", () => {
        const offset = getTimezoneOffsetLabel("America/Lima");
        expect(offset).toMatch(/GMT-5|UTC-5/);
    });

    it("generates user-friendly display labels with country and GMT offset", () => {
        const limaOption = PLATFORM_TIMEZONE_OPTIONS[0]!;
        const labelEs = getTimezoneDisplayLabel(limaOption, "es");
        const labelEn = getTimezoneDisplayLabel(limaOption, "en");

        expect(labelEs).toContain("Perú");
        expect(labelEs).toContain("Lima");
        expect(labelEs).toMatch(/GMT-5|UTC-5/);

        expect(labelEn).toContain("Peru");
        expect(labelEn).toContain("Lima");
    });

    it("correctly converts UTC timestamps to the selected timezone", () => {
        // 2026-09-04T15:00:00Z is 10:00:00 in Lima (UTC-5)
        const date = new Date("2026-09-04T15:00:00Z");

        const limaFormatted = formatDateTimeInTimezone(date, {
            timeZone: "America/Lima",
            timeStyle: "short",
            hour12: false,
        });
        expect(limaFormatted).toContain("10:00");

        // In Madrid (UTC+2 in daylight saving September), 15:00 UTC is 17:00
        const madridFormatted = formatDateTimeInTimezone(date, {
            timeZone: "Europe/Madrid",
            timeStyle: "short",
            hour12: false,
        });
        expect(madridFormatted).toContain("17:00");
    });
});
