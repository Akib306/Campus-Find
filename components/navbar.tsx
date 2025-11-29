import Link from "next/link";
import { Search } from "@/components/search";
import { AuthButton } from "@/components/auth-button";
import { EnvVarWarning } from "@/components/env-var-warning";
import { AlertModal } from "./alert-modal";
import { hasEnvVars } from "@/lib/utils";
import { NewPostForm } from "./new-post-form";
import { NotificationBell } from "./notification-bell";

export function Navbar({
  variant = "landing",
}: {
  variant?: "landing" | "dashboard";
}) {
  const isDashboard = variant === "dashboard";

  return (
    <header className="sticky top-0 z-50 w-full bg-background backdrop-blur supports-[backdrop-filter]:bg-transparent">
      <nav className="mx-auto w-[80%] grid grid-cols-3 h-14 items-center gap-3 pt-2 sm:px-6 lg:px-8">
        <div className="justify-self-start">
          <Link href="/" className="text-lg font-bold text-primary">
            CampusFind
          </Link>
        </div>

        <div className="justify-self-center w-full">
          {isDashboard ? <Search /> : null}
        </div>

        <div className="justify-self-end flex items-center gap-2">
          {!hasEnvVars ? (
            <EnvVarWarning />
          ) : isDashboard ? (
            <>
              <NewPostForm />
              <AlertModal />
              <NotificationBell />
              <AuthButton />
            </>
          ) : (
            <>
              <AuthButton />
            </>
          )}
        </div>
      </nav>
    </header>
  );
}