"use client";

import { Search } from "@/components/search";
import { useSearch } from "@/components/search-context";
import { useState } from "react";

export function NavbarSearch() {
  const { searchTerm, setSearchTerm, suggestions } = useSearch();
  const [closeKey, setCloseKey] = useState(0);

  return (
    <div
      onMouseLeave={() => setCloseKey((k) => k + 1)}
      className="w-full"
    >
      <Search
        value={searchTerm}
        onChange={setSearchTerm}
        suggestions={suggestions}
        onSuggestionSelect={setSearchTerm}
        placeholder="Search..."
        closeOnMouseLeaveSelector="[data-navbar-root]"
        forceCloseKey={closeKey}
      />
    </div>
  );
}
