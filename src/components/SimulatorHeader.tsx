import { Info, Monitor, Moon, Rocket, Smartphone, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { AboutDialog } from "./AboutDialog";

export type ViewMode = "desktop" | "mobile";

interface Props {
  viewMode: ViewMode;
  setViewMode: (m: ViewMode) => void;
}

export const SimulatorHeader = ({ viewMode, setViewMode }: Props) => {
  const [aboutOpen, setAboutOpen] = useState(false);
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
    <header className="w-full border-b border-border/60 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-30 shrink-0">
      <div className="px-3 flex items-center justify-between gap-4 py-2">
        <div className="flex items-center gap-2.5 animate-fade-in min-w-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary glow-primary shrink-0">
            <Rocket className="h-4 w-4" />
          </div>
          <div className="leading-tight min-w-0">
            <h1 className="text-sm font-bold tracking-tight text-glow truncate">
              PROJECTILE MOTION SIMULATOR v3.2.0
            </h1>
            <p className="text-[10px] text-muted-foreground truncate">
              by SIR RENE D. MISTIOLA
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            variant="outline"
            size="icon"
            aria-label={viewMode === "mobile" ? "Switch to desktop view" : "Switch to mobile view"}
            title={viewMode === "mobile" ? "Desktop view" : "Mobile view"}
            onClick={() => setViewMode(viewMode === "mobile" ? "desktop" : "mobile")}
            className="h-8 w-8"
          >
            {viewMode === "mobile" ? <Monitor className="h-4 w-4" /> : <Smartphone className="h-4 w-4" />}
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Toggle theme"
            onClick={() => setIsDark((v) => !v)}
            className="h-8 w-8"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="About this app"
            title="About"
            onClick={() => setAboutOpen(true)}
            className="h-8 w-8"
          >
            <Info className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <AboutDialog open={aboutOpen} onOpenChange={setAboutOpen} />
    </header>
  );
};
