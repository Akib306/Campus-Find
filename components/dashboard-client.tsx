"use client";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CategorySidebar } from "@/components/category-sidebar";
import { LostItemsGrid } from "@/components/lost-items-grid";
import { useSearch } from "@/components/search-context";
import type { SearchSuggestion } from "@/components/search";

export default function DashboardClient({ initialCounts }: { initialCounts: Record<string, number> }) {
  const [categoryCounts, setCategoryCounts] = useState(initialCounts);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const supabase = useMemo(() => createClient(), []);
  const { searchTerm, setSuggestions } = useSearch();

  useEffect(() => {
    const fetchCategoryCountsAndSuggestions = async () => {
      try {
        // Fetch all open posts to calculate counts and build search suggestions
        const { data, error } = await supabase
          .from("posts")
          .select("item_category, item_name, location_name")
          .eq("post_status", "open");

        if (error) throw error;

        // Calculate counts
        const counts: Record<string, number> = {
          all: data?.length || 0,
        };

        const categories = ["electronic", "stationery", "book", "clothing"];
        categories.forEach((cat) => {
          counts[cat] =
            data?.filter((post) => post.item_category === cat).length || 0;
        });

        setCategoryCounts(counts);

        // Build keyword suggestions from item names
        const suggestionMap = new Map<string, SearchSuggestion>();
        (data || []).forEach((row) => {
          if (row.item_name && typeof row.item_name === "string") {
            const key = row.item_name.trim();
            const existing = suggestionMap.get(key) || {
              label: key,
              category: row.item_category ?? null,
              location: row.location_name ?? null,
              count: 0,
            };
            suggestionMap.set(key, {
              ...existing,
              count: (existing.count || 0) + 1,
              category: existing.category ?? row.item_category ?? null,
              location: existing.location ?? row.location_name ?? null,
            });
          }
        });
        setSuggestions(Array.from(suggestionMap.values()));
      } catch (err) {
        console.error("Error fetching category counts:", err);
      }
    };

    fetchCategoryCountsAndSuggestions();

    // Subscribe to real-time updates
    const channel = supabase
      .channel("category-counts-changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "posts" },
        fetchCategoryCountsAndSuggestions
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "posts" },
        fetchCategoryCountsAndSuggestions
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "posts" },
        fetchCategoryCountsAndSuggestions
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };

  }, [supabase, setSuggestions]);

  return (
    <>
      <CategorySidebar
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        categoryCounts={categoryCounts}
      />
      <LostItemsGrid categoryFilter={selectedCategory} searchFilter={searchTerm} />
    </>
  );
} 