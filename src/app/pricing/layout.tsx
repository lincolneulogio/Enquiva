import { MarketingMotionProvider } from "@/components/providers/MarketingMotionProvider";

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MarketingMotionProvider>{children}</MarketingMotionProvider>;
}
