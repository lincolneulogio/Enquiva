"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  approveOrganizerRequest,
  promoteOrgMember,
  rejectOrganizerRequest,
} from "@/actions/organizations";
import { getRoleLabel } from "@/lib/i18n/core";
import { useLocale, useTranslations } from "@/components/providers/LocaleProvider";
import { getRegisterInviteUrl } from "@/lib/share/invite-code";
import type { Organization } from "@/lib/db/schema";
import {
  type TeamRow,
  TeamInviteCodeCard,
  PendingRequestsCard,
  TeamMembersListCard,
} from "./index";

export interface AdminTeamPanelProps {
  organization: Organization;
  team: TeamRow[];
  pendingRequests: TeamRow[];
  isOwner: boolean;
}

export function AdminTeamPanel({
  organization,
  team,
  pendingRequests,
  isOwner,
}: AdminTeamPanelProps) {
  const { locale } = useLocale();
  const t = useTranslations();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(organization.inviteCode);
    setCopiedCode(true);
    toast.success(t("dashboard.admin.inviteCodeCopied"));
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyLink = () => {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? (typeof window !== "undefined" ? window.location.origin : "https://enquiva.site");
    const link = getRegisterInviteUrl(appUrl, organization.inviteCode);
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    toast.success(locale === "en" ? "Invite link copied to clipboard!" : "¡Enlace de invitación copiado al portapapeles!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const changeRole = (userId: string, role: "organizer" | "member") => {
    startTransition(async () => {
      try {
        await promoteOrgMember(userId, role);
        toast.success(
          t("dashboard.admin.roleUpdated", {
            role: getRoleLabel(role, locale),
          }),
        );
        router.refresh();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : t("dashboard.admin.couldNotUpdateRole"));
      }
    });
  };

  const approve = (userId: string) => {
    startTransition(async () => {
      try {
        await approveOrganizerRequest(userId);
        toast.success(t("dashboard.admin.requestApproved"));
        router.refresh();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : t("dashboard.admin.couldNotApprove"));
      }
    });
  };

  const reject = (userId: string) => {
    startTransition(async () => {
      try {
        await rejectOrganizerRequest(userId);
        toast.success(t("dashboard.admin.requestRejected"));
        router.refresh();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : t("dashboard.admin.couldNotReject"));
      }
    });
  };

  return (
    <div className="space-y-6">
      <TeamInviteCodeCard
        organization={organization}
        copiedCode={copiedCode}
        copiedLink={copiedLink}
        onCopyCode={copyCode}
        onCopyLink={copyLink}
      />

      <PendingRequestsCard
        pendingRequests={pendingRequests}
        isPending={isPending}
        onApprove={approve}
        onReject={reject}
      />

      <TeamMembersListCard
        team={team}
        ownerId={organization.ownerId}
        isOwner={isOwner}
        isPending={isPending}
        onChangeRole={changeRole}
      />
    </div>
  );
}
