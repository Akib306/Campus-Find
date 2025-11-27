"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { value: "electronic", label: "Electronic", color: "bg-blue-500" },
  { value: "stationery", label: "Stationery", color: "bg-green-500" },
  { value: "book", label: "Book", color: "bg-purple-500" },
  { value: "clothing", label: "Clothing", color: "bg-pink-500" },
] as const;

interface CategorySidebarProps {
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  categoryCounts?: Record<string, number>;
}

export function CategorySidebar({
  selectedCategory,
  onCategoryChange,
  categoryCounts = {},
}: CategorySidebarProps) {
  return (
    <div className="w-full md:w-64 flex-shrink-0">
      <div className="sticky top-8 space-y-4">
        <div>
          <h2 className="text-lg font-semibold mb-4">Categories</h2>
          <div className="space-y-2">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              className={cn(
                "w-full justify-start",
                selectedCategory === null &&
                  "bg-primary text-primary-foreground"
              )}
              onClick={() => onCategoryChange(null)}
            >
              All Items
              {categoryCounts.all !== undefined && (
                <Badge variant="secondary" className="ml-auto">
                  {categoryCounts.all}
                </Badge>
              )}
            </Button>
            {CATEGORIES.map((category) => (
              <Button
                key={category.value}
                variant={
                  selectedCategory === category.value ? "default" : "outline"
                }
                className={cn(
                  "w-full justify-start",
                  selectedCategory === category.value &&
                    "bg-primary text-primary-foreground"
                )}
                onClick={() => onCategoryChange(category.value)}
              >
                <div
                  className={cn("w-3 h-3 rounded-full mr-2", category.color)}
                />
                {category.label}
                {categoryCounts[category.value] !== undefined && (
                  <Badge variant="secondary" className="ml-auto">
                    {categoryCounts[category.value]}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
