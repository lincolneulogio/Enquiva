"use client";

import { seedRoles } from "@/actions/admin";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { useTranslations } from "@/components/providers/LocaleProvider";

export function SeedRolesButton() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const t = useTranslations();

  const handleClick = () => {
    startTransition(async () => {
      try {
        await seedRoles();
        toast.success(t("dashboard.admin.rolesInitialized"));
        router.refresh();
      } catch {
        toast.error(t("dashboard.admin.failedToInitializeRoles"));
      }
    });
  };

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 sm:w-auto"
    >
      <Sparkles className="h-4 w-4" />
      {isPending ? t("dashboard.admin.initializing") : t("dashboard.admin.initializeRoles")}
    </button>
  );
}
