"use client";

import {
  createContext,
  useContext,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import type { SearchSuggestion } from "./search";

type SearchContextValue = {
  searchTerm: string;
  setSearchTerm: Dispatch<SetStateAction<string>>;
  suggestions: SearchSuggestion[];
  setSuggestions: Dispatch<SetStateAction<SearchSuggestion[]>>;
};

const SearchContext = createContext<SearchContextValue | null>(null);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);

  return (
    <SearchContext.Provider
      value={{ searchTerm, setSearchTerm, suggestions, setSuggestions }}
    >
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const ctx = useContext(SearchContext);
  if (!ctx) {
    throw new Error("useSearch must be used within a SearchProvider");
  }
  return ctx;
}
