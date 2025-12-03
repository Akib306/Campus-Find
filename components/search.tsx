"use client";

import { SearchIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Kbd } from "@/components/ui/kbd";

export type SearchSuggestion = {
  label: string;
  category?: string | null;
  location?: string | null;
  count?: number;
};

type SearchProps = {
  value?: string;
  onChange?: (value: string) => void;
  suggestions?: SearchSuggestion[];
  onSuggestionSelect?: (value: string) => void;
  placeholder?: string;
  closeOnMouseLeaveSelector?: string;
  forceCloseKey?: number;
};

export function Search({
  value,
  onChange,
  suggestions = [],
  onSuggestionSelect,
  placeholder = "Search...",
  closeOnMouseLeaveSelector,
  forceCloseKey,
}: SearchProps) {
  const searchInputRef = useRef<HTMLDivElement>(null);
  const [internalValue, setInternalValue] = useState("");
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Support both controlled and uncontrolled use
  const currentValue = value ?? internalValue;
  const normalizedQuery = currentValue.trim().toLowerCase();

  useEffect(() => {
    const saved = localStorage.getItem("recentSearches");
    if (saved) setRecentSearches(JSON.parse(saved));
  }, []);

  // Only auto-close when query is cleared; don't auto-open based on value
  useEffect(() => {
    if (!normalizedQuery) setOpen(false);
  }, [normalizedQuery]);

  useEffect(() => {
    if (forceCloseKey !== undefined) {
      setOpen(false);
      setHighlightIndex(-1);
    }
  }, [forceCloseKey]);

  useEffect(() => {
    if (!closeOnMouseLeaveSelector) return;
    const el = document.querySelector<HTMLElement>(closeOnMouseLeaveSelector);
    if (!el) return;
    const onLeave = () => setOpen(false);
    el.addEventListener("mouseleave", onLeave);
    return () => el.removeEventListener("mouseleave", onLeave);
  }, [closeOnMouseLeaveSelector]);

  const suggestionList = useMemo(() => suggestions ?? [], [suggestions]);

  const visibleSuggestions = useMemo(() => {
    if (!normalizedQuery) {
      // show recent then popular (by count)
      const recentItems = recentSearches
        .map((term) => {
          const match = suggestionList.find(
            (s) => s.label.toLowerCase() === term.toLowerCase()
          );
          return (
            match || {
              label: term,
            }
          );
        })
        .slice(0, 5);

      const popular = [...suggestionList]
        .sort((a, b) => (b.count || 0) - (a.count || 0))
        .filter(
          (s) =>
            !recentItems.some(
              (r) => r.label.toLowerCase() === s.label.toLowerCase()
            )
        )
        .slice(0, 5);

      return [...recentItems, ...popular];
    }

    const prefixMatches = suggestionList.filter((s) =>
      s.label.toLowerCase().startsWith(normalizedQuery)
    );
    if (prefixMatches.length > 0) {
      return prefixMatches.slice(0, 10);
    }

    const substringMatches = suggestionList.filter((s) =>
      s.label.toLowerCase().includes(normalizedQuery)
    );
    return substringMatches.slice(0, 10);
  }, [normalizedQuery, recentSearches, suggestionList]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.value;
    setOpen(true);
    setHighlightIndex(-1);
    if (onChange) onChange(next);
    else setInternalValue(next);
  }

  function saveRecent(term: string) {
    if (!term.trim()) return;
    setRecentSearches((prev) => {
      const next = [term, ...prev.filter((t) => t.toLowerCase() !== term.toLowerCase())].slice(0, 8);
      localStorage.setItem("recentSearches", JSON.stringify(next));
      return next;
    });
  }

  function handleSuggestionClick(text: string) {
    if (onChange) onChange(text);
    else setInternalValue(text);
    if (onSuggestionSelect) onSuggestionSelect(text);
    setOpen(false);
    setHighlightIndex(-1);
    saveRecent(text);
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();

        const input = searchInputRef.current?.querySelector<HTMLInputElement>(
          "input[data-slot='input-group-control']",
        );

        if (!input) return;

        if (document.activeElement === input) {
          input.blur();
        } else {
          input.select();
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Close suggestions when clicking outside of the search container
  useEffect(() => {
    function onDocumentMouseDown(e: MouseEvent) {
      const root = searchInputRef.current;
      if (!root) return;
      const target = e.target as Node | null;
      if (target && !root.contains(target)) {
        setOpen(false);
        setHighlightIndex(-1);
      }
    }
    document.addEventListener("mousedown", onDocumentMouseDown);
    return () => document.removeEventListener("mousedown", onDocumentMouseDown);
  }, []);

  return (
    <div
      ref={searchInputRef}
      className="relative flex w-full max-w-2xl flex-col gap-2"
    >
      <InputGroup>
        <InputGroupInput
          placeholder={placeholder}
          value={currentValue}
          onChange={handleChange}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
              setHighlightIndex((prev) =>
                Math.min(prev + 1, visibleSuggestions.length - 1)
              );
              return;
            }

            if (e.key === "ArrowUp") {
              e.preventDefault();
              setOpen(true);
              setHighlightIndex((prev) => Math.max(prev - 1, 0));
              return;
            }

            if (e.key === "Enter") {
              if (highlightIndex >= 0 && visibleSuggestions[highlightIndex]) {
                handleSuggestionClick(visibleSuggestions[highlightIndex].label);
              }
              setOpen(false);
              return;
            }

            if (e.key === "Enter" || e.key === "Escape") {
              setOpen(false);
            } else {
              setOpen(true);
            }
          }}
        />
        <InputGroupAddon>
          <SearchIcon />
        </InputGroupAddon>
        <InputGroupAddon align="inline-end">
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </InputGroupAddon>
      </InputGroup>

      {open && (
        <div className="absolute top-full mt-1 left-0 right-0 z-50 w-full rounded-md border bg-background text-sm shadow-sm max-h-72 overflow-auto">
          {visibleSuggestions.length === 0 ? (
            <div className="px-3 py-2 text-muted-foreground">No matches</div>
          ) : (
            visibleSuggestions.map((s, idx) => (
              <button
                key={`${s.label}-${idx}`}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSuggestionClick(s.label)}
                className={`flex w-full items-center justify-between px-3 py-2 text-left hover:bg-muted ${
                  idx === highlightIndex ? "bg-muted" : ""
                }`}
              >
                <span className="flex flex-col">
                  <span
                    className="font-medium"
                    dangerouslySetInnerHTML={{
                      __html: highlightMatch(s.label, normalizedQuery),
                    }}
                  />
                  {(s.category || s.location) && (
                    <span className="text-xs text-muted-foreground">
                      {[s.category, s.location].filter(Boolean).join(" • ")}
                    </span>
                  )}
                </span>
                {s.count ? (
                  <span className="text-[10px] rounded-full bg-muted px-2 py-0.5 text-foreground/70">
                    {s.count}
                  </span>
                ) : null}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function highlightMatch(label: string, query: string) {
  if (!query) return label;
  const index = label.toLowerCase().indexOf(query);
  if (index === -1) return label;
  const before = label.slice(0, index);
  const match = label.slice(index, index + query.length);
  const after = label.slice(index + query.length);
  return `${escapeHtml(before)}<strong>${escapeHtml(match)}</strong>${escapeHtml(after)}`;
}

function escapeHtml(str: string) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
