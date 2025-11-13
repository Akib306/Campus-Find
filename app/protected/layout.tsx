import { EnvVarWarning } from "@/components/env-var-warning";
import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { hasEnvVars } from "@/lib/utils";
import { NotificationBell } from "@/components/notification-bell";
import { AlertButton } from "@/components/alert-button";
import Link from "next/link";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-6 items-center">
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
          <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
            <div className="flex gap-5 items-center font-semibold">
              <Link href={"/"}>CampusFind</Link>
            </div>
            {!hasEnvVars ? <EnvVarWarning /> : (
              <div className="flex items-center gap-4">
                <NotificationBell/><AuthButton />
              </div>)}
          </div>
        </nav>
        <div className="w-full max-w-5xl flex justify-center">
          <AlertButton/>
        </div>
        <div className="flex-1 flex flex-col gap-6 max-w-5xl p-5">
          {children}
        </div>
        <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-16">
          <ThemeSwitcher />
        </footer>
      </div>
    </main>
  );
}
