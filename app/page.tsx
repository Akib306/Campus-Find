"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { LostItemsGrid } from "@/components/lost-items-grid";
import { CategorySidebar } from "@/components/category-sidebar";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Search } from "@/components/search";

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>(
    {}
  );

  // search state
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const fetchCategoryCountsAndSuggestions = async () => {
      try {
        // Fetch all open posts to calculate counts and suggestions
        const { data, error } = await supabase
          .from("posts")
          .select("item_category, item_name")
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

        // Build simple keyword suggestions from item names
        const nameSet = new Set<string>();
        (data || []).forEach((row) => {
          if (row.item_name && typeof row.item_name === "string") {
            nameSet.add(row.item_name.trim());
          }
        });

        setSuggestions(Array.from(nameSet).slice(0, 10)); // cap at 10
      } catch (err) {
        console.error("Error fetching category counts:", err);
      }
    };

    fetchCategoryCountsAndSuggestions();

    // Subscribe to real-time updates for counts
    const channel = supabase
      .channel("category-counts-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "posts",
          filter: "post_status=eq.open",
        },
        () => {
          fetchCategoryCountsAndSuggestions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  return (
    <main className="min-h-screen flex flex-col">
      <div className="flex-1 w-full flex flex-col items-center">
        <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-4">
            <h1 className="text-3xl font-bold mb-2">Lost Items</h1>
            <p className="text-muted-foreground">
              Browse items that have been reported as lost
            </p>
          </div>

          {/* Page search bar (this one actually controls filtering) */}
          <div className="w-full flex justify-center mb-8">
            <div className="w-full max-w-2xl">
              <Search
                value={searchTerm}
                onChange={setSearchTerm}
                suggestions={suggestions}
                placeholder="Search lost items..."
             />
            </div>
          </div>

          {/* <div className="mb-6 max-w-2xl">
            <Search
              value={searchTerm}
              onChange={setSearchTerm}
              suggestions={suggestions}
              placeholder="Search lost items..."
            />
          </div> */}

          {/* Layout: sidebar + grid */}
          <div className="flex flex-col md:flex-row gap-8">
            <CategorySidebar
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              categoryCounts={categoryCounts}
            />
            <div className="flex-1">
              <LostItemsGrid
                categoryFilter={selectedCategory}
                searchFilter={searchTerm}
              />
            </div>
          </div>
        </div>
      </div>

      <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-16">
        <ThemeSwitcher />
      </footer>
    </main>
  );
}
