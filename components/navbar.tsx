
import Link from "next/link";
import { Search } from "@/components/search";
import { AuthButton } from "@/components/auth-button";
import { EnvVarWarning } from "@/components/env-var-warning";
import { hasEnvVars } from "@/lib/utils";
import { NotificationBell } from "./notification-bell";
import { NewPostForm } from "./new-post-form";
import { AlertModal } from "./alert-modal";
import { MessageSquare } from "lucide-react";

export async function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="mx-auto w-[80%] grid grid-cols-3 h-14 items-center gap-3 pt-2 sm:px-6 lg:px-8">
        <div className="justify-self-start">
          <Link href="/" className="text-sm font-semibold tracking-tight">
            CampusFind
          </Link>
        </div>
        <div className="justify-self-center w-full">
          <Search />
        </div>
        <div className="justify-self-end flex items-center gap-2">
          {!hasEnvVars ? (
            <EnvVarWarning />
          ) : (
            <>
              <Link 
                href="/messaging" 
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                Messages
              </Link>
              <NewPostForm />
              <AlertModal />
              <NotificationBell />
              <AuthButton />
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
