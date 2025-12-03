
import Link from "next/link";
import { AuthButton } from "@/components/auth-button";
import { EnvVarWarning } from "@/components/env-var-warning";
import { hasEnvVars } from "@/lib/utils";
import { NotificationBell } from "./notification-bell";
import { NewPostForm } from "./new-post-form";
import { AlertModal } from "./alert-modal";
import { NavbarSearch } from "./navbar-search";

export async function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav
        className="mx-auto w-[80%] grid grid-cols-3 h-14 items-center gap-3 pt-2 sm:px-6 lg:px-8"
        data-navbar-root
      >
        <div className="justify-self-start">
          <Link href="/" className="text-sm font-semibold tracking-tight">
            CampusFind
          </Link>
        </div>
        <div className="justify-self-center w-full">
          <NavbarSearch />
        </div>
        <div className="justify-self-end flex items-center gap-2">
          {!hasEnvVars ? (
            <EnvVarWarning />
          ) : (
            <>
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
