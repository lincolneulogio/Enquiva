import type { Testimonial } from "@/lib/db/schema/marketing";

export interface TestimonialsManagerProps {
  initialTestimonials: Testimonial[];
}

export interface TestimonialFormData {
  name: string;
  role: string;
  company: string;
  quote: string;
  avatarUrl: string;
  originalAvatarUrl: string;
  rating: number;
  isFeatured: boolean;
  sortOrder: number;
}
