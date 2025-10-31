"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SearchPage() {
  const supabase = createClient();
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("All");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortOption, setSortOption] = useState("default");
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any | null>(null); // for modal

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    fetchItems();
  }, []);

  async function fetchItems() {
    setLoading(true);
    const { data, error } = await supabase.from("products").select("*");
    if (error) console.error("Error fetching data:", error);
    else {
      setItems(data || []);
      const uniqueCategories = Array.from(
        new Set(data.map((item) => item.category?.trim()))
      ).filter(Boolean);
      setCategories(uniqueCategories);
    }
    setLoading(false);
  }

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.title
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      category === "All" ||
      item.category?.trim().toLowerCase() === category.toLowerCase();
    const price = parseFloat(item.price);
    const min = parseFloat(minPrice);
    const max = parseFloat(maxPrice);
    const matchesPrice =
      (!minPrice || price >= min) && (!maxPrice || price <= max);
    return matchesSearch && matchesCategory && matchesPrice;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    switch (sortOption) {
      case "priceLowHigh":
        return a.price - b.price;
      case "priceHighLow":
        return b.price - a.price;
      case "titleAZ":
        return a.title.localeCompare(b.title);
      case "titleZA":
        return b.title.localeCompare(a.title);
      default:
        return 0;
    }
  });

  const totalPages = Math.ceil(sortedItems.length / itemsPerPage);
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

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center px-4 py-10 transition-colors duration-300 relative">
      {/* Optional Dark Mode Toggle */}
      <button
        onClick={() => document.documentElement.classList.toggle("dark")}
        className="absolute top-6 right-6 px-3 py-1 rounded-md text-sm bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
      >
        Toggle Dark Mode
      </button>

      <h1 className="text-3xl font-bold mb-8 text-gray-800 dark:text-gray-100 text-center">
        Search Products
      </h1>

      {/* Category Tabs */}
      <div className="flex flex-wrap justify-center gap-3 mb-6">
        {["All", ...categories].map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
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
        <input
          type="text"
          placeholder="Search by title..."
          className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg px-4 py-2 text-sm w-48 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <input
          type="number"
          placeholder="Min price"
          className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg px-4 py-2 text-sm w-28 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
        />

        <input
          type="number"
          placeholder="Max price"
          className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg px-4 py-2 text-sm w-28 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
        />

        <select
          className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg px-4 py-2 text-sm text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value)}
        >
          <option value="default">Sort by</option>
          <option value="priceLowHigh">Price: Low → High</option>
          <option value="priceHighLow">Price: High → Low</option>
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
                onClick={() => setSelectedItem(item)} // modal trigger
                className="cursor-pointer bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden transform hover:-translate-y-1 hover:scale-[1.03] hover:border-blue-400 transition-all duration-300 hover:shadow-2xl border border-gray-100 dark:border-gray-700"
              >
                <img
                  src={item.image_url || "https://via.placeholder.com/300"}
                  alt={item.title}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-100 mb-1">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-2 line-clamp-2">
                    {item.description}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mb-2">
                    Category: {item.category}
                  </p>
                  <p className="text-gray-900 dark:text-gray-100 font-bold">
                    ${item.price}
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
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 w-[90%] max-w-md relative animate-fadeIn">
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-3 right-3 text-gray-500 dark:text-gray-300 hover:text-red-500"
            >
              ✕
            </button>
            <img
              src={selectedItem.image_url}
              alt={selectedItem.title}
              className="w-full h-60 object-cover rounded-md mb-4"
            />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {selectedItem.title}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-3">
              {selectedItem.description}
            </p>
            <p className="text-sm text-blue-600 dark:text-blue-400 mb-2">
              Category: {selectedItem.category}
            </p>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
              ${selectedItem.price}
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
