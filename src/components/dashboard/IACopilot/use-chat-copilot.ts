"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { usePathname } from "next/navigation";
import { ROLE_BADGE_STYLES, normalizeRole } from "@/lib/auth/rbac";
import { getRoleLabel, type Locale } from "@/lib/i18n/core";
import { useLocale } from "@/components/providers/LocaleProvider";
import { useSession } from "@/lib/auth/client";
import { Crown, ShieldCheck, Briefcase, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { formStorageKey, loadFormDraft, saveFormDraft } from "@/lib/form-persistence";
import { getCopilotSuggestions } from "@/lib/chat/suggestions";

type AiUsage = {
  used: number;
  limit: number | null;
  remaining: number | null;
  percentUsed?: number | null;
  nearLimit?: boolean;
};

export type MessageCitations = Record<string, string[]>;

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
  const limitNum = typeof limit === "number" ? limit : null;
  const remainingNum = typeof remaining === "number" ? remaining : null;
  const percentUsed =
    limitNum && limitNum > 0 ? Math.min(100, Math.round((used / limitNum) * 100)) : null;
  return {
    used,
    limit: limitNum,
    remaining: remainingNum,
    percentUsed,
    nearLimit: percentUsed != null && percentUsed >= 80,
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

const THINKING_STATUSES = [
  "Buscando en la base de conocimiento…",
  "Consultando la plataforma…",
  "Analizando datos en tiempo real…",
];

export function useChatCopilot() {
  const { data: session } = useSession();
  const { locale, t } = useLocale();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [aiUsage, setAiUsage] = useState<AiUsage | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [citationsByMessage, setCitationsByMessage] = useState<MessageCitations>({});
  const [feedbackByMessage, setFeedbackByMessage] = useState<Record<string, 1 | -1>>({});
  const [statusHint, setStatusHint] = useState(THINKING_STATUSES[0]!);
  const [lastMeta, setLastMeta] = useState<{
    citations: string[];
    intent?: string;
    modelId?: string;
  }>({ citations: [] });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pendingCitationsRef = useRef<string[]>([]);

  const userRole = normalizeRole(session?.user.role ?? "member");
  const userName = session?.user.name ?? getRoleLabel("member", locale);
  const suggestions = useMemo(() => getCopilotSuggestions(userRole), [userRole]);

  const pageContext = useMemo(
    () => ({
      pathname: pathname ?? undefined,
      eventId: pathname?.match(/\/events\/([0-9a-f-]{36})/i)?.[1],
      eventSlug: pathname?.match(/\/events\/([^/]+)/)?.[1],
    }),
    [pathname],
  );

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
    body: {
      pageContext,
      conversationId: conversationId ?? undefined,
    },
    initialMessages: [
      {
        id: "welcome",
        role: "assistant",
        content: buildWelcomeMessage(userName, userRole, locale, t),
      },
    ],
    onResponse: (res) => {
      try {
        const raw = res.headers.get("X-Evora-Citations");
        const citations = raw
          ? (JSON.parse(decodeURIComponent(raw)) as string[])
          : [];
        const intent = res.headers.get("X-Evora-Intent") ?? undefined;
        const modelId = res.headers.get("X-Evora-Model") ?? undefined;
        const statusRaw = res.headers.get("X-Evora-Status");
        const convId = res.headers.get("X-Evora-Conversation-Id");
        if (convId) setConversationId(convId);
        if (statusRaw) setStatusHint(decodeURIComponent(statusRaw));
        pendingCitationsRef.current = citations;
        setLastMeta({ citations, intent, modelId });
      } catch {
        /* ignore header parse */
      }
    },
    onFinish: (message) => {
      const cites = pendingCitationsRef.current;
      if (message?.id && cites.length) {
        setCitationsByMessage((prev) => ({ ...prev, [message.id]: cites }));
      }
      if (conversationId && message?.content) {
        void fetch("/api/chat/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId,
            content: message.content,
            citations: cites,
            intent: lastMeta.intent,
            modelId: lastMeta.modelId,
          }),
        }).catch(() => {});
      }
    },
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

  useEffect(() => {
    if (!isLoading) return;
    let i = 0;
    const id = window.setInterval(() => {
      i = (i + 1) % THINKING_STATUSES.length;
      setStatusHint(THINKING_STATUSES[i]!);
    }, 2200);
    return () => window.clearInterval(id);
  }, [isLoading]);

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

  const sendSuggestion = (prompt: string) => {
    setInput(prompt);
    window.setTimeout(() => {
      handleSubmit();
      window.setTimeout(refreshAiUsage, 500);
    }, 0);
  };

  const handleResetChat = () => {
    setConversationId(null);
    setCitationsByMessage({});
    setFeedbackByMessage({});
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: t("copilot.reset", { name: userName }),
      },
    ]);
  };

  const submitFeedback = async (messageId: string, rating: 1 | -1) => {
    if (feedbackByMessage[messageId]) return;
    setFeedbackByMessage((prev) => ({ ...prev, [messageId]: rating }));
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    await fetch("/api/chat/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messageId,
        rating,
        conversationId: conversationId ?? undefined,
        query: typeof lastUser?.content === "string" ? lastUser.content : undefined,
        citations: citationsByMessage[messageId] ?? lastMeta.citations,
        intent: lastMeta.intent,
        modelId: lastMeta.modelId,
      }),
    }).catch(() => {});
  };

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
    suggestions,
    sendSuggestion,
    citationsByMessage,
    feedbackByMessage,
    submitFeedback,
    statusHint,
    RoleIcon: ROLE_ICON[userRole] ?? UserRound,
    ROLE_BADGE_STYLES,
  };
}
