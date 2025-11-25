import { Navbar } from "@/components/navbar";
import { LostItemsGrid } from "@/components/lost-items-grid";
import { ThemeSwitcher } from "@/components/theme-switcher";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 w-full flex flex-col items-center">
        <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Lost Items</h1>
            <p className="text-muted-foreground">
              Browse items that have been reported as lost
            </p>
          </div>
          <LostItemsGrid />
        </div>
      </div>
      <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-16">
        <ThemeSwitcher />
      </footer>
    </main>
  );
}
