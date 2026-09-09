import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mis tickets",
  robots: { index: false, follow: false },
};

export { default } from "@/app/(dashboard)/member/tickets/page";