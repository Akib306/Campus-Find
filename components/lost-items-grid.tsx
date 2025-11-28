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
import { MapPin, ThumbsDown, ThumbsUp } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "./ui/button";

type UserReliabilityStats = {
  user_id: string;
  total_posts: number;
  helpful_posts: number;
  total_votes_received: number;
  votes_cast: number;
  is_new_user: boolean;
};


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
  posting_user_reliability?: UserReliabilityStats | null;
};

interface LostItemsGridProps {
  categoryFilter?: string | null;
}

export function LostItemsGrid({ categoryFilter = null }: LostItemsGridProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = useMemo(() => createClient(), []);
  const [userReliabilityByUserId, setUserReliabilityByUserId] = useState<
    Map<string, UserReliabilityStats>
  >(new Map());
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [myVotesByPostId, setMyVotesByPostId] = useState<
    Record<string, boolean | undefined>
  >({});
  const [voteBusyByPostId, setVoteBusyByPostId] = useState<Record<string, boolean>>(
    {}
  );

  const fetchLostItems = useCallback(async () => {
    try {
      setIsLoading(true);
      let query = supabase
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
        .eq("post_status", "open");

      if (categoryFilter) {
        query = query.eq("item_category", categoryFilter);
      }

      const { data, error: fetchError } = await query.order("created_at", {
        ascending: false,
      });

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

  useEffect(() => {
    // Resolve current user (needed for voting and restricted views)
    supabase.auth.getUser().then(({ data }) => {
      setMyUserId(data.user?.id ?? null);
    });
  }, [supabase]);

  async function fetchReliabilityForUsers(
    supabase: ReturnType<typeof createClient>,
    userIds: string[]
  ): Promise<Map<string, UserReliabilityStats>> {
    if (userIds.length === 0) return new Map();
  
    const { data, error } = await supabase
      .from('user_reliability_stats')
      .select('user_id,total_posts,helpful_posts,total_votes_received,votes_cast,is_new_user')
      .in('user_id', userIds);
  
    // If unauthenticated or blocked by RLS/grants, fall back gracefully
    if (error || !data) return new Map();
  
    return new Map(data.map((row) => [row.user_id, row]));
  }

  async function fetchMyVotesForPosts(
    supabase: ReturnType<typeof createClient>,
    voterId: string,
    postIds: string[]
  ) {
    if (!voterId || postIds.length === 0) return;
    const { data, error } = await supabase
      .from("post_helpfulness_votes")
      .select("post_id,is_helpful")
      .eq("voter_id", voterId)
      .in("post_id", postIds);

    if (error || !data) return;

    const next: Record<string, boolean | undefined> = {};
    for (const row of data) {
      next[row.post_id as string] = Boolean(row.is_helpful);
    }
    setMyVotesByPostId((prev) => ({ ...prev, ...next }));
  }


  useEffect(() => {
    // After posts or auth resolved, fetch reliability and my votes
    const userIds = Array.from(new Set(posts.map((p) => p.user_id)));
    if (userIds.length > 0) {
      fetchReliabilityForUsers(supabase, userIds).then((map) =>
        setUserReliabilityByUserId(map)
      );
    }
    if (myUserId) {
      const postIds = posts.map((p) => p.id);
      fetchMyVotesForPosts(supabase, myUserId, postIds);
    }
  }, [posts, myUserId, supabase]);

  const handleVote = useCallback(
    async (post: Post, isHelpful: boolean) => {
      if (!myUserId) return; // optionally prompt login
      if (post.user_id === myUserId) return; // cannot vote on own post per RLS
      if (voteBusyByPostId[post.id]) return;

      setVoteBusyByPostId((prev) => ({ ...prev, [post.id]: true }));
      const current = myVotesByPostId[post.id];
      try {
        if (current === isHelpful) {
          // clicking again removes the vote
          const { error } = await supabase
            .from("post_helpfulness_votes")
            .delete()
            .match({ post_id: post.id, voter_id: myUserId });
          if (error) throw error;
          setMyVotesByPostId((prev) => ({ ...prev, [post.id]: undefined }));
        } else if (current === undefined) {
          const { error } = await supabase
            .from("post_helpfulness_votes")
            .upsert(
              { post_id: post.id, voter_id: myUserId, is_helpful: isHelpful },
              { onConflict: "post_id,voter_id" }
            );
          if (error) throw error;
          setMyVotesByPostId((prev) => ({ ...prev, [post.id]: isHelpful }));
        } else {
          const { error } = await supabase
            .from("post_helpfulness_votes")
            .update({ is_helpful: isHelpful })
            .match({ post_id: post.id, voter_id: myUserId });
          if (error) throw error;
          setMyVotesByPostId((prev) => ({ ...prev, [post.id]: isHelpful }));
        }

        // Refresh reliability for the post author so the "people helped" number updates
        const updatedMap = await fetchReliabilityForUsers(supabase, [
          post.user_id,
        ]);
        setUserReliabilityByUserId((prev) => {
          const merged = new Map(prev);
          for (const [key, value] of updatedMap.entries()) {
            merged.set(key, value);
          }
          return merged;
        });
      } catch {
        // noop
      } finally {
        setVoteBusyByPostId((prev) => {
          const next = { ...prev };
          delete next[post.id];
          return next;
        });
      }
    },
    [myUserId, myVotesByPostId, supabase, voteBusyByPostId]
  );

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
    const normalized = category.toLowerCase();
    switch (normalized) {
      case "electronic":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20";
      case "stationery":
        return "bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/20";
      case "book":
        return "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20";
      case "clothing":
        return "bg-pink-500/10 text-pink-700 dark:text-pink-300 border-pink-500/20";
      default:
        return "bg-gray-500/10 text-gray-700 dark:text-gray-300 border-gray-500/20";
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
      {posts.map((post) => {
        const hasImages = Boolean(post.image_path && post.image_path.length > 0);

        return (
          <Card
            key={post.id}
            className={`flex flex-col h-full hover:shadow-lg transition-shadow ${
              !hasImages ? "cursor-pointer" : ""
            }`}
          >
            <div className="flex-1">
              {hasImages ? (
                <>
                  <CardHeader>
                    <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden bg-muted">
                      <Link href={`/listings/${post.id}`}>
                        <div className="relative w-full h-full cursor-pointer hover:opacity-90 transition-opacity">
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
                      </Link>
                    </div>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg md:text-xl line-clamp-2">
                        {post.item_name}
                      </CardTitle>
                      <Badge
                        variant="outline"
                        className={`${getCategoryColor(
                          post.item_category
                        )} capitalize`}
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
                      <p className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                        <MapPin size={14} /> {post.location_name}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(post.created_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </CardContent>
                </>
              ) : (
                <Link href={`/listings/${post.id}`} className="block h-full">
                  <CardHeader>
                    <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden bg-muted">
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        No image
                      </div>
                    </div>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg md:text-xl line-clamp-2">
                        {post.item_name}
                      </CardTitle>
                      <Badge
                        variant="outline"
                        className={`${getCategoryColor(
                          post.item_category
                        )} capitalize`}
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
                      <p className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                        <MapPin size={14} /> {post.location_name}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(post.created_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </CardContent>
                </Link>
              )}
            </div>

            <CardContent className="border-t mt-2 pt-4 space-y-3">
              <div className="flex items-center gap-2">
                <Avatar className="size-6">
                  {post.posting_user?.avatar_url && (
                    <AvatarImage
                      src={post.posting_user?.avatar_url}
                      alt={post.posting_user?.email}
                    />
                  )}
                  <AvatarFallback className="bg-accent">
                    {post.posting_user?.email
                      ? post.posting_user?.email.charAt(0).toUpperCase()
                      : "?"}
                  </AvatarFallback>
                </Avatar>
                <p className="text-sm font-medium text-foreground">
                  {post.posting_user?.username ?? "Anonymous user"}
                </p>
                <p className="ml-auto text-xs text-muted-foreground">
                  Helped{" "}
                  {userReliabilityByUserId.get(post.user_id)?.helpful_posts ?? 0}{" "}
                  people
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <p>Did you find this post helpful?</p>
                <Button
                  variant={myVotesByPostId[post.id] === true ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => handleVote(post, true)}
                  disabled={
                    !myUserId ||
                    post.user_id === myUserId ||
                    !!voteBusyByPostId[post.id]
                  }
                  className="gap-1"
                >
                  <ThumbsUp className="h-4 w-4" />
                  Yes
                </Button>
                <Button
                  variant={myVotesByPostId[post.id] === false ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => handleVote(post, false)}
                  disabled={
                    !myUserId ||
                    post.user_id === myUserId ||
                    !!voteBusyByPostId[post.id]
                  }
                  className="gap-1"
                >
                  <ThumbsDown className="h-4 w-4" />
                  No
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
