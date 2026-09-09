import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Panel de gestión",
    template: "%s | Enquiva",
  },
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function DashboardSegmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}