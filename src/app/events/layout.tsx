import { MarketingMotionProvider } from "@/components/providers/MarketingMotionProvider";

export default function EventsSegmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MarketingMotionProvider>{children}</MarketingMotionProvider>;
}
