"use client";

import { CertificateSealCard } from "@/components/dashboard/admin/CertificateSealCard";

interface PlatformCertificatesTabProps {
    initialSealUrl?: string | null;
    locale: "es" | "en";
}

export function PlatformCertificatesTab({ initialSealUrl, locale }: PlatformCertificatesTabProps) {
    return (
        <CertificateSealCard
            initialSealUrl={initialSealUrl}
            locale={locale}
        />
    );
}
