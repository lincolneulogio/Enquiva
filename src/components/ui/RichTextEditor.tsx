"use client";

import React, { useEffect, useCallback, useMemo, useRef } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Placeholder from "@tiptap/extension-placeholder";

// ─── Toolbar button ───────────────────────────────────────────────────────────
function ToolbarBtn({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      title={title}
      className={`inline-flex h-7 w-7 items-center justify-center rounded-lg text-xs font-semibold transition-all cursor-pointer active:scale-95
        ${active
          ? "bg-primary text-primary-foreground shadow-2xs"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
        }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-1 h-4 w-px shrink-0 bg-border/60" />;
}

// ─── Toolbar ──────────────────────────────────────────────────────────────────
function Toolbar({ editor }: { editor: Editor }) {
  const setLink = useCallback(() => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL del enlace:", prev ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-border/60 bg-muted/25 px-2.5 py-1.5 backdrop-blur-xs">
      {/* Headings */}
      <ToolbarBtn
        title="Título H1"
        active={editor.isActive("heading", { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        <span className="font-bold text-xs">H1</span>
      </ToolbarBtn>
      <ToolbarBtn
        title="Título H2"
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <span className="font-bold text-xs">H2</span>
      </ToolbarBtn>
      <ToolbarBtn
        title="Título H3"
        active={editor.isActive("heading", { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <span className="font-bold text-xs">H3</span>
      </ToolbarBtn>

      <Divider />

      {/* Inline marks */}
      <ToolbarBtn
        title="Negrita (Ctrl+B)"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <strong className="text-xs">B</strong>
      </ToolbarBtn>
      <ToolbarBtn
        title="Cursiva (Ctrl+I)"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <em className="text-xs">I</em>
      </ToolbarBtn>
      <ToolbarBtn
        title="Subrayado (Ctrl+U)"
        active={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <span className="text-xs underline">U</span>
      </ToolbarBtn>
      <ToolbarBtn
        title="Tachado"
        active={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <span className="text-xs line-through">S</span>
      </ToolbarBtn>

      <Divider />

      {/* Lists */}
      <ToolbarBtn
        title="Lista con viñetas"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="2" cy="4" r="1.2" />
          <rect x="5" y="3.3" width="9" height="1.4" rx="0.7" />
          <circle cx="2" cy="8" r="1.2" />
          <rect x="5" y="7.3" width="9" height="1.4" rx="0.7" />
          <circle cx="2" cy="12" r="1.2" />
          <rect x="5" y="11.3" width="9" height="1.4" rx="0.7" />
        </svg>
      </ToolbarBtn>
      <ToolbarBtn
        title="Lista numerada"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="currentColor">
          <text x="0" y="5" fontSize="5" fontFamily="monospace">1.</text>
          <rect x="5" y="3.3" width="9" height="1.4" rx="0.7" />
          <text x="0" y="9" fontSize="5" fontFamily="monospace">2.</text>
          <rect x="5" y="7.3" width="9" height="1.4" rx="0.7" />
          <text x="0" y="13" fontSize="5" fontFamily="monospace">3.</text>
          <rect x="5" y="11.3" width="9" height="1.4" rx="0.7" />
        </svg>
      </ToolbarBtn>

      <Divider />

      {/* Text align */}
      <ToolbarBtn
        title="Alinear izquierda"
        active={editor.isActive({ textAlign: "left" })}
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="currentColor">
          <rect x="1" y="2" width="14" height="1.5" rx="0.75" />
          <rect x="1" y="5.5" width="9" height="1.5" rx="0.75" />
          <rect x="1" y="9" width="14" height="1.5" rx="0.75" />
          <rect x="1" y="12.5" width="9" height="1.5" rx="0.75" />
        </svg>
      </ToolbarBtn>
      <ToolbarBtn
        title="Centrar"
        active={editor.isActive({ textAlign: "center" })}
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="currentColor">
          <rect x="1" y="2" width="14" height="1.5" rx="0.75" />
          <rect x="3.5" y="5.5" width="9" height="1.5" rx="0.75" />
          <rect x="1" y="9" width="14" height="1.5" rx="0.75" />
          <rect x="3.5" y="12.5" width="9" height="1.5" rx="0.75" />
        </svg>
      </ToolbarBtn>
      <ToolbarBtn
        title="Alinear derecha"
        active={editor.isActive({ textAlign: "right" })}
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="currentColor">
          <rect x="1" y="2" width="14" height="1.5" rx="0.75" />
          <rect x="6" y="5.5" width="9" height="1.5" rx="0.75" />
          <rect x="1" y="9" width="14" height="1.5" rx="0.75" />
          <rect x="6" y="12.5" width="9" height="1.5" rx="0.75" />
        </svg>
      </ToolbarBtn>

      <Divider />

      {/* Link */}
      <ToolbarBtn
        title="Insertar enlace"
        active={editor.isActive("link")}
        onClick={setLink}
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="currentColor">
          <path d="M6.354 5.5H4a3 3 0 0 0 0 6h3a3 3 0 0 0 2.83-4H9c-.086 0-.17.01-.25.031A2 2 0 0 1 7 10H4a2 2 0 0 1 0-4h1.535c.218-.376.495-.714.82-1z"/>
          <path d="M9 5.5a3 3 0 0 0-2.83 2h.034A2 2 0 0 1 9 6h3a2 2 0 0 1 0 4h-1.535a4.02 4.02 0 0 1-.82 1H12a3 3 0 0 0 0-6H9z"/>
        </svg>
      </ToolbarBtn>

      {/* Blockquote */}
      <ToolbarBtn
        title="Cita / Blockquote"
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="currentColor">
          <path d="M12 12a1 1 0 0 0 1-1V8.558a1 1 0 0 0-1-1h-1.388c0-.351.021-.703.062-1.054.062-.372.166-.703.31-.992.145-.29.331-.517.559-.683.227-.186.516-.279.868-.279V3c-.579 0-1.085.124-1.52.372a3.322 3.322 0 0 0-1.085.992 4.92 4.92 0 0 0-.62 1.458A7.712 7.712 0 0 0 9 7.558V11a1 1 0 0 0 1 1h2Zm-6 0a1 1 0 0 0 1-1V8.558a1 1 0 0 0-1-1H4.612c0-.351.021-.703.062-1.054.062-.372.166-.703.31-.992.145-.29.331-.517.559-.683.227-.186.516-.279.868-.279V3c-.579 0-1.085.124-1.52.372a3.322 3.322 0 0 0-1.085.992 4.92 4.92 0 0 0-.62 1.458A7.712 7.712 0 0 0 3 7.558V11a1 1 0 0 0 1 1h2Z"/>
        </svg>
      </ToolbarBtn>

      <Divider />

      {/* Clear formatting */}
      <ToolbarBtn
        title="Limpiar formato"
        onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8.086 2.207a2 2 0 0 1 2.828 0l2.879 2.879a2 2 0 0 1 0 2.828l-2.645 2.646.8 3.123-3.073-.847-6.571-6.574a2 2 0 0 1 0-2.828l.715-.715 5.067 5.068.043-.044L8.086 2.207zm-.585 8.874.089-.09-.235-.02-3.23-.89.072 1.028 1.423.39-1.158 1.158.708.707 1.157-1.158.39 1.423 1.028.072-.89-3.23-.02-.235-.089.08z"/>
        </svg>
      </ToolbarBtn>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
  id?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Escribe aquí...",
  className = "",
  minHeight = "180px",
  id,
}: RichTextEditorProps) {
  const lastEmittedValueRef = useRef(value);

  const extensions = useMemo(() => [
    StarterKit,
    Underline,
    Link.configure({
      openOnClick: false,
      HTMLAttributes: { class: "text-primary underline" },
    }),
    TextStyle,
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    Placeholder.configure({ placeholder }),
  ], [placeholder]);

  const editorProps = useMemo(() => ({
    attributes: {
      class: "prose prose-sm dark:prose-invert max-w-none focus:outline-none px-4 py-3",
      ...(id ? { id } : {}),
    },
  }), [id]);

  const editor = useEditor(
    {
      immediatelyRender: false,
      extensions,
      content: value || "",
      editorProps,
      onUpdate({ editor }) {
        const html = editor.getHTML();
        const nextVal = html === "<p></p>" ? "" : html;
        lastEmittedValueRef.current = nextVal;
        onChange(nextVal);
      },
    },
    [],
  );

  // Sync external value changes (e.g. AI improvement or form reset)
  useEffect(() => {
    if (!editor) return;
    if (value !== lastEmittedValueRef.current) {
      lastEmittedValueRef.current = value;
      const current = editor.getHTML();
      const currentNormalized = current === "<p></p>" ? "" : current;
      const incomingNormalized = value || "";
      if (currentNormalized !== incomingNormalized) {
        editor.commands.setContent(incomingNormalized, { emitUpdate: false });
      }
    }
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div
      className={`overflow-hidden rounded-xl border border-border/80 bg-background/90 transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 shadow-2xs hover:border-border ${className}`}
    >
      <Toolbar editor={editor} />
      <EditorContent
        editor={editor}
        style={{ minHeight }}
        className="cursor-text"
      />
    </div>
  );
}
