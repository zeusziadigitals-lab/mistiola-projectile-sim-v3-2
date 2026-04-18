import { Moon, Rocket, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export const SimulatorHeader = () => {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const stored = localStorage.getItem("pm-theme");
    if (stored) return stored === "dark";
    return true;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("pm-theme", isDark ? "dark" : "light");
  }, [isDark]);

  return (
    <header className="w-full border-b border-border/60 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30">
      <div className="container flex items-center justify-between gap-4 py-3">
        <div className="flex items-center gap-3 animate-fade-in">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary glow-primary">
            <Rocket className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <h1 className="text-sm sm:text-base font-bold tracking-tight text-glow">
              PROJECTILE MOTION SIMULATOR
            </h1>
            <p className="text-[11px] sm:text-xs text-muted-foreground">
              by SIR RENE MISTIOLA
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="icon"
          aria-label="Toggle theme"
          onClick={() => setIsDark((v) => !v)}
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </div>
    </header>
  );
};
