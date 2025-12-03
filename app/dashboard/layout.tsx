import { ThemeSwitcher } from "@/components/theme-switcher";
import { Navbar } from "@/components/navbar";
import { SearchProvider } from "@/components/search-context";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SearchProvider>
      <main className="min-h-screen flex flex-col items-center">
        <div className="flex-1 w-full flex flex-col gap-6 items-center">
          <Navbar variant="dashboard" />
          
          <div className="flex-1 flex flex-col gap-10 mx-auto w-[80%] sm:px-6 lg:px-8">
            {children}
          </div>
  
          <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-16">
            <ThemeSwitcher />
          </footer>
        </div>
      </main>
    </SearchProvider>
  );
}
