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
import { MapPin } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
  posting_user: {
    username: string | null;
    email: string;
    avatar_url: string | null;
  } | null;
};

export function LostItemsGrid() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = useMemo(() => createClient(), []);

  const fetchLostItems = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error: fetchError } = await supabase
        .from("posts")
        .select(`
          id,
          item_name,
          description,
          item_category,
          location_name,
          image_path,
          post_status,
          created_at,
          user_id,
          posting_user:profiles!posts_user_id_fkey (
            username,
            email,
            avatar_url
          )
        `)
        .eq("post_status", "open")
        .order("created_at", { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      // Supabase returns joined relations as arrays even for one-to-one FKs,
      // so normalize to a single profile object to match the Post type.
      setPosts(
        (data ?? []).map((post) => ({
          ...post,
          posting_user: Array.isArray(post.posting_user)
            ? post.posting_user[0] ?? null
            : post.posting_user ?? null,
        }))
      );

    } catch (err: unknown) {
      // Type as any for debugging
      console.error("Full Error Object:", JSON.stringify(err, null, 2));

      setError(
        err instanceof Error ? err.message : "Failed to fetch lost items"
      );
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

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
          filter: "post_status=eq.open",
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
      {posts.map((post) => (
        <Link key={post.id} href={`/listings/${post.id}`}>
          <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden bg-muted">
                {post.image_path && post.image_path.length > 0 ? (
                  <Image
                    src={post.image_path[0]}
                    alt={post.item_name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
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
              <CardDescription className="line-clamp-2 mb-2 text-base">
                {post.description || "No description"}
              </CardDescription>
              {post.location_name && (
                <div className="flex flex-col text-sm text-muted-foreground mb-2">
                  <span className="flex items-center gap-1 text-sm">
                    <MapPin size={14} /> {post.location_name}
                  </span>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(post.created_at), {
                  addSuffix: true,
                })}
              </p>

              <hr className="my-2 border-accent" />

              <div className="flex items-center gap-2 border-border">
                <Avatar>
                  {post.posting_user?.avatar_url && (
                    <AvatarImage src={post.posting_user?.avatar_url} alt={post.posting_user?.email} />
                  )}
                  <AvatarFallback className="bg-accent">{post.posting_user?.email ? post.posting_user?.email.charAt(0).toUpperCase() : "?"}</AvatarFallback>
                </Avatar>
                <p className="text-base text-muted-foreground">{post.posting_user?.username}</p>
                
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
