import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const f = createUploadthing();

async function getUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session?.user;
}

export const uploadRouter = {
  // Event cover images
  eventCoverImage: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async () => {
      const user = await getUser();
      if (!user) throw new Error("Unauthorized");
      if (user.role !== "organizer" && user.role !== "super_admin" && user.role !== "admin") {
        throw new Error("Only organizers can upload event images");
      }
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.url };
    }),

  // User profile avatars
  profileAvatar: f({ image: { maxFileSize: "2MB", maxFileCount: 1 } })
    .middleware(async () => {
      const user = await getUser();
      if (!user) throw new Error("Unauthorized");
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.url };
    }),

  // Event attachments (PDFs, docs)
  eventAttachment: f({
    pdf: { maxFileSize: "16MB", maxFileCount: 5 },
    "application/msword": { maxFileSize: "16MB" },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
      maxFileSize: "16MB",
    },
  })
    .middleware(async () => {
      const user = await getUser();
      if (!user) throw new Error("Unauthorized");
      if (user.role !== "organizer" && user.role !== "super_admin" && user.role !== "admin") {
        throw new Error("Only organizers can upload attachments");
      }
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.url, name: file.name };
    }),

  // Payment receipts / invoices
  paymentReceipt: f({
    pdf: { maxFileSize: "8MB", maxFileCount: 1 },
    image: { maxFileSize: "8MB", maxFileCount: 1 },
  })
    .middleware(async () => {
      const user = await getUser();
      if (!user) throw new Error("Unauthorized");
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return {
        uploadedBy: metadata.userId,
        url: file.url,
        name: file.name,
        size: file.size,
        mimeType: file.type,
      };
    }),

  // Testimonial avatars (SuperAdmin only)
  testimonialAvatar: f({ image: { maxFileSize: "2MB", maxFileCount: 1 } })
    .middleware(async () => {
      const user = await getUser();
      if (!user) throw new Error("Unauthorized");
      if (user.role !== "super_admin") {
        throw new Error("Only super admins can upload testimonial avatars");
      }
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.url };
    }),

  // Newsletter broadcast images (SuperAdmin only)
  newsletterImage: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async () => {
      const user = await getUser();
      if (!user) throw new Error("Unauthorized");
      if (user.role !== "super_admin") {
        throw new Error("Only super admins can upload newsletter images");
      }
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.url };
    }),

  // Landing impact images (SuperAdmin / Admin only)
  landingImpactImage: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async () => {
      const user = await getUser();
      if (!user) throw new Error("Unauthorized");
      if (user.role !== "super_admin" && user.role !== "admin") {
        throw new Error("Only super admins can upload landing impact images");
      }
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof uploadRouter;
