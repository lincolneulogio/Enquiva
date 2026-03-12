"use client";

import { seedRoles } from "@/actions/admin";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

export function SeedRolesButton() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleClick = () => {
    startTransition(async () => {
      try {
        await seedRoles();
        toast.success("Roles initialized successfully");
        router.refresh();
      } catch {
        toast.error("Failed to initialize roles");
      }
    });
  };

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
    >
      <Sparkles className="h-4 w-4" />
      {isPending ? "Initializing..." : "Initialize roles"}
    </button>
  );
}
