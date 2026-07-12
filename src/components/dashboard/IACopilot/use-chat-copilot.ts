"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { ROLE_BADGE_STYLES, normalizeRole } from "@/lib/auth/rbac";
import { getRoleLabel, type Locale } from "@/lib/i18n/core";
import { useLocale } from "@/components/providers/LocaleProvider";
import { useSession } from "@/lib/auth/client";
import { Crown, ShieldCheck, Briefcase, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { formStorageKey, loadFormDraft, saveFormDraft } from "@/lib/form-persistence";

function buildWelcomeMessage(
  userName: string,
  userRole: string,
  locale: Locale,
  t: (key: string, params?: Record<string, string | number>) => string,
) {
  const capabilitiesKey =
    userRole === "super_admin" || userRole === "admin"
      ? "copilot.capabilitiesStaff"
      : userRole === "organizer"
        ? "copilot.capabilitiesOrganizer"
        : "copilot.capabilitiesMember";

  return t("copilot.welcome", {
    name: userName,
    role: getRoleLabel(userRole, locale),
    capabilities: t(capabilitiesKey),
  });
}

const ROLE_ICON: Record<string, LucideIcon> = {
  super_admin: Crown,
  admin: ShieldCheck,
  organizer: Briefcase,
  member: UserRound,
};

export function useChatCopilot() {
  const { data: session } = useSession();
  const { locale, t } = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [aiUsage, setAiUsage] = useState<{ used: number; limit: number | null; remaining: number | null } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const userRole = normalizeRole(session?.user.role ?? "member");
  const userName = session?.user.name ?? getRoleLabel("member", locale);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    setMessages,
    append,
    setInput,
  } = useChat({
    api: "/api/chat",
    streamProtocol: "text",
    initialMessages: [
      {
        id: "welcome",
        role: "assistant",
        content: buildWelcomeMessage(userName, userRole, locale, t),
      },
    ],
  });


  useEffect(() => {
    const saved = loadFormDraft<string>(formStorageKey("ai.copilot.input"));
    if (saved) setInput(saved);
  }, [setInput]);

  useEffect(() => {
    const timer = setTimeout(() => {
      saveFormDraft(formStorageKey("ai.copilot.input"), input);
    }, 300);
    return () => clearTimeout(timer);
  }, [input]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    if (!isOpen && messages.length > 1) setHasUnread(true);
  }, [messages, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    fetch("/api/chat/usage")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && typeof data.used === "number") setAiUsage(data);
      })
      .catch(() => undefined);
  }, [isOpen, messages.length]);

  const refreshAiUsage = () => {
    fetch("/api/chat/usage")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && typeof data.used === "number") setAiUsage(data);
      })
      .catch(() => undefined);
  };

  const handleToggle = () => {
    setIsOpen((p) => !p);
    setHasUnread(false);
  };
  const wrappedSubmit = (event?: { preventDefault?: () => void }) => {
    handleSubmit(event);
    window.setTimeout(refreshAiUsage, 500);
  };
  const handleResetChat = () =>
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: t("copilot.reset", { name: userName }),
      },
    ]);

  return {
    session,
    userRole,
    userName,
    locale,
    isOpen,
    hasUnread,
    messagesEndRef,
    messages,
    input,
    handleInputChange,
    handleSubmit: wrappedSubmit,
    isLoading,
    handleToggle,
    handleResetChat,
    aiUsage,
    RoleIcon: ROLE_ICON[userRole] ?? UserRound,
    ROLE_BADGE_STYLES,
  };
}
