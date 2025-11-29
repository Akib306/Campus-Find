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
        <nav className="absolute top-0 left-0 p-6 w-full">
            <Link href="/" className="text-lg font-bold text-white hover:text-emerald-400 transition-colors">
                CampusFind
            </Link>
        </nav>
        <div className="flex-1 flex items-center justify-center p-4">
            {children}
        </div>
      </div>
    </EmeraldBackground>
  );
}
