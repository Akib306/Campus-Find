import { EmeraldBackground } from "@/components/emerald-background";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  ArrowRight,
  Search,
  ShieldCheck,
  Bell,
  PlusCircle,
  MessageCircle,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { hasEnvVars } from "@/lib/utils";

export default async function LandingPage() {
  let initialUser: { email: string; avatarUrl: string | null } | null = null;

  if (hasEnvVars) {
    const supabase = await createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (auth.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", auth.user.id)
        .single();
      initialUser = { email: auth.user.email ?? "", avatarUrl: profile?.avatar_url ?? null };
    }
  }

  return (
    <EmeraldBackground>
      <Navbar variant="landing" initialUser={initialUser} />
      <main className="flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] px-4 text-center text-white">
        <div className="max-w-5xl w-full space-y-12 py-20">
          {/* Hero Section */}
          <div className="space-y-6 max-w-3xl mx-auto">
            <h1 className="text-5xl font-bold tracking-tight sm:text-7xl bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70">
              CampusFind
            </h1>
            <p className="text-xl sm:text-2xl text-zinc-300">
              The official Lost & Found platform for University of Saskatchewan
              students. Report lost items, recover belongings, and help your
              campus community.
            </p>
            <div className="flex justify-center pt-4">
              <Link href="/dashboard">
                <Button
                  size="lg"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white border-none h-12 px-8 text-lg"
                >
                  Go to Dashboard <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 text-left px-4 sm:px-0">
            <div className="p-6 rounded-xl bg-black/20 backdrop-blur-sm border border-white/10 hover:bg-black/30 transition-colors">
              <ShieldCheck className="h-10 w-10 text-emerald-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-white">
                USask Verified
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Secure login with your university email ensures trustworthy
                interactions. Only verified students & faculty can post and search.
              </p>
            </div>
            <div className="p-6 rounded-xl bg-black/20 backdrop-blur-sm border border-white/10 hover:bg-black/30 transition-colors">
              <Search className="h-10 w-10 text-emerald-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-white">
                Smart Search
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Easily filter by category, location, or keywords to find items
                quickly. Browse recently reported items in real-time.
              </p>
            </div>
            <div className="p-6 rounded-xl bg-black/20 backdrop-blur-sm border border-white/10 hover:bg-black/30 transition-colors">
              <Bell className="h-10 w-10 text-emerald-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-white">
                Instant Alerts
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Get notified immediately when a possible match is found. Stay
                updated on the status of your reported items.
              </p>
            </div>
            <div className="p-6 rounded-xl bg-black/20 backdrop-blur-sm border border-white/10 hover:bg-black/30 transition-colors">
              <PlusCircle className="h-10 w-10 text-emerald-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-white">
                Easy Reporting
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Create detailed posts in seconds. Upload
                photos and set locations to help others identify items.
              </p>
            </div>
            <div className="p-6 rounded-xl bg-black/20 backdrop-blur-sm border border-white/10 hover:bg-black/30 transition-colors">
              <MessageCircle className="h-10 w-10 text-emerald-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-white">
                Secure Messaging
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Connect safely with other students through our built-in chat
                system to arrange item returns without sharing personal info.
              </p>
            </div>
            <div className="p-6 rounded-xl bg-black/20 backdrop-blur-sm border border-white/10 hover:bg-black/30 transition-colors">
              <Users className="h-10 w-10 text-emerald-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-white">
                Community Driven
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Join a supportive community of students helping each other.
                Together, we make our campus a better place.
              </p>
            </div>
          </div>
        </div>
      </main>
    </EmeraldBackground>
  );
}
