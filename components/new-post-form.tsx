"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusIcon } from "lucide-react";

const defaultImageSrc = "./project-screenshot.png";
const MAX_IMAGES = 5;

export function NewPostForm() {
  const [itemName, setItemName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [locationName, setLocationName] = useState("");
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files ?? []);
    if (newFiles.length === 0) return;
    setError(null);
    setSelectedFiles((prev) => {
      const available = MAX_IMAGES - prev.length;
      if (available <= 0) {
        setError(`You can upload up to ${MAX_IMAGES} images.`);
        return prev;
      }
      const filesToAdd = newFiles.slice(0, available);
      return [...prev, ...filesToAdd];
    });
    setImagePreviews((prev) => {
      const available = MAX_IMAGES - prev.length;
      if (available <= 0) return prev;
      const previewsToAdd = newFiles
        .slice(0, available)
        .map((f) => URL.createObjectURL(f));
      return [...prev, ...previewsToAdd];
    });
    // Allow selecting the same file again by resetting input value
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClearImages = () => {
    imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    setImagePreviews([]);
    setSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveImageAtIndex = (index: number) => {
    const nextPreviews = [...imagePreviews];
    const [removed] = nextPreviews.splice(index, 1);
    if (removed) URL.revokeObjectURL(removed);
    setImagePreviews(nextPreviews);
    const nextFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(nextFiles);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      if (selectedFiles.length > MAX_IMAGES) {
        setError(`You can upload up to ${MAX_IMAGES} images.`);
        setIsLoading(false);
        return;
      }
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("You must be logged in to post items");
      }

      // Step 1: Create the post first (without images) to get a post ID
      const { data: insertedPost, error: insertError } = await supabase
        .from("posts")
        .insert([
          {
            user_id: user.id,
            item_name: itemName,
            description: description,
            item_category: category,
            location_name: locationName,
            image_path: [],
            post_status: "open",
          },
        ])
        .select("id")
        .single();

      if (insertError || !insertedPost) {
        throw new Error(insertError?.message || "Failed to create post");
      }

      const postId = insertedPost.id as string;

      // Step 2: Upload all selected images (if any) to storage under {postId}/
      const uploadedPaths: string[] = [];
      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          const extension =
            file.name.includes(".") ? file.name.split(".").pop() : undefined;
          const uniqueName = `${crypto.randomUUID()}${extension ? `.${extension}` : ""}`;
          const storagePath = `public/${postId}/${uniqueName}`;

          const { error: uploadError } = await supabase.storage
            .from("post-images")
            .upload(storagePath, file, {
              cacheControl: "3600",
              upsert: false,
              contentType: file.type,
            });

          if (uploadError) {
            // Rollback: remove any previously uploaded files and delete the post
            if (uploadedPaths.length > 0) {
              await supabase.storage.from("post-images").remove(uploadedPaths);
            }
            await supabase.from("posts").delete().eq("id", postId);
            throw new Error(uploadError.message);
          }

          uploadedPaths.push(storagePath);
        }
      }

      // Step 3: Resolve public URLs for all uploaded images
      const publicUrls: string[] = uploadedPaths.map((p) => {
        const { data } = supabase.storage.from("post-images").getPublicUrl(p);
        return data.publicUrl;
      });

      // Step 4: Update the post with the image URL array
      const { error: updateError } = await supabase
        .from("posts")
        .update({ image_path: publicUrls })
        .eq("id", postId);

      if (updateError) {
        // Rollback storage and the post if update fails
        if (uploadedPaths.length > 0) {
          await supabase.storage.from("post-images").remove(uploadedPaths);
        }
        await supabase.from("posts").delete().eq("id", postId);
        throw new Error(updateError.message);
      }

      // Success
      setSuccess(true);
      // Reset form
      setItemName("");
      setDescription("");
      setCategory("");
      setLocationName("");
      handleClearImages();
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      // Close dialog after successful submit
      setIsDialogOpen(false);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button type="button" size="sm" className="text-sm">
            <PlusIcon /> New Post
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-[600px]">
          <form onSubmit={handleSubmit} className="grid gap-4">
            <DialogHeader>
              <DialogTitle>Post Lost Item</DialogTitle>
              <DialogDescription>
                Submit details about a lost item you found.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-2">
              <Label htmlFor="item_name">Item Name</Label>
              <Input
                id="item_name"
                type="text"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory} required>
                <SelectTrigger id="category" className="w-full bg-background">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="electronic">Electronic</SelectItem>
                  <SelectItem value="stationery">Stationery</SelectItem>
                  <SelectItem value="book">Book</SelectItem>
                  <SelectItem value="clothing">Clothing</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="last_seen">Location</Label>
              <Input
                id="lastlocation"
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="item_photo">Photo (Optional)</Label>
              <Input
                id="item_photo"
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
              />
              {imagePreviews.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {imagePreviews.map((src, idx) => (
                    <div key={src} className="relative">
                      <img
                        src={src}
                        alt={`Preview ${idx + 1}`}
                        className="w-full h-32 object-cover rounded border"
                      />
                      <div className="mt-2">
                        <Button
                          type="button"
                          onClick={() => handleRemoveImageAtIndex(idx)}
                          variant="outline"
                          size="sm"
                          className="w-full"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="relative inline-block">
                  <img
                    src={defaultImageSrc}
                    alt="Preview"
                    className="max-w-xs max-h-48 object-contain rounded border"
                  />
                </div>
              )}
              {imagePreviews.length > 0 && (
                <div>
                  <Button
                    type="button"
                    onClick={handleClearImages}
                    variant="secondary"
                    size="sm"
                  >
                    Clear All Images
                  </Button>
                </div>
              )}
            </div>
            {error && <div className="text-red-500 text-sm">{error}</div>}
            {success && (
              <div className="text-green-500 text-sm">
                Lost item posted successfully!
              </div>
            )}
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Submitting..." : "Submit"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
