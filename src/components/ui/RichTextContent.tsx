"use client";

import React, { useMemo } from "react";
import { cn } from "@/lib/utils";

interface RichTextContentProps {
  content?: string | null;
  className?: string;
  fallback?: string;
}

/**
 * Basic safe sanitizer for rich text content produced by TipTap or AI.
 * Strips script, style, iframe, object, embed, and dangerous event handlers.
 */
function sanitizeRichHtml(html: string): string {
  if (!html) return "";

  // Remove dangerous tags and their content
  let clean = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "")
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, "");

  // Remove dangerous attributes (on*, javascript:, data:)
  clean = clean
    .replace(/\son\w+\s*=\s*(['"]).*?\1/gi, "")
    .replace(/\son\w+\s*=\s*[^>\s]+/gi, "")
    .replace(/href\s*=\s*(['"])javascript:.*?\1/gi, 'href="#"')
    .replace(/src\s*=\s*(['"])javascript:.*?\1/gi, 'src=""');

  return clean;
}

/** Check if string contains HTML tags */
function hasHtmlTags(str: string): boolean {
  return /<[a-z][\s\S]*>/i.test(str);
}

export function RichTextContent({
  content,
  className,
  fallback = "Sin descripción disponible.",
}: RichTextContentProps) {
  const renderedHtml = useMemo(() => {
    const raw = content?.trim() || fallback;

    if (hasHtmlTags(raw)) {
      return sanitizeRichHtml(raw);
    }

    // Convert plain text with newlines to paragraphs
    return raw
      .split(/\n{2,}/)
      .map((paragraph) => `<p>${paragraph.replace(/\n/g, "<br />")}</p>`)
      .join("");
  }, [content, fallback]);

  return (
    <div
      className={cn(
        "prose prose-sm sm:prose-base max-w-none text-muted-foreground dark:prose-invert",
        "prose-p:leading-relaxed prose-p:my-2",
        "prose-strong:font-bold prose-strong:text-foreground",
        "prose-headings:font-bold prose-headings:text-foreground prose-headings:tracking-tight",
        "prose-h1:text-xl prose-h2:text-lg prose-h3:text-base",
        "prose-a:text-primary prose-a:underline hover:prose-a:text-primary/80",
        "prose-ul:my-2 prose-ul:list-disc prose-ul:pl-5",
        "prose-ol:my-2 prose-ol:list-decimal prose-ol:pl-5",
        "prose-li:my-0.5",
        "prose-blockquote:border-l-2 prose-blockquote:border-primary/40 prose-blockquote:pl-3 prose-blockquote:italic",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
}
