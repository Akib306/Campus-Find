
import { Hero } from "@/components/hero";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Navbar } from "@/components/navbar";

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <Navbar variant="landing" /> 
      <div className="flex-1 w-full flex flex-col gap-20 items-center">
        
        <div className="flex-1 flex flex-col gap-20 max-w-5xl p-5">
          <Hero />
        </div>

        <footer className="sticky bottom-0 w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-8">
          <ThemeSwitcher />
        </footer>
      </div>
    </main>
  );
}
