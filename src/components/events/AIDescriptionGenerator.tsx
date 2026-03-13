"use client";

import { useEffect, useState } from "react";
import { useCompletion } from "ai/react";
import { Sparkles, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "@/components/providers/LocaleProvider";

type AIModel =
  | "auto"
  | "google/gemma-3-4b-it:free"
  | "google/gemma-3-12b-it:free"
  | "meta-llama/llama-3.2-3b-instruct:free";

const AI_MODEL_STORAGE_KEY = "faithEvents.aiModel";
const ALLOWED_MODELS: AIModel[] = [
  "auto",
  "google/gemma-3-4b-it:free",
  "google/gemma-3-12b-it:free",
  "meta-llama/llama-3.2-3b-instruct:free",
];

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
  const [model, setModel] = useState<AIModel>("auto");
  const [usedModel, setUsedModel] = useState<string | null>(null);

  useEffect(() => {
    try {
      const savedModel = localStorage.getItem(AI_MODEL_STORAGE_KEY);
      if (
        savedModel &&
        ALLOWED_MODELS.includes(savedModel as AIModel)
      ) {
        setModel(savedModel as AIModel);
      }
    } catch {
      // Ignore storage access issues (private mode, blocked storage, etc.)
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(AI_MODEL_STORAGE_KEY, model);
    } catch {
      // Ignore storage access issues (private mode, blocked storage, etc.)
    }
  }, [model]);

  const { complete, isLoading, completion } = useCompletion({
    api: "/api/ai/generate",
    onResponse: (response) => {
      const modelFromHeader = response.headers.get("x-ai-model");
      if (modelFromHeader) {
        setUsedModel(modelFromHeader);
      }
    },
    onFinish: (_, completion) => {
      const generated = completion.trim();
      if (!generated) {
        toast.error(t("events.ai.emptyTextError"));
        return;
      }
      onGenerated(generated);
      toast.success(t("events.ai.success"));
    },
    onError: (error) => {
      const message = error.message.toLowerCase();

      if (message.includes("quota") || message.includes("rate limit")) {
        toast.error(t("events.ai.quotaExceeded"));
        return;
      }

      if (
        message.includes("api key") ||
        message.includes("credential") ||
        message.includes("configuration")
      ) {
        toast.error(t("events.ai.providerConfigError"));
        return;
      }

      if (
        message.includes("temporarily unavailable") ||
        message.includes("provider returned error") ||
        message.includes("no endpoints available")
      ) {
        toast.error(t("events.ai.providerUnavailable"));
        return;
      }

      toast.error(error.message || t("events.ai.failed"));
    },
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
      body: { title, category, bulletPoints: validPoints, tone, model },
    });
  };

  const modelLabelMap: Record<string, string> = {
    "google/gemma-3-4b-it:free": "Gemma 3 4B (free)",
    "google/gemma-3-12b-it:free": "Gemma 3 12B (free)",
    "meta-llama/llama-3.2-3b-instruct:free": "Llama 3.2 3B (free)",
    "local-template": "Plantilla local (fallback)",
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

      <div className="mb-3 space-y-1">
        <label className="text-xs text-muted-foreground">
          {t("events.ai.modelLabel")}
        </label>
        <select
          value={model}
          onChange={(e) =>
            setModel(e.target.value as AIModel)
          }
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
        >
          <option value="auto">{t("events.ai.modelAuto")}</option>
          <option value="google/gemma-3-4b-it:free">Gemma 3 4B (free)</option>
          <option value="google/gemma-3-12b-it:free">Gemma 3 12B (free)</option>
          <option value="meta-llama/llama-3.2-3b-instruct:free">Llama 3.2 3B (free)</option>
        </select>
        {usedModel && (
          <p className="text-[11px] text-muted-foreground">
            {t("events.ai.usingModel", {
              model: modelLabelMap[usedModel] ?? usedModel,
            })}
          </p>
        )}
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
