"use client";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CategorySidebar } from "@/components/category-sidebar";
import { LostItemsGrid } from "@/components/lost-items-grid";

export default function DashboardClient({ initialCounts }: { initialCounts: Record<string, number> }) {
  const [categoryCounts, setCategoryCounts] = useState(initialCounts);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const fetchCategoryCounts = async () => {
      try {
        // Fetch all open posts to calculate counts
        const { data, error } = await supabase
          .from("posts")
          .select("item_category")
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
      } catch (err) {
        console.error("Error fetching category counts:", err);
      }
    };

    fetchCategoryCounts();

    // Subscribe to real-time updates
    const channel = supabase
      .channel("category-counts-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "posts", filter: "post_status=eq.open" },
        fetchCategoryCounts
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };

  }, [supabase]);

  return (
    <>
      <CategorySidebar
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        categoryCounts={categoryCounts}
      />
      <LostItemsGrid categoryFilter={selectedCategory} />
    </>
  );
} 