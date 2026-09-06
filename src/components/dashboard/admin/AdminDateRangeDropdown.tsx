"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Calendar, ChevronDown, Check } from "lucide-react";
import { useTranslations } from "@/components/providers/LocaleProvider";

const RANGE_OPTIONS = [
  { value: "30d", labelKey: "dashboard.admin.last30Days" },
  { value: "90d", labelKey: "dashboard.admin.last90Days" },
  { value: "12m", labelKey: "dashboard.admin.last12Months" },
  { value: "all", labelKey: "dashboard.admin.allTime" },
] as const;

export type AdminStatsRange = (typeof RANGE_OPTIONS)[number]["value"];

interface AdminDateRangeDropdownProps {
  selectedRange: AdminStatsRange;
}

export function AdminDateRangeDropdown({ selectedRange }: AdminDateRangeDropdownProps) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentOption =
    RANGE_OPTIONS.find((opt) => opt.value === selectedRange) ?? RANGE_OPTIONS[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (range: AdminStatsRange) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", range);
    router.push(`${pathname}?${params.toString()}`);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-2xs transition-colors hover:bg-muted/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
        <span>{t(currentOption.labelKey)}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-1.5 w-44 origin-top-right rounded-xl border border-border/80 bg-card p-1 shadow-lg backdrop-blur-md focus:outline-none dark:bg-card/95">
          <div className="space-y-0.5">
            {RANGE_OPTIONS.map((option) => {
              const isSelected = option.value === selectedRange;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    isSelected
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-muted/50"
                  }`}
                >
                  <span>{t(option.labelKey)}</span>
                  {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
