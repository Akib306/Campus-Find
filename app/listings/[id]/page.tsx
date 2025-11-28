"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import { ImageGalleryModal } from "@/components/image-gallery-modal";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

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

export default function ListingPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setIsLoading(true);
        const { data, error: fetchError } = await supabase
          .from("posts")
          .select("*")
          .eq("id", postId)
          .single();

        if (fetchError) {
          throw fetchError;
        }

        if (!data) {
          throw new Error("Post not found");
        }

        setPost(data);
      } catch (err: any) {
        setError(err instanceof Error ? err.message : "Failed to fetch post");
      } finally {
        setIsLoading(false);
      }
    };

    if (postId) {
      fetchPost();
    }
  }, [postId, supabase]);

  const handleImageClick = (index: number) => {
    if (post?.image_path && post.image_path.length > 0) {
      setGalleryImages(post.image_path);
      setGalleryIndex(index);
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading post...</p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-destructive">Error: {error || "Post not found"}</p>
        <Button asChild variant="outline">
          <Link href="/">Go back home</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <main className="min-h-screen flex flex-col">
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <Card className="w-full">
            <CardHeader>
              <div className="flex items-start justify-between gap-4 mb-4">
                <CardTitle className="text-2xl">{post.item_name}</CardTitle>
                <Badge
                  className={`${getCategoryColor(
                    post.item_category
                  )} text-white capitalize`}
                >
                  {post.item_category}
                </Badge>
              </div>

              {post.image_path && post.image_path.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {post.image_path.map((imageUrl, index) => (
                    <div
                      key={index}
                      className="relative w-full h-64 rounded-lg overflow-hidden bg-muted cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => handleImageClick(index)}
                    >
                      <Image
                        src={imageUrl}
                        alt={`${post.item_name} - Image ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="w-full h-64 rounded-lg bg-muted flex items-center justify-center mb-4">
                  <p className="text-muted-foreground">No images available</p>
                </div>
              )}
            </CardHeader>

            <CardContent className="space-y-4">
              {post.description && (
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <CardDescription className="text-base">
                    {post.description}
                  </CardDescription>
                </div>
              )}

              {post.location_name && (
                <div>
                  <h3 className="font-semibold mb-2">Location</h3>
                  <p className="text-muted-foreground">
                    📍 {post.location_name}
                  </p>
                </div>
              )}

              <div>
                <h3 className="font-semibold mb-2">Status</h3>
                <Badge variant="outline" className="capitalize">
                  {post.post_status.replace("_", " ")}
                </Badge>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">
                  Posted{" "}
                  {formatDistanceToNow(new Date(post.created_at), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <ImageGalleryModal
        images={galleryImages}
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        initialIndex={galleryIndex}
      />
    </>
  );
}
