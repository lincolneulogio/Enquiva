"use client";

import { Sparkles } from "lucide-react";
import { useState } from "react";
import dynamic from "next/dynamic";
import type { AiUsage, CopilotUser } from "./use-chat-copilot";

const AICopilotPanel = dynamic(
  () => import("./AICopilotPanel").then((m) => m.AICopilotPanel),
  { ssr: false },
);

export type { CopilotUser };

export function AICopilot({
  enabled = true,
  initialAiUsage = null,
  user,
}: {
  enabled?: boolean;
  initialAiUsage?: AiUsage | null;
  user: CopilotUser;
}) {
  const [openedOnce, setOpenedOnce] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  if (!enabled) return null;

  const handleToggle = () => {
    setOpenedOnce(true);
    setIsOpen((open) => !open);
  };

  if (!openedOnce) {
    return (
      <div className="fixed bottom-6 right-6 z-[80]">
        <button
          type="button"
          onClick={handleToggle}
          className="relative h-14 w-14 rounded-full bg-gradient-to-tr from-primary to-accent text-primary-foreground flex items-center justify-center shadow-xl focus:outline-none cursor-pointer border border-white/10 select-none"
          aria-label="Abrir asistente"
        >
          <Sparkles className="h-6 w-6" />
        </button>
      </div>
    );
  }

  return (
    <AICopilotPanel
      user={user}
      initialAiUsage={initialAiUsage}
      isOpen={isOpen}
      onToggle={handleToggle}
    />
  );
}
