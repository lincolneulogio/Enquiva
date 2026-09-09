import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mis pagos",
  robots: { index: false, follow: false },
};

export { default } from "@/app/(dashboard)/member/payments/page";