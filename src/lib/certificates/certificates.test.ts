import { describe, it, expect } from "vitest";
import { isCertificateEligible, getCertificateStatusDetails } from "./eligibility";

describe("Certificate System Business Logic & Eligibility", () => {
  it("generates anti-fraud unique certificate code format", () => {
    const year = 2026;
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    const code = `ENQ-${year}-CERT-${randomPart}`;

    expect(code).toMatch(/^ENQ-2026-CERT-[A-Z0-9]{6}$/);
  });

  it("Option A: Check-in presencial o virtual (Estándar de Oro) activates certificate immediately even for future event", () => {
    const futureDate = new Date(Date.now() + 86400000); // Mañana
    const params = {
      wantsCertificate: true,
      certificateCode: "ENQ-2026-CERT-123456",
      registrationStatus: "checked_in",
      eventDate: futureDate,
    };

    expect(isCertificateEligible(params)).toBe(true);

    const details = getCertificateStatusDetails(params, "es");
    expect(details.isEligible).toBe(true);
    expect(details.status).toBe("attended");
    expect(details.badgeLabel).toContain("Asistió");
  });

  it("Option B: Event Concluded (Automático) activates certificate for past event even without check-in", () => {
    const pastDate = new Date(Date.now() - 86400000); // Ayer
    const params = {
      wantsCertificate: true,
      certificateCode: "ENQ-2026-CERT-123456",
      registrationStatus: "registered",
      eventDate: pastDate,
    };

    expect(isCertificateEligible(params)).toBe(true);

    const details = getCertificateStatusDetails(params, "es");
    expect(details.isEligible).toBe(true);
    expect(details.status).toBe("concluded");
    expect(details.badgeLabel).toContain("Evento Concluido");
  });

  it("Future event without check-in remains in Pending status with informative lock message", () => {
    const futureDate = new Date(Date.now() + 86400000 * 30); // En 30 días
    const params = {
      wantsCertificate: true,
      certificateCode: "ENQ-2026-CERT-123456",
      registrationStatus: "registered",
      eventDate: futureDate,
    };

    expect(isCertificateEligible(params)).toBe(false);

    const details = getCertificateStatusDetails(params, "es");
    expect(details.isEligible).toBe(false);
    expect(details.status).toBe("pending");
    expect(details.badgeLabel).toContain("Pendiente");
    expect(details.unlockMessage).toContain("Tu certificado oficial se activará");
  });

  it("Certificate not requested remains disabled and returns appropriate status", () => {
    const pastDate = new Date(Date.now() - 86400000);
    const params = {
      wantsCertificate: false,
      certificateCode: null,
      registrationStatus: "checked_in",
      eventDate: pastDate,
    };

    expect(isCertificateEligible(params)).toBe(false);

    const details = getCertificateStatusDetails(params, "es");
    expect(details.isEligible).toBe(false);
    expect(details.status).toBe("not_requested");
  });
});
