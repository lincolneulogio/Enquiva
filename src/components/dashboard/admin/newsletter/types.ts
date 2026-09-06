import type { NewsletterSubscriber } from "@/lib/db/schema/marketing";
import type { NewsletterStats } from "@/actions/admin/newsletter";

export type StatusFilter = "all" | "active" | "unsubscribed";

export interface NewsletterManagerProps {
  initialSubscribers: NewsletterSubscriber[];
  initialStats: NewsletterStats;
}
