"use client";

import { Sparkles } from "lucide-react";
import { useSession } from "@/lib/auth/client";
import { useChatCopilot } from "./use-chat-copilot";
import { ChatHeader } from "./ChatHeader";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";

export function AICopilot({ enabled = true }: { enabled?: boolean }) {
  const { data: session, isPending } = useSession();
  if (!enabled || isPending || !session?.user) return null;
  return <AICopilotInner />;
}

function AICopilotInner() {
  const {
    session,
    userRole,
    locale,
    isOpen,
    hasUnread,
    messagesEndRef,
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    handleToggle,
    handleResetChat,
    RoleIcon,
    ROLE_BADGE_STYLES,
    aiUsage,
  } = useChatCopilot();

  if (!session) return null;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={handleToggle}
          className="fixed inset-0 w-screen h-screen z-40 bg-black/40 backdrop-blur-[1.5px] transition-all duration-300 cursor-pointer animate-fade-in"
        />
      )}

      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        {/* Chat Window */}
        {isOpen && (
          <div className="mb-4 w-96 max-w-[calc(100vw-2rem)] h-[540px] max-h-[80vh] flex flex-col rounded-3xl border border-border bg-card/95 backdrop-blur-xl shadow-2xl overflow-hidden animate-fade-in transition-all duration-300">
            <ChatHeader
              userRole={userRole}
              locale={locale}
              RoleIcon={RoleIcon}
              roleBadgeStyle={ROLE_BADGE_STYLES[userRole]}
              aiUsage={aiUsage}
              onReset={handleResetChat}
              onClose={handleToggle}
            />
            <ChatMessages
              messages={messages}
              isLoading={isLoading}
              messagesEndRef={messagesEndRef}
              userImage={session.user.image}
              userName={session.user.name}
            />

            <ChatInput
              input={input}
              isLoading={isLoading}
              onInputChange={handleInputChange}
              onSubmit={handleSubmit}
            />
          </div>
        )}

        {/* FAB Button */}
        {!isOpen && (
          <button
            type="button"
            onClick={handleToggle}
            className="relative h-14 w-14 rounded-full bg-gradient-to-tr from-primary to-accent text-primary-foreground flex items-center justify-center shadow-xl focus:outline-none cursor-pointer border border-white/10 select-none"
          >
            <Sparkles className="h-6 w-6" />
            {hasUnread && (
              <span className="absolute top-0 right-0 h-3.5 w-3.5 rounded-full bg-rose-500 border-2 border-card animate-pulse" />
            )}
          </button>
        )}
      </div>
    </>
  );
}
