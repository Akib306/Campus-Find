"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";

type ProductItem = {
  id: string;
  image_url?: string | null;
  title?: string | null;
  description?: string | null;
  category?: string | null;

};

export function SearchFilter() {
  const supabase = useMemo(() => createClient(), []);

  const [items, setItems] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("All");
  const [sortOption, setSortOption] = useState("default");
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<ProductItem | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // --- helpers ---
  const getImageSrc = (
    candidate: string | null | undefined,
    fallback: string
  ): string => {
    if (typeof candidate !== "string") return fallback;
    const trimmed = candidate.trim();
    return trimmed.length > 0 ? trimmed : fallback;
  };

  // --- fetch data from Supabase ---
  useEffect(() => {
    let isMounted = true;

    (async () => {
      setLoading(true);

      const { data, error } = await supabase.from("products").select("*");

      if (error) {
        console.error("Error fetching products:", error);
      } else if (isMounted) {
        const typedData = (data || []) as ProductItem[];
        setItems(typedData);

        const uniqueCategories = Array.from(
          new Set(
            typedData
              .map((item) => item.category?.trim())
              .filter((c): c is string => !!c)
          )
        );
        setCategories(uniqueCategories);
      }

      setLoading(false);
    })();

    return () => {
      isMounted = false;
    };
  }, [supabase]);

  // --- keyword suggestions for US-Search-01 ---
  const suggestions = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return [];

    const matches = items.filter((item) =>
      (item.title ?? "").toLowerCase().includes(query)
    );

    const titles = Array.from(
      new Set(
        matches
          .map((item) => item.title?.trim())
          .filter((t): t is string => !!t)
      )
    );

    return titles.slice(0, 5); 
  }, [items, searchTerm]);

  // --- filtering & sorting ---
  const filteredItems = items.filter((item) => {
    const title = item.title ?? "";
    const itemCategory = (item.category?.trim() ?? "").toLowerCase();
    const query = searchTerm.toLowerCase();

    const matchesSearch = title.toLowerCase().includes(query); 
    const matchesCategory =
      category === "All" || itemCategory === category.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    switch (sortOption) {
      case "titleAZ":
        return (a.title ?? "").localeCompare(b.title ?? "");
      case "titleZA":
        return (b.title ?? "").localeCompare(a.title ?? "");
      default:
        return 0;
    }
  });

  // --- pagination ---
  const totalPages = Math.max(1, Math.ceil(sortedItems.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = sortedItems.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const goToPage = (page: number) => setCurrentPage(page);
  const nextPage = () => setCurrentPage((p) => Math.min(p + 1, totalPages));
  const prevPage = () => setCurrentPage((p) => Math.max(p - 1, 1));

  const renderPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => goToPage(i)}
          className={`px-3 py-1 rounded ${
            currentPage === i
              ? "bg-blue-500 text-white"
              : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
          }`}
        >
          {i}
        </button>
      );
    }
    return pages;
  };

  // --- JSX ---
  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-10 transition-colors duration-300 relative">
      <h1 className="text-3xl font-bold mb-8 text-gray-800 dark:text-gray-100 text-center">
        Search Lost &amp; Found Items
      </h1>

      {/* Category Tabs */}
      <div className="flex flex-wrap justify-center gap-3 mb-6">
        {["All", ...categories].map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setCategory(cat);
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-full border text-sm font-medium transition-all duration-300 ${
              category === cat
                ? "bg-blue-500 text-white border-blue-500"
                : "bg-transparent text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-gray-800"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap justify-center gap-3 mb-8">
        {/* search + suggestions */}
        <div className="relative w-56">
          <input
            type="text"
            placeholder="Search by keyword..."
            className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg px-4 py-2 text-sm text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />

          {/* Suggestions dropdown */}
          {searchTerm.trim() && suggestions.length > 0 && (
            <ul className="absolute z-10 mt-1 w-full rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg max-h-48 overflow-y-auto text-sm">
              {suggestions.map((title) => (
                <li key={title}>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm(title);
                      setCurrentPage(1);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-blue-50 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-100"
                  >
                    {title}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* sort options (title only) */}
        <select
          className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg px-4 py-2 text-sm text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          value={sortOption}
          onChange={(e) => {
            setSortOption(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="default">Sort by</option>
          <option value="titleAZ">Title: A → Z</option>
          <option value="titleZA">Title: Z → A</option>
        </select>
      </div>

      {/* Product Grid */}
      {loading ? (
        <p className="text-gray-500 text-center dark:text-gray-400">
          Loading...
        </p>
      ) : paginatedItems.length > 0 ? (
        <>
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 max-w-6xl w-full">
            {paginatedItems.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="cursor-pointer bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden transform hover:-translate-y-1 hover:scale-[1.03] hover:border-blue-400 transition-all duration-300 hover:shadow-2xl border border-gray-100 dark:border-gray-700"
              >
                <div className="relative w-full aspect-[4/3]">
                  <Image
                    src={getImageSrc(
                      item.image_url,
                      "https://i.postimg.cc/pdDrc2VN/dlxmedia-hu-Ukp-TGYox6RM-unsplash.jpg"
                    )}
                    alt={item.title || "Item image"}
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-100 mb-1">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-2 line-clamp-2">
                    {item.description}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    Category: {item.category}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex justify-center items-center gap-2 mt-10">
            <button
              onClick={prevPage}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded disabled:opacity-50 hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Previous
            </button>
            {renderPageNumbers()}
            <button
              onClick={nextPage}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded disabled:opacity-50 hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Next
            </button>
          </div>
        </>
      ) : (
        <p className="text-gray-500 dark:text-gray-400 text-center col-span-full mt-6">
          No items found.
        </p>
      )}

      {/* Quick View Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 w-[90%] max-w-md relative">
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-3 right-3 text-gray-500 dark:text-gray-300 hover:text-red-500"
            >
              ✕
            </button>
            <Image
              src={getImageSrc(
                selectedItem.image_url,
                "https://i.postimg.cc/pdDrc2VN/dlxmedia-hu-Ukp-TGYox6RM-unsplash.jpg"
              )}
              alt={selectedItem.title || "Item image"}
              width={1200}
              height={800}
              className="rounded-md mb-4"
            />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {selectedItem.title}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-3">
              {selectedItem.description}
            </p>
            <p className="text-sm text-blue-600 dark:text-blue-400">
              Category: {selectedItem.category}
            </p>
          </div>
        </div>
      )}
    </main>
  );
}