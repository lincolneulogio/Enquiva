"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send, AlertCircle, CheckCircle2, Mail, Bell } from "lucide-react";
import { sendBroadcastAction } from "@/actions/events";
import { useTranslations } from "@/components/providers/LocaleProvider";
import { usePersistedFormFields } from "@/hooks/useFormPersistence";
import { formStorageKey } from "@/lib/form-persistence";
import type { MassCommunicationChannels } from "@/lib/notifications/mass-communication";

interface EventItem {
  id: string;
  title: string;
}

interface BroadcastFormProps {
  events: EventItem[];
  disabled?: boolean;
}

const DEFAULT_CHANNELS: MassCommunicationChannels = {
  email: true,
  inApp: true,
  pusher: true,
};

export function BroadcastForm({ events, disabled = false }: BroadcastFormProps) {
  const t = useTranslations();
  const router = useRouter();
  const { values, setValue, setValues, clear } = usePersistedFormFields(
    formStorageKey("organizer.broadcast"),
    {
      eventId: "",
      recipientStatus: "all" as
        | "all"
        | "registered"
        | "checked_in"
        | "waitlisted"
        | "unpaid",
      subject: "",
      message: "",
      channels: DEFAULT_CHANNELS,
    },
  );
  const { eventId, recipientStatus, subject, message, channels } = values;
  const [isPending, setIsPending] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const toggleChannel = (key: keyof MassCommunicationChannels) => {
    setValues((prev) => {
      const next = { ...prev.channels, [key]: !prev.channels[key] };
      if (!next.email && !next.inApp) {
        return prev;
      }
      return { ...prev, channels: next };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId || !subject || !message) {
      setStatus({ type: "error", text: t("dashboard.organizer.broadcastFormRequiredFields") });
      return;
    }

    setIsPending(true);
    setStatus(null);

    try {
      const res = await sendBroadcastAction({
        eventId,
        subject,
        message,
        recipientStatus,
        channels,
      });

      if (res.success) {
        setStatus({
          type: "success",
          text: t("dashboard.organizer.broadcastFormQueuedMessage", {
            count: res.recipientCount,
          }),
        });
        clear();
        router.refresh();
      } else {
        setStatus({
          type: "error",
          text:
            res.error === "NO_RECIPIENTS"
              ? t("dashboard.organizer.broadcastFormNoRecipients")
              : t("dashboard.organizer.broadcastFormSendError"),
        });
      }
    } catch (error) {
      console.error(error);
      setStatus({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : t("dashboard.organizer.broadcastFormUnexpectedError"),
      });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {status && (
        <div
          className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${
            status.type === "success"
              ? "border-green-500/20 bg-green-500/5 text-green-700 dark:text-green-400"
              : "border-red-500/20 bg-red-500/5 text-red-700 dark:text-red-400"
          }`}
        >
          {status.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
          )}
          <div>
            <p className="font-semibold">
              {status.type === "success"
                ? t("dashboard.organizer.broadcastFormSuccessTitle")
                : t("dashboard.organizer.broadcastFormErrorTitle")}
            </p>
            <p className="mt-0.5 leading-relaxed">{status.text}</p>
          </div>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="eventId" className="text-sm font-semibold text-foreground">
            {t("dashboard.organizer.broadcastFormSelectEvent")} <span className="text-destructive">*</span>
          </label>
          <select
            id="eventId"
            value={eventId}
            onChange={(e) => setValue("eventId", e.target.value)}
            disabled={disabled || isPending}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
            required
          >
            <option value="">{t("dashboard.organizer.broadcastFormSelectEventPlaceholder")}</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.title}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="recipientStatus" className="text-sm font-semibold text-foreground">
            {t("dashboard.organizer.broadcastFormFilterRecipients")} <span className="text-destructive">*</span>
          </label>
          <select
            id="recipientStatus"
            value={recipientStatus}
            onChange={(e) => setValue("recipientStatus", e.target.value as typeof recipientStatus)}
            disabled={disabled || isPending}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
            required
          >
            <option value="all">{t("dashboard.organizer.broadcastFormRecipientsAll")}</option>
            <option value="registered">{t("dashboard.organizer.broadcastFormRecipientsRegistered")}</option>
            <option value="checked_in">{t("dashboard.organizer.broadcastFormRecipientsCheckedIn")}</option>
            <option value="waitlisted">{t("dashboard.organizer.broadcastFormRecipientsWaitlisted")}</option>
            <option value="unpaid">Inscritos sin pago aprobado</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold text-foreground">{t("dashboard.organizer.broadcastFormChannels")}</p>
        <div className="flex flex-wrap gap-2">
          <ChannelToggle
            active={channels.email}
            onClick={() => toggleChannel("email")}
            icon={Mail}
            label={t("dashboard.organizer.broadcastChannelEmail")}
            disabled={disabled || isPending}
          />
          <ChannelToggle
            active={channels.inApp}
            onClick={() => toggleChannel("inApp")}
            icon={Bell}
            label={t("dashboard.organizer.broadcastChannelInApp")}
            disabled={disabled || isPending}
          />
        </div>
        <p className="text-xs text-muted-foreground">{t("dashboard.organizer.broadcastFormChannelsNote")}</p>
      </div>

      <div className="space-y-2">
        <label htmlFor="subject" className="text-sm font-semibold text-foreground">
          {t("dashboard.organizer.broadcastFormSubject")} <span className="text-destructive">*</span>
        </label>
        <input
          id="subject"
          type="text"
          value={subject}
          onChange={(e) => setValue("subject", e.target.value)}
          placeholder={t("dashboard.organizer.broadcastFormSubjectPlaceholder")}
          disabled={disabled || isPending}
          className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="message" className="text-sm font-semibold text-foreground">
          {t("dashboard.organizer.broadcastFormMessage")} <span className="text-destructive">*</span>
        </label>
        <textarea
          id="message"
          value={message}
          onChange={(e) => setValue("message", e.target.value)}
          placeholder={t("dashboard.organizer.broadcastFormMessagePlaceholder")}
          rows={8}
          disabled={disabled || isPending}
          className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 font-sans"
          required
        />
        <p className="text-xs text-muted-foreground">
          {t("dashboard.organizer.broadcastFormMessageNote")}
        </p>
      </div>

      <button
        type="submit"
        disabled={disabled || isPending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-70 sm:w-auto"
      >
        {isPending ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            {t("dashboard.organizer.broadcastFormSending")}
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            {t("dashboard.organizer.broadcastFormSubmit")}
          </>
        )}
      </button>
    </form>
  );
}

function ChannelToggle({
  active,
  onClick,
  icon: Icon,
  label,
  disabled,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-muted/40 text-muted-foreground"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
