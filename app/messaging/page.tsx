import { Suspense } from "react";
import { MessagingPageClient } from "./messaging-page-client";

export default function MessagingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
          <div className="text-lg text-muted-foreground">Loading...</div>
        </div>
      }
    >
      <MessagingPageClient />
    </Suspense>
  );
}
