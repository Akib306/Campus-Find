"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const defaultImageSrc = "./project-screenshot.png";

export function PostLostItemForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [itemName, setItemName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [lastSeen, setLastSeen] = useState("");
  const [dateFound, setDateFound] = useState("");
  const [imagePreview, setImagePreview] = useState(defaultImageSrc);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(defaultImageSrc);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(defaultImageSrc);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const file = fileInputRef.current?.files?.[0];
      let imagePaths: string[] = [];

      // Upload file if provided
      if (file) {
        const filePath = "public/" + Date.now() + "_" + file.name;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("post-images")
          .upload(filePath, file);

        if (uploadError) {
          console.error("Error uploading file:", uploadError.message);
          throw uploadError;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from("post-images")
          .getPublicUrl(uploadData.path);

        imagePaths = [urlData.publicUrl];
      }

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("You must be logged in to post items");
      }

      // Insert into database
      const { error: itemError } = await supabase.from("posts").insert([
        {
          user_id: user.id,
          item_name: itemName,
          description: description,
          post_type: "lost",
          item_category: category,
          location_name: lastSeen,
          image_path: imagePaths,
          post_status: "open",
        },
      ]);

      if (itemError) {
        console.error("Error saving item:", itemError.message);
        throw itemError;
      }

      // Success
      setSuccess(true);
      // Reset form
      setItemName("");
      setDescription("");
      setCategory("");
      setLastSeen("");
      setDateFound("");
      setImagePreview(defaultImageSrc);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Post Lost Item</CardTitle>
          <CardDescription>
            Submit details about a lost item you found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Item Name */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="item_name">Item Name</Label>
              <Input
                id="item_name"
                type="text"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                required
              />
            </div>

            {/* Description */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            {/* Category */}
            <div className="flex flex-col gap-2">
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

            {/* Last Seen */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="last_seen">Last Seen</Label>
              <Input
                id="last_seen"
                type="text"
                value={lastSeen}
                onChange={(e) => setLastSeen(e.target.value)}
                required
              />
            </div>

            {/* Date Found */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="date">Date Found</Label>
              <Input
                id="date"
                type="date"
                value={dateFound}
                onChange={(e) => setDateFound(e.target.value)}
                required
              />
            </div>

            {/* Photo Upload */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="item_photo">Photo (Optional)</Label>
              <Input
                id="item_photo"
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
              />
              {imagePreview && (
                <div className="relative inline-block">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-w-xs max-h-48 object-contain rounded border"
                  />
                  {imagePreview !== defaultImageSrc && (
                    <Button
                      type="button"
                      onClick={handleRemoveImage}
                      variant="outline"
                      size="sm"
                      className="mt-2"
                    >
                      Remove Image
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && <div className="text-red-500 text-sm">{error}</div>}

            {/* Success Message */}
            {success && (
              <div className="text-green-500 text-sm">
                Lost item posted successfully!
              </div>
            )}

            {/* Submit Button */}
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Submitting..." : "Submit"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
