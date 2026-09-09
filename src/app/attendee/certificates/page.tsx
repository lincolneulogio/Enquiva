import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mis certificados",
  robots: { index: false, follow: false },
};

export { default } from "@/app/(dashboard)/member/certificates/page";