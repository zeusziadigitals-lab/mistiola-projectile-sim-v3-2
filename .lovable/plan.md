
# Projectile Motion Simulator

A modern, interactive 2D projectile motion lab inspired by PhET — with real-time canvas animation, live physics readouts, and a clean dark-mode UI.

**Title:** "PROJECTILE MOTION SIMULATOR by SIR RENE MISTIOLA"

## Layout

Split responsive layout (stacks on mobile):
- **Left — Control Panel** (sliders + numeric inputs + buttons)
- **Right — Canvas Stage** (trajectory animation + live HUD)
- **Top bar** — App title, dark/light toggle, preset selector

## Inputs (Control Panel)

Each as a slider + numeric field:
- Initial velocity (0–100 m/s)
- Launch angle (0–90°)
- Initial height (0–50 m)
- Mass (0.1–50 kg)
- Gravity (1–25 m/s², default 9.8)
- Drag coefficient (when air resistance ON)
- Toggles: **Air resistance**, **Show grid/axes**, **Show velocity vectors**, **Show trail**

**Buttons:** Start ▶ · Pause ⏸ · Reset ↺ · Step ⏭

## Physics Engine (separate `lib/physics.ts` module)

- **No drag (analytic):** parametric x(t), y(t) using `vx = v·cosθ`, `vy = v·sinθ - g·t`
- **With drag (numeric, RK4 or semi-implicit Euler):**
  `a = -g·ĵ - (k/m)·v` where `k` scales with drag coefficient
- Computes & exposes: time of flight, max height, range, apex point
- Time step ~16 ms for 60 FPS via `requestAnimationFrame`

## Canvas Visualization

- HTML5 Canvas with devicePixelRatio scaling for crisp rendering
- Ground line, optional grid + labeled axes (meters), auto-fit world-to-screen scaling so trajectory always fits
- Projectile drawn as a circle with motion blur trail
- Predicted parabolic path drawn as dashed curve (when paused/before launch)
- Optional velocity vector arrows (vx green, vy blue, resultant white)
- Apex marker + landing marker
- Smooth 60 FPS animation loop

## Live HUD (overlay on canvas)

- Time elapsed (s)
- Position (x, y) m
- Velocity (vx, vy, |v|) m/s
- Current height, distance traveled
- Final stats card on landing: Range · Max Height · Flight Time

## Preset Scenarios

Dropdown buttons that load parameter sets:
- 🎯 Cannon (v=80, θ=45°)
- 🏀 Basketball Shot (v=8, θ=55°, h=2)
- ⚽ Soccer Kick (v=25, θ=30°)
- 🚀 Rocket-ish (v=100, θ=70°)

## Target Mode

- Toggle "Target Mode" — places a draggable target on the ground (or platform)
- Shows "HIT! 🎯" or "Missed by X.X m" after landing
- Optional hit-tolerance indicator

## Theming & Styling

- Dark-mode-first design system in `index.css` (HSL tokens): deep navy background, neon cyan/lime accents for trajectory & vectors, subtle grid lines
- Light/dark toggle in header (persists via localStorage)
- shadcn components: Slider, Switch, Button, Card, Select, Tooltip, Tabs
- Smooth fade/scale animations on panel mount & stat updates

## Mobile Responsiveness

- Below `md`: canvas on top, collapsible control panel (Sheet/Drawer) below
- Touch-friendly slider hit areas
- Canvas resizes via ResizeObserver

## File Structure

- `src/pages/Index.tsx` — page composition
- `src/components/SimulatorHeader.tsx`
- `src/components/ControlPanel.tsx`
- `src/components/SimulationCanvas.tsx`
- `src/components/StatsHUD.tsx`
- `src/components/PresetSelector.tsx`
- `src/lib/physics.ts` — pure physics functions & integrators
- `src/hooks/useSimulation.ts` — RAF loop, state, play/pause/reset
- Update `tailwind.config.ts` & `index.css` with custom tokens, gradients, and the fade/scale animations

## Acceptance

- Accurate parabolic motion (verifiable against analytic formulas when drag OFF)
- Drag ON visibly shortens range and steepens descent
- Live updates reflect in canvas + HUD without lag
- Works smoothly on mobile and desktop
- Preset & target modes function as described
