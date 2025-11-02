"use client";

import { PostLostItemForm } from "@/components/post-lost-item-form";

export default function PostLostItemPage() {
  return (
    <div className="flex-1 w-full flex flex-col gap-12 items-center p-8">
      <div className="w-full max-w-2xl">
        <PostLostItemForm />
      </div>
    </div>
  );
}
