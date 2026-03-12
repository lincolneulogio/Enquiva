"use client";

import { useState } from "react";
import { useCompletion } from "ai/react";
import { Sparkles, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

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
  const [bulletPoints, setBulletPoints] = useState<string[]>(["", ""]);
  const [tone, setTone] = useState<"formal" | "casual" | "inspirational">(
    "inspirational"
  );

  const { complete, isLoading, completion } = useCompletion({
    api: "/api/ai/generate",
    onFinish: (_, completion) => {
      const generated = completion.trim();
      if (!generated) {
        toast.error("AI returned empty text. Try adding more key points.");
        return;
      }
      onGenerated(generated);
      toast.success("Description generated!");
    },
    onError: () => toast.error("Failed to generate description"),
  });

  const handleGenerate = () => {
    const validPoints = bulletPoints.filter((p) => p.trim());
    if (!title.trim()) {
      toast.error("Please enter an event title first");
      return;
    }
    if (validPoints.length === 0) {
      toast.error("Add at least one bullet point");
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
          AI Description Generator
        </span>
      </div>

      {/* Bullet points */}
      <div className="mb-3 space-y-2">
        <p className="text-xs text-muted-foreground">
          Add key points about your event:
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
              placeholder={`Point ${i + 1}...`}
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
            <Plus className="h-3 w-3" /> Add point
          </button>
        )}
      </div>

      {/* Tone selector */}
      <div className="mb-3 flex gap-2">
        {(["formal", "casual", "inspirational"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTone(t)}
            className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${tone === t
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
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
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="h-3.5 w-3.5" />
            Generate Description
          </>
        )}
      </button>
    </div>
  );
}
