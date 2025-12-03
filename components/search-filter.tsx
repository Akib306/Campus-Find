"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Search, type SearchSuggestion } from "@/components/search";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

type Post = {
  id: string;
  item_name: string;
  description: string | null;
  item_category: string;
  location_name: string | null;
  image_path: string[] | null;
  post_status: string;
  created_at: string;
};

type CategoryKey = "all" | "electronic" | "stationery" | "book" | "clothing";

const CATEGORY_LABELS: Record<CategoryKey, string> = {
  all: "All Items",
  electronic: "Electronic",
  stationery: "Stationery",
  book: "Book",
  clothing: "Clothing",
};

function normalizeCategory(raw: string | null | undefined): CategoryKey {
  const v = (raw ?? "").toLowerCase().trim();
  if (v === "electronic" || v === "electronics") return "electronic";
  if (v === "stationery") return "stationery";
  if (v === "book" || v === "books") return "book";
  if (v === "clothing" || v === "clothes") return "clothing";
  return "all";
}

export default function ListingsSearchFilter() {
  const supabase = useMemo(() => createClient(), []);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>("all");

  // fetch posts from Supabase
  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (!mounted) return;

      if (error) {
        console.error("Error loading posts:", error);
        setPosts([]);
      } else {
        setPosts((data ?? []) as Post[]);
      }
      setLoading(false);
    }

    load();
    return () => {
      mounted = false;
    };
  }, [supabase]);

  const normalizedSearch = searchTerm.toLowerCase().trim();

  // build suggestions from item_name
  const suggestions = useMemo<SearchSuggestion[]>(() => {
    if (!normalizedSearch) return [];
    const seen = new Set<string>();
    const list: SearchSuggestion[] = [];
    for (const p of posts) {
      const name = p.item_name ?? "";
      const lower = name.toLowerCase();
      if (lower.includes(normalizedSearch) && !seen.has(lower)) {
        seen.add(lower);
        list.push({
          label: name,
          category: p.item_category,
          location: p.location_name,
        });
      }
      if (list.length >= 5) break;
    }
    return list;
  }, [posts, normalizedSearch]);

  // category counts for sidebar
  const categoryCounts = useMemo(() => {
    const counts: Record<CategoryKey, number> = {
      all: posts.length,
      electronic: 0,
      stationery: 0,
      book: 0,
      clothing: 0,
    };
    posts.forEach((p) => {
      const key = normalizeCategory(p.item_category);
      if (key !== "all") counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [posts]);

  // filtered list
  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      const catKey = normalizeCategory(p.item_category);
      const matchCategory =
        selectedCategory === "all" || catKey === selectedCategory;

      if (!normalizedSearch) return matchCategory;

      const name = p.item_name?.toLowerCase() ?? "";
      const desc = p.description?.toLowerCase() ?? "";
      const loc = p.location_name?.toLowerCase() ?? "";

      const matchText =
        name.includes(normalizedSearch) ||
        desc.includes(normalizedSearch) ||
        loc.includes(normalizedSearch);

      return matchCategory && matchText;
    });
  }, [posts, selectedCategory, normalizedSearch]);

  function getImageSrc(post: Post): string | null {
    if (post.image_path && post.image_path.length > 0) {
      return post.image_path[0];
    }
    return null;
  }

  return (
    <main className="min-h-screen flex flex-col px-4 md:px-10 py-8 gap-8">
      {/* header + search bar */}
      <div className="flex flex-col gap-4 items-center">
        <h1 className="text-3xl font-bold w-full max-w-5xl">Lost Items</h1>
        <p className="text-muted-foreground w-full max-w-5xl">
          Browse items that have been reported as lost.
        </p>
        <Search
          value={searchTerm}
          onChange={setSearchTerm}
          suggestions={suggestions}
          onSuggestionSelect={setSearchTerm}
          placeholder="Search by keyword, item, or location..."
        />
      </div>

      <div className="flex flex-col md:flex-row gap-8 w-full max-w-6xl mx-auto">
        {/* categories sidebar */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <h2 className="font-semibold mb-3">Categories</h2>
          <div className="flex flex-col gap-2">
            {(Object.keys(CATEGORY_LABELS) as CategoryKey[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedCategory(key)}
                className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm border ${
                  selectedCategory === key
                    ? "bg-emerald-700 text-white border-emerald-700"
                    : "bg-background hover:bg-muted"
                }`}
              >
                <span>{CATEGORY_LABELS[key]}</span>
                <span className="text-xs rounded-full px-2 py-0.5 bg-black/10 dark:bg-white/10">
                  {key === "all" ? categoryCounts.all : categoryCounts[key] ?? 0}
                </span>
              </button>
            ))}
          </div>
        </aside>

        {/* results grid */}
        <section className="flex-1">
          {loading ? (
            <p className="text-muted-foreground">Loading items...</p>
          ) : filteredPosts.length === 0 ? (
            <p className="text-muted-foreground">No items found.</p>
          ) : (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {filteredPosts.map((post) => {
                const img = getImageSrc(post);
                const catKey = normalizeCategory(post.item_category);
                return (
                  <Link key={post.id} href={`/listings/${post.id}`}>
                    <Card className="h-full flex flex-col overflow-hidden hover:shadow-lg transition-shadow">
                      {img ? (
                        <div className="relative w-full h-48">
                          <Image
                            src={img}
                            alt={post.item_name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-48 bg-muted text-muted-foreground">
                          No image
                        </div>
                      )}

                      <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2">
                        <CardTitle className="text-base font-semibold">
                          {post.item_name}
                        </CardTitle>
                        <Badge className="capitalize">
                          {catKey === "all"
                            ? post.item_category
                            : CATEGORY_LABELS[catKey]}
                        </Badge>
                      </CardHeader>

                      <CardContent className="pt-0 flex-1 flex flex-col gap-2">
                        {post.description && (
                          <CardDescription className="line-clamp-2 text-sm">
                            {post.description}
                          </CardDescription>
                        )}
                        {post.location_name && (
                          <p className="text-xs text-muted-foreground">
                             {post.location_name}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-auto">
                          {formatDistanceToNow(new Date(post.created_at), {
                            addSuffix: true,
                          })}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
