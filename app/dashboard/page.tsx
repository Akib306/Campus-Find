import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import DashboardClient from "@/components/dashboard-client";
import { hasEnvVars } from "@/lib/utils";

export default async function DashboardPage() {
  if (!hasEnvVars) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-center text-muted-foreground">
        Supabase environment variables are required to load dashboard data.
      </div>
    );
  }

  const supabase = await createClient();

  const { data: authData, error: authError } = await supabase.auth.getClaims();
  if (authError || !authData?.claims) {
    redirect("/auth/login");
  }

  const { data: postData } = await supabase
    .from("posts")
    .select("item_category")
    .eq("post_status", "open");

  const counts: Record<"all" | "electronic" | "stationery" | "book" | "clothing", number> = {
    all: postData?.length ?? 0,
    electronic: 0,
    stationery: 0,
    book: 0,
    clothing: 0,
  };
  for (const row of postData ?? []) {
    const key = row.item_category as "electronic" | "stationery" | "book" | "clothing";
    counts[key] = (counts[key] ?? 0) + 1;
  }

  return (
    <>
      <DashboardClient initialCounts={counts} />
    </>
  );
}
