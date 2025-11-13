
import Link from "next/link";
import { Search } from "@/components/search";
import { NotificationBell } from "@/components/notification-bell";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { AuthButton } from "@/components/auth-button";
import { EnvVarWarning } from "@/components/env-var-warning";
import { hasEnvVars } from "@/lib/utils";

export async function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="mx-auto w-[80%]  flex h-14 items-center gap-3 px-4 sm:px-6 lg:px-8 ">
        <div className="flex items-center justify-between w-full">
          <>
            <Link href="/" className="text-sm font-semibold tracking-tight">
              CampusFind
            </Link>
            <Search />
            {!hasEnvVars ? <EnvVarWarning /> : (
              <>
                <div className="flex items-center">
                  <NotificationBell/>
                  <AuthButton />
                </div>
              </>
            )}
          </>
        </div>
      </nav>
    </header>
  );
}