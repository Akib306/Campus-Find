'use client';

import Link from "next/link";
import { AuthButton, type UserInfo } from "@/components/auth-button";
import { EnvVarWarning } from "@/components/env-var-warning";
import { AlertModal } from "./alert-modal";
import { hasEnvVars } from "@/lib/utils";
import { NewPostForm } from "./new-post-form";
import { NotificationBell } from "./notification-bell";
import { Search } from "@/components/search";
import { useSearch } from "@/components/search-context";
import { MessageSquare } from "lucide-react";

export function Navbar({
  variant = "landing",
  initialUser,
}: {
  variant?: "landing" | "dashboard";
  initialUser?: UserInfo;
}) {
  const isDashboard = variant === "dashboard";

  function DashboardSearchBox() {
    const { searchTerm, setSearchTerm, suggestions } = useSearch();
    return (
      <Search
        value={searchTerm}
        onChange={setSearchTerm}
        suggestions={suggestions}
      />
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-background backdrop-blur supports-[backdrop-filter]:bg-transparent">
      <nav className="mx-auto w-[80%] grid grid-cols-3 h-14 items-center gap-3 pt-2 sm:px-6 lg:px-8">
        <div className="justify-self-start">
          <Link href="/" className="text-lg font-bold text-primary">
            CampusFind
          </Link>
        </div>

        <div className="justify-self-center w-full">
          {isDashboard ? <DashboardSearchBox /> : null}
        </div>

        <div className="justify-self-end flex items-center gap-2">
          {!hasEnvVars ? (
            <EnvVarWarning />
          ) : isDashboard ? (
            <>
              <Link 
                href="/messaging" 
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                Messages
              </Link>
              <NewPostForm />
              <AlertModal />
              <NotificationBell />
              <AuthButton initialUser={initialUser} />
            </>
          ) : (
            <>
              <AuthButton initialUser={initialUser} />
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
