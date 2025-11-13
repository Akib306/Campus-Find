import { redirect } from "next/navigation";

import { SearchFilter } from "@/components/search-filter";
import { createClient } from "@/lib/supabase/server";
import { Search } from "@/components/search";

export default async function ProtectedPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  return (
    <div className="flex-1 w-full flex flex-col">
      <Search />
      <SearchFilter/>
    </div>
  );
}
