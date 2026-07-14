## Goal
Make the Quick Start popup appear on every page load by default, but give the user a way to disable it.

## Changes

### 1. `src/components/OnboardingOverlay.tsx`
- Remove the "dismissed forever" localStorage flag (`pm-onboarding-dismissed-v1`).
- On mount, read a new preference `pm-onboarding-enabled` (default: `"1"` / true). If enabled → open the popup every load.
- Dismissing the popup (X button, backdrop click, or "Get Started") only closes it for this load — it does NOT persist a "never show again".
- Add a small checkbox inside the popup: **"Don't show this on startup"**. When checked and the user dismisses, set `pm-onboarding-enabled = "0"`.

### 2. `src/components/AboutDialog.tsx`
- Add a **Preferences** row with a toggle/switch: **"Show Quick Start on startup"**.
- Reads/writes the same `pm-onboarding-enabled` localStorage key so users can re-enable it later without clearing site data.

### 3. Migration
- On first load after this change, ignore the old `pm-onboarding-dismissed-v1` key (leave it — harmless). New key controls behavior.

## Result
- Default experience: popup opens every time the app loads.
- Users who don't want it can turn it off from either the popup checkbox or the About dialog toggle, and can turn it back on anytime from About.

No physics, simulation, or backend code is touched — UI-only change in two files.