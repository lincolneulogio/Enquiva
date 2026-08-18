"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Loader2, MapPin } from "lucide-react";
import {
  searchAddressSuggestions,
  type PlaceSuggestion,
} from "@/lib/geo/nominatim";
import { cn } from "@/lib/utils";

type VenueAddressAutocompleteProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onSelectSuggestion: (suggestion: PlaceSuggestion) => void;
  placeholder?: string;
  invalid?: boolean;
  describedBy?: string;
  className?: string;
  inputClassName?: string;
};

export function VenueAddressAutocomplete({
  id,
  value,
  onChange,
  onSelectSuggestion,
  placeholder,
  invalid,
  describedBy,
  className,
  inputClassName,
}: VenueAddressAutocompleteProps) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const skipNextSearch = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const blurTimer = useRef<number | null>(null);

  useEffect(() => {
    if (skipNextSearch.current) {
      skipNextSearch.current = false;
      return;
    }

    const q = value.trim();
    if (q.length < 3) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    const timer = window.setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      try {
        const results = await searchAddressSuggestions(q, 6, controller.signal);
        if (!controller.signal.aborted) {
          setSuggestions(results);
          setOpen(results.length > 0);
          setActiveIndex(-1);
        }
      } catch {
        if (!controller.signal.aborted) {
          setSuggestions([]);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 350);

    return () => {
      window.clearTimeout(timer);
      abortRef.current?.abort();
    };
  }, [value]);

  const pick = useCallback(
    (suggestion: PlaceSuggestion) => {
      skipNextSearch.current = true;
      setSuggestions([]);
      setOpen(false);
      onChange(suggestion.label);
      onSelectSuggestion(suggestion);
    },
    [onChange, onSelectSuggestion],
  );

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          id={id}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            if (suggestions.length > 0) setOpen(true);
          }}
          onBlur={() => {
            blurTimer.current = window.setTimeout(() => setOpen(false), 150);
          }}
          onKeyDown={(e) => {
            if (!open || suggestions.length === 0) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActiveIndex((i) => Math.max(i - 1, 0));
            } else if (e.key === "Enter" && activeIndex >= 0) {
              e.preventDefault();
              pick(suggestions[activeIndex]!);
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-invalid={invalid}
          aria-describedby={describedBy}
          placeholder={placeholder}
          autoComplete="off"
          className={cn(
            "w-full rounded-xl border border-border bg-background pl-9 pr-9 py-2.5 text-sm focus:border-primary focus:outline-none",
            inputClassName,
          )}
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {open && suggestions.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-border bg-background py-1 shadow-lg"
          onMouseDown={(e) => e.preventDefault()}
        >
          {suggestions.map((item, index) => (
            <li key={item.id} role="option" aria-selected={index === activeIndex}>
              <button
                type="button"
                className={cn(
                  "flex w-full items-start gap-2 px-3 py-2 text-left text-xs hover:bg-muted",
                  index === activeIndex && "bg-muted",
                )}
                onClick={() => {
                  if (blurTimer.current) window.clearTimeout(blurTimer.current);
                  pick(item);
                }}
              >
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                <span className="leading-snug text-foreground">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
