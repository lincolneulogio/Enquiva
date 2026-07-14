"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { ROLE_BADGE_STYLES, normalizeRole } from "@/lib/auth/rbac";
import { getRoleLabel, type Locale } from "@/lib/i18n/core";
import { useLocale } from "@/components/providers/LocaleProvider";
import { useSession } from "@/lib/auth/client";
import { Crown, ShieldCheck, Briefcase, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { formStorageKey, loadFormDraft, saveFormDraft } from "@/lib/form-persistence";

type AiUsage = { used: number; limit: number | null; remaining: number | null };

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

function parseAiUsage(data: unknown): AiUsage | null {
  if (!data || typeof data !== "object") return null;
  const used = (data as { used?: unknown }).used;
  if (typeof used !== "number") return null;
  const limit = (data as { limit?: unknown }).limit;
  const remaining = (data as { remaining?: unknown }).remaining;
  return {
    used,
    limit: typeof limit === "number" ? limit : null,
    remaining: typeof remaining === "number" ? remaining : null,
  };
}

async function fetchAiUsage(signal?: AbortSignal): Promise<AiUsage | null> {
  const res = await fetch("/api/chat/usage", { signal });
  if (!res.ok) return null;
  return parseAiUsage(await res.json());
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
  const [aiUsage, setAiUsage] = useState<AiUsage | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const userRole = normalizeRole(session?.user.role ?? "member");
  const userName = session?.user.name ?? getRoleLabel("member", locale);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    setMessages,
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

  const errorMessage =
    error instanceof Error
      ? error.message.includes("429")
        ? "Has alcanzado el límite de mensajes o el proveedor está saturado. Espera un momento e inténtalo de nuevo."
        : error.message || "No pude completar la respuesta. Revisa la conexión e inténtalo otra vez."
      : null;

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
  }, [messages]);

  useEffect(() => {
    if (!isOpen && messages.length > 1) setHasUnread(true);
  }, [messages.length, isOpen]);

  /** Carga uso desde handlers de evento (evita setState en .then de un effect). */
  const refreshAiUsage = useCallback(() => {
    void (async () => {
      try {
        const usage = await fetchAiUsage();
        if (usage) setAiUsage(usage);
      } catch {
        /* red / abort */
      }
    })();
  }, []);

  const handleToggle = () => {
    const opening = !isOpen;
    setIsOpen(opening);
    setHasUnread(false);
    if (opening) refreshAiUsage();
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
    errorMessage,
    handleToggle,
    handleResetChat,
    aiUsage,
    RoleIcon: ROLE_ICON[userRole] ?? UserRound,
    ROLE_BADGE_STYLES,
  };
}
