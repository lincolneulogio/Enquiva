"use client";

import { createContext, useContext, type ReactNode } from "react";
import { BRAND } from "@/lib/brand";
import type { PlatformBrand } from "@/lib/brand/platform-brand";

const defaultBrand: PlatformBrand = {
  name: BRAND.name,
  supportEmail: BRAND.supportEmail,
  contactEmail: BRAND.contactEmail,
  location: "",
  social: {
    facebook: "",
    instagram: "",
    x: "",
    linkedIn: "",
    whatsApp: "",
    youtube: "",
  },
  domain: BRAND.domain,
  botName: BRAND.botName,
  logo: BRAND.logo,
  defaultAccentColor: "amber",
};

const PlatformBrandContext = createContext<PlatformBrand>(defaultBrand);

export function PlatformBrandProvider({
  brand,
  children,
}: {
  brand: PlatformBrand;
  children: ReactNode;
}) {
  return (
    <PlatformBrandContext.Provider value={brand}>
      {children}
    </PlatformBrandContext.Provider>
  );
}

export function usePlatformBrand(): PlatformBrand {
  return useContext(PlatformBrandContext);
}
