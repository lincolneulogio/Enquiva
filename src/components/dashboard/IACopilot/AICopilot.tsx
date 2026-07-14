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
    errorMessage,
    handleToggle,
    handleResetChat,
    RoleIcon,
    ROLE_BADGE_STYLES,
    aiUsage,
    suggestions,
    sendSuggestion,
    citationsByMessage,
    feedbackByMessage,
    submitFeedback,
    statusHint,
  } = useChatCopilot();

  if (!session) return null;

  const showChips = messages.length <= 1 && !isLoading;

  return (
    <>
      {isOpen && (
        <div
          onClick={handleToggle}
          className="fixed inset-0 w-screen h-screen z-40 bg-black/40 backdrop-blur-[1.5px] transition-all duration-300 cursor-pointer animate-fade-in"
        />
      )}

      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
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
              errorMessage={errorMessage}
              messagesEndRef={messagesEndRef}
              userImage={session.user.image}
              userName={session.user.name}
              statusHint={statusHint}
              citationsByMessage={citationsByMessage}
              feedbackByMessage={feedbackByMessage}
              onFeedback={submitFeedback}
            />

            {showChips && (
              <div className="px-3 pb-2 flex flex-wrap gap-1.5 border-t border-border/40 pt-2 bg-muted/20">
                {suggestions.map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => sendSuggestion(s.prompt)}
                    className="text-[10px] px-2 py-1 rounded-full border border-border/80 bg-card hover:bg-muted text-foreground/90 transition-colors"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}

            <ChatInput
              input={input}
              isLoading={isLoading}
              userRole={userRole}
              onInputChange={handleInputChange}
              onSubmit={handleSubmit}
            />
          </div>
        )}

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
