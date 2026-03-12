import { Navbar } from "@/components/navbar";
import { SearchProvider } from "@/components/search-context";
import { createClient } from "@/lib/supabase/server";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  let initialUser: { email: string; avatarUrl: string | null } | null = null;
  if (auth.user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", auth.user.id)
      .single();
    initialUser = { email: auth.user.email ?? "", avatarUrl: profile?.avatar_url ?? null };
  }

  return (
    <SearchProvider>
      <main className="min-h-screen flex flex-col items-center">
        <div className="flex-1 w-full flex flex-col gap-6 items-center">
          <Navbar variant="dashboard" initialUser={initialUser} />
          
          <div className="flex-1 flex flex-col gap-10 mx-auto w-[80%] sm:px-6 lg:px-8">
            {children}
          </div>
  
          <footer className="w-full border-t py-6">
            <p className="text-center text-xs text-muted-foreground">&copy; {new Date().getFullYear()} CampusFind &mdash; Helping students reunite with their lost belongings.</p>
          </footer>
        </div>
      </main>
    </SearchProvider>
  );
}
