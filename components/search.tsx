"use client";

import { SearchIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Kbd } from "@/components/ui/kbd";

type SearchProps = {
  value?: string;
  onChange?: (value: string) => void;
  suggestions?: string[];
  onSuggestionSelect?: (value: string) => void;
  placeholder?: string;
};

export function Search({
  value,
  onChange,
  suggestions = [],
  onSuggestionSelect,
  placeholder = "Search...",
}: SearchProps) {
  const searchInputRef = useRef<HTMLDivElement>(null);
  const [internalValue, setInternalValue] = useState("");

  // Support both controlled and uncontrolled use
  const currentValue = value ?? internalValue;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.value;
    if (onChange) onChange(next);
    else setInternalValue(next);
  }

  function handleSuggestionClick(text: string) {
    if (onChange) onChange(text);
    else setInternalValue(text);
    if (onSuggestionSelect) onSuggestionSelect(text);
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

  return (
    <div ref={searchInputRef} className="flex w-full max-w-2xl flex-col gap-2">
      <InputGroup>
        <InputGroupInput
          placeholder={placeholder}
          value={currentValue}
          onChange={handleChange}
        />
        <InputGroupAddon>
          <SearchIcon />
        </InputGroupAddon>
        <InputGroupAddon align="inline-end">
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </InputGroupAddon>
      </InputGroup>

      {currentValue && suggestions.length > 0 && (
        <div className="mt-1 w-full max-w-2xl rounded-md border bg-background text-sm shadow-sm">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => handleSuggestionClick(s)}
              className="block w-full px-3 py-2 text-left hover:bg-muted"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
