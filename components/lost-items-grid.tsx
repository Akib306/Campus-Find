"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ImageGalleryModal } from "@/components/image-gallery-modal";

type Post = {
  id: string;
  item_name: string;
  description: string | null;
  item_category: string;
  location_name: string | null;
  image_path: string[];
  post_status: string;
  created_at: string;
  user_id: string;
};

interface LostItemsGridProps {
  categoryFilter?: string | null;
}

export function LostItemsGrid({ categoryFilter = null }: LostItemsGridProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  const fetchLostItems = useCallback(async () => {
    try {
      setIsLoading(true);
      let query = supabase.from("posts").select("*").eq("post_status", "open");

      if (categoryFilter) {
        query = query.eq("item_category", categoryFilter);
      }

      const { data, error: fetchError } = await query.order("created_at", {
        ascending: false,
      });

      if (fetchError) {
        throw fetchError;
      }

      setPosts(data || []);
    } catch (err: any) {
      // Type as any for debugging
      console.error("Full Error Object:", JSON.stringify(err, null, 2));

      setError(
        err instanceof Error ? err.message : "Failed to fetch lost items"
      );
    } finally {
      setIsLoading(false);
    }
  }, [supabase, categoryFilter]);

  useEffect(() => {
    fetchLostItems();

    // Subscribe to real-time updates
    const channel = supabase
      .channel("lost-items-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "posts",
          filter: "post_type=eq.lost",
        },
        () => {
          // Refetch on any change
          fetchLostItems();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchLostItems]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading lost items...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-destructive">Error: {error}</p>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">No lost items found.</p>
      </div>
    );
  }

  const handleImageClick = (
    e: React.MouseEvent,
    images: string[],
    initialIndex: number = 0
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (images && images.length > 0) {
      setGalleryImages(images);
      setGalleryIndex(initialIndex);
      setIsGalleryOpen(true);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "electronic":
        return "bg-blue-500";
      case "stationery":
        return "bg-green-500";
      case "book":
        return "bg-purple-500";
      case "clothing":
        return "bg-pink-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
        {posts.map((post) => (
          <Link key={post.id} href={`/listings/${post.id}`}>
            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden bg-muted">
                  {post.image_path && post.image_path.length > 0 ? (
                    <div
                      className="relative w-full h-full cursor-pointer"
                      onClick={(e) => handleImageClick(e, post.image_path, 0)}
                    >
                      <Image
                        src={post.image_path[0]}
                        alt={post.item_name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                      {post.image_path.length > 1 && (
                        <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                          +{post.image_path.length - 1}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      No image
                    </div>
                  )}
                </div>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg line-clamp-2">
                    {post.item_name}
                  </CardTitle>
                  <Badge
                    className={`${getCategoryColor(
                      post.item_category
                    )} text-white capitalize`}
                  >
                    {post.item_category}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="line-clamp-2 mb-2">
                  {post.description || "No description"}
                </CardDescription>
                {post.location_name && (
                  <p className="text-sm text-muted-foreground mb-2">
                    📍 {post.location_name}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(post.created_at), {
                    addSuffix: true,
                  })}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      <ImageGalleryModal
        images={galleryImages}
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        initialIndex={galleryIndex}
      />
    </>
  );
}
