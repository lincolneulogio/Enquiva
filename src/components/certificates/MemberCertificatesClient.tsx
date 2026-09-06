"use client";

import { useState, useMemo } from "react";
import {
  getCertificateStatusDetails,
  type CertificateStatusDetails,
} from "@/lib/certificates/eligibility";
import type {
  MemberCertificateItem,
  MemberCertificatesClientProps,
  ProcessedCertificateItem,
} from "./member/types";
import { CertificatesHeaderStats } from "./member/CertificatesHeaderStats";
import { CertificatesFilterBar } from "./member/CertificatesFilterBar";
import { MemberCertificateCard } from "./member/MemberCertificateCard";
import { CertificatesEmptyState } from "./member/CertificatesEmptyState";

export type { MemberCertificateItem };

export function MemberCertificatesClient({
  items,
  locale = "es",
}: MemberCertificatesClientProps) {
  const [filter, setFilter] = useState<"all" | "eligible" | "pending">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const processedItems: ProcessedCertificateItem[] = useMemo(() => {
    return items.map((item) => {
      const statusDetails: CertificateStatusDetails = getCertificateStatusDetails(
        {
          wantsCertificate: item.wantsCertificate,
          registrationStatus: item.registrationStatus,
          certificateCode: item.certificateCode,
          eventDate: item.eventDate,
          eventEndDate: item.eventEndDate,
        },
        locale,
      );

      return {
        ...item,
        statusDetails,
      };
    });
  }, [items, locale]);

  const filteredItems = useMemo(() => {
    return processedItems.filter((item) => {
      if (filter === "eligible" && !item.statusDetails.isEligible) return false;
      if (filter === "pending" && item.statusDetails.isEligible) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = item.eventTitle.toLowerCase().includes(q);
        const matchesCertTitle = (item.certificateTitle || "").toLowerCase().includes(q);
        const matchesCode = (item.certificateCode || "").toLowerCase().includes(q);
        const matchesOrg = (item.organizationName || "").toLowerCase().includes(q);
        return matchesTitle || matchesCertTitle || matchesCode || matchesOrg;
      }

      return true;
    });
  }, [processedItems, filter, searchQuery]);

  const eligibleCount = useMemo(
    () => processedItems.filter((i) => i.statusDetails.isEligible).length,
    [processedItems],
  );
  const pendingCount = useMemo(
    () => processedItems.filter((i) => !i.statusDetails.isEligible).length,
    [processedItems],
  );

  return (
    <div className="space-y-6 sm:space-y-8">
      <CertificatesHeaderStats
        totalCount={items.length}
        eligibleCount={eligibleCount}
        pendingCount={pendingCount}
        locale={locale}
      />

      <CertificatesFilterBar
        filter={filter}
        onFilterChange={setFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        totalCount={items.length}
        eligibleCount={eligibleCount}
        pendingCount={pendingCount}
        locale={locale}
      />

      {filteredItems.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          {filteredItems.map((item) => (
            <MemberCertificateCard
              key={item.registrationId}
              item={item}
              locale={locale}
            />
          ))}
        </div>
      ) : (
        <CertificatesEmptyState
          searchQuery={searchQuery}
          locale={locale}
        />
      )}
    </div>
  );
}
