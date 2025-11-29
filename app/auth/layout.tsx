import { EmeraldBackground } from "@/components/emerald-background";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <EmeraldBackground>
      <div className="flex flex-col min-h-screen">
        <header className="sticky top-0 z-50 w-full bg-background backdrop-blur supports-[backdrop-filter]:bg-transparent">
          <nav className="mx-auto w-[80%] grid grid-cols-3 h-14 items-center gap-3 pt-2 sm:px-6 lg:px-8">
            <div className="justify-self-start">
              <Link href="/" className="text-lg font-bold text-primary">
                CampusFind
              </Link>
            </div>
          </nav>
        </header>
          <div className="flex-1 flex items-center justify-center p-4">
              {children}
          </div>
      </div>
    </EmeraldBackground>
  );
}
