import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Acceso",
    template: "%s | Enquiva",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function AuthSegmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}