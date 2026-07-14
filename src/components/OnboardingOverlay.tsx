import { useEffect, useState } from "react";
import { Rocket, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { sfx } from "@/lib/sounds";

const ENABLED_KEY = "pm-onboarding-enabled";

export const isOnboardingEnabled = () => {
  try {
    const v = localStorage.getItem(ENABLED_KEY);
    return v === null ? true : v === "1";
  } catch {
    return true;
  }
};

export const setOnboardingEnabled = (enabled: boolean) => {
  try { localStorage.setItem(ENABLED_KEY, enabled ? "1" : "0"); } catch {}
};

export const OnboardingOverlay = () => {
  const [open, setOpen] = useState(false);
  const [dontShow, setDontShow] = useState(false);

  useEffect(() => {
    if (isOnboardingEnabled()) setOpen(true);
  }, []);

  const dismiss = () => {
    if (dontShow) setOnboardingEnabled(false);
    sfx.close?.();
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      {/* Frosted glass backdrop */}
      <div
        className="absolute inset-0 bg-background/40 backdrop-blur-2xl backdrop-saturate-150"
        onClick={dismiss}
      />

      {/* Premium glass card */}
      <div
        className="relative w-full max-w-md rounded-2xl border border-white/15 dark:border-white/10
                   bg-white/30 dark:bg-white/5 backdrop-blur-2xl backdrop-saturate-150
                   shadow-[0_20px_70px_-10px_hsl(var(--primary)/0.35),0_0_0_1px_hsl(var(--primary)/0.1)_inset]
                   p-6 sm:p-7"
      >
        <button
          onClick={dismiss}
          aria-label="Dismiss onboarding"
          className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full
                     bg-background/40 hover:bg-background/70 border border-border/50 transition-colors text-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20 text-primary glow-primary">
            <Rocket className="h-4 w-4" />
          </div>
          <h2
            id="onboarding-title"
            className="text-base sm:text-lg font-semibold tracking-tight text-glow"
          >
            Quick Start
          </h2>
        </div>

        <ul className="text-left text-sm sm:text-[15px] leading-relaxed text-foreground/90 space-y-2 mb-4">
          <li>• Adjust velocity, angle, and height on the left panel</li>
          <li>• Click <span className="font-semibold text-primary">Launch</span> to start the motion</li>
          <li>• Observe the path and values on the screen</li>
          <li>• Use <span className="font-semibold">Reset</span> to try again</li>
        </ul>

        <p className="text-left text-sm text-muted-foreground mb-1">
          💡 Try different values to see how the motion changes
        </p>
        <p className="text-left text-sm font-medium text-foreground/90 mb-4">
          Happy learning
        </p>

        <label className="flex items-center gap-2 mb-4 cursor-pointer select-none">
          <Checkbox
            checked={dontShow}
            onCheckedChange={(v) => setDontShow(v === true)}
            id="onboarding-dont-show"
          />
          <span className="text-xs text-muted-foreground">
            Don't show this on startup (you can re-enable it in About)
          </span>
        </label>

        <Button onClick={dismiss} className="w-full glow-primary">
          Get Started
        </Button>
      </div>
    </div>
  );
};
