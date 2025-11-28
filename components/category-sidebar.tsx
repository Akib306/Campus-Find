"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { Laptop, Pencil, Book, Shirt, LayoutGrid } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type CategoryItem = {
  value: "electronic" | "stationery" | "book" | "clothing";
  label: string;
  icon: LucideIcon;
  iconColor: string; // text- color class
};

const CATEGORIES: readonly CategoryItem[] = [
  { value: "electronic", label: "Electronic", icon: Laptop, iconColor: "text-blue-500" },
  { value: "stationery", label: "Stationery", icon: Pencil, iconColor: "text-green-500" },
  { value: "book", label: "Book", icon: Book, iconColor: "text-purple-500" },
  { value: "clothing", label: "Clothing", icon: Shirt, iconColor: "text-pink-500" },
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
      <div className="sticky">
        <div>
          <h2 className="text-lg font-semibold mb-2">Categories</h2>
          <TooltipProvider delayDuration={100}>
            <div className="flex flex-wrap gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={selectedCategory === null ? "default" : "outline"}
                    size="icon"
                    className={cn(selectedCategory === null && "bg-primary text-primary-foreground")}
                    onClick={() => onCategoryChange(null)}
                    aria-label={`All Items (${categoryCounts.all ?? 0})`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  All Posts ({categoryCounts.all ?? 0})
                </TooltipContent>
              </Tooltip>
              {CATEGORIES.map((category) => (
                <Tooltip key={category.value}>
                  <TooltipTrigger asChild>
                    <Button
                      variant={
                        selectedCategory === category.value ? "default" : "outline"
                      }
                      size="icon"
                      className={cn(selectedCategory === category.value && "bg-primary text-primary-foreground")}
                      onClick={() => onCategoryChange(category.value)}
                      aria-label={`${category.label} (${categoryCounts[category.value] ?? 0})`}
                    >
                      <category.icon className={cn("w-4 h-4", category.iconColor)} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    {category.label} ({categoryCounts[category.value] ?? 0} Posts)
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
}
