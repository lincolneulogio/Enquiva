"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { PublicNavLink } from "@/lib/navigation/public-header-nav";

type PublicMobileMenuProps = {
  links: PublicNavLink[];
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

export function PublicMobileMenu({
  links,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: PublicMobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const closeMenu = () => setIsOpen(false);

  return (
    <div className="relative md:hidden">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
        onClick={() => setIsOpen((current) => !current)}
        className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-background text-foreground shadow-sm transition-colors hover:bg-secondary"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border bg-background p-3 shadow-xl">
          <div className="flex flex-col gap-2">
            {links.map((link) => (
              <Link
                key={`${link.href}-${link.label}`}
                href={link.href}
                onClick={closeMenu}
                className="rounded-xl px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
              >
                {link.label}
              </Link>
            ))}

            <Link
              href={primaryHref}
              onClick={closeMenu}
              className="rounded-xl bg-primary px-4 py-3 text-center text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {primaryLabel}
            </Link>

            {secondaryHref && secondaryLabel ? (
              <Link
                href={secondaryHref}
                onClick={closeMenu}
                className="rounded-xl border border-border px-4 py-3 text-center text-sm font-medium text-foreground transition-colors hover:bg-secondary"
              >
                {secondaryLabel}
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
