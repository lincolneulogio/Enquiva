"use client";

import { useState } from "react";
import { useCompletion } from "ai/react";
import { Sparkles, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "@/components/providers/LocaleProvider";

interface AIDescriptionGeneratorProps {
  title: string;
  category: string;
  onGenerated: (description: string) => void;
}

export function AIDescriptionGenerator({
  title,
  category,
  onGenerated,
}: AIDescriptionGeneratorProps) {
  const t = useTranslations();
  const [bulletPoints, setBulletPoints] = useState<string[]>(["", ""]);
  const [tone, setTone] = useState<"formal" | "casual" | "inspirational">(
    "inspirational"
  );

  const { complete, isLoading, completion } = useCompletion({
    api: "/api/ai/generate",
    onFinish: (_, completion) => {
      const generated = completion.trim();
      if (!generated) {
        toast.error(t("events.ai.emptyTextError"));
        return;
      }
      onGenerated(generated);
      toast.success(t("events.ai.success"));
    },
    onError: () => toast.error(t("events.ai.failed")),
  });

  const handleGenerate = () => {
    const validPoints = bulletPoints.filter((p) => p.trim());
    if (!title.trim()) {
      toast.error(t("events.ai.noTitleError"));
      return;
    }
    if (validPoints.length === 0) {
      toast.error(t("events.ai.noPointsError"));
      return;
    }

    complete("", {
      body: { title, category, bulletPoints: validPoints, tone },
    });
  };

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium text-foreground">
          {t("events.ai.title")}
        </span>
      </div>

      {/* Bullet points */}
      <div className="mb-3 space-y-2">
        <p className="text-xs text-muted-foreground">
          {t("events.ai.keyPoints")}
        </p>
        {bulletPoints.map((point, i) => (
          <div key={i} className="flex gap-2">
            <input
              value={point}
              onChange={(e) => {
                const updated = [...bulletPoints];
                updated[i] = e.target.value;
                setBulletPoints(updated);
              }}
              placeholder={t("events.ai.pointPlaceholder", { index: i + 1 })}
              className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
            />
            {bulletPoints.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setBulletPoints(bulletPoints.filter((_, idx) => idx !== i))
                }
                className="rounded-lg p-1.5 text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
        {bulletPoints.length < 8 && (
          <button
            type="button"
            onClick={() => setBulletPoints([...bulletPoints, ""])}
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <Plus className="h-3 w-3" /> {t("events.ai.addPoint")}
          </button>
        )}
      </div>

      {/* Tone selector */}
      <div className="mb-3 flex gap-2">
        {(["formal", "casual", "inspirational"] as const).map((toneOption) => (
          <button
            key={toneOption}
            type="button"
            onClick={() => setTone(toneOption)}
            className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${tone === toneOption
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
          >
            {toneOption === "formal"
              ? t("events.ai.toneFormal")
              : toneOption === "casual"
                ? t("events.ai.toneCasual")
                : t("events.ai.toneInspirational")}
          </button>
        ))}
      </div>

      {/* Preview */}
      {completion && (
        <div className="mb-3 max-h-32 overflow-y-auto rounded-lg bg-background p-3 text-xs text-muted-foreground leading-relaxed">
          {completion}
        </div>
      )}

      <button
        type="button"
        onClick={handleGenerate}
        disabled={isLoading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            {t("events.ai.generating")}
          </>
        ) : (
          <>
            <Sparkles className="h-3.5 w-3.5" />
            {t("events.ai.generateDescription")}
          </>
        )}
      </button>
    </div>
  );
}
