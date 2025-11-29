import { EmeraldBackground } from "@/components/emerald-background";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Search, ShieldCheck, Bell } from "lucide-react";

export default function LandingPage() {
  return (
    <EmeraldBackground>
      <Navbar variant="landing" />
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
                interactions. Only verified students can post and search.
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
          </div>
        </div>
      </main>
    </EmeraldBackground>
  );
}
