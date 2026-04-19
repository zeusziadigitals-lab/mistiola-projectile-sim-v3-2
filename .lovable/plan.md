

## Refactor plan: clean separation of analytic vs simulation physics

### Goal
Two independent systems sharing one parameter shape:
1. **Analytical** (`src/lib/analyticPhysics.ts`) — exact closed-form answers (already exists, no formulas elsewhere).
2. **Simulation** (`src/lib/physics.ts` + `useSimulation`) — step-based animation only.

Plus an **Educational / Physics mode** toggle that controls rounding at the display layer only.

---

### 1. Shared parameter structure
- Keep `ProjectileParams` in `src/lib/physics.ts` as the single source of truth for inputs (already shared).
- Add a tiny adapter `paramsToAnalyticInput(params)` inside `analyticPhysics.ts` so callers never duplicate the deg/rad conversion. This guarantees both systems read the same inputs the same way.
- Confirm gravity convention: positive scalar `9.8`. `analyticPhysics` already uses positive g; `physics.ts` already uses positive g (subtracted in equations). No change needed — just document it once at the top of each file.

### 2. Strip analytical responsibilities from simulation
Currently `src/lib/physics.ts` exports `analyticStats` and `sampleAnalyticPath`, which `useSimulation` uses to compute the **predicted dashed path** and **flightTime/range/maxHeight stats** for the canvas. That's analytical math living in the simulation file.

Move both into `analyticPhysics.ts`:
- `computeAnalyticStats(params)` — returns `{ range, maxHeight, flightTime, apex, landing }` (used by canvas auto-scale and apex marker).
- `sampleAnalyticPath(params, samples)` — returns dashed-path points.

Delete the duplicates from `physics.ts`. `physics.ts` then contains ONLY: `ProjectileParams` type, `initialState`, `step` (Euler integrator), `analyticStateAt` (used as the integrator for drag-OFF time-based animation — this is simulation tick logic, stays here), and `simulateFullTrajectory` (drag-ON full-path preview, simulation logic, stays here).

Update `useSimulation` to import the analytic helpers from `analyticPhysics.ts`.

### 3. Clean data flow
```
ProjectileParams (Index.tsx)
    │
    ├──► analyticPhysics.ts ──► HUD readouts (range, height, flightTime)
    │                       └─► Canvas: predicted path, apex marker, auto-scale
    │
    └──► useSimulation ──► state, trail (animation only)
                       └─► Canvas: ball position, trail
```
No component computes physics inline. `Index.tsx` calls analytic helpers once and passes results down.

### 4. Educational / Physics mode toggle
- Add `displayMode: "educational" | "physics"` state in `Index.tsx` (default `"educational"`).
- Add a small toggle in `ControlPanel` (Switch labeled "Educational mode (round to 2 dp)").
- `analyticPhysics.computeAnalyticProjectile(input, roundToTwoDecimals)` already supports this — pass `displayMode === "educational"`.
- `StatsHUD` already uses `fmt(n, 2)` for display, so this toggle primarily controls whether the numerical values themselves (the props) are pre-rounded. To make the toggle visible, switch `fmt`'s decimal count: 2 in educational, 4 in physics. Pass `displayMode` to `StatsHUD`.

### Files touched
- `src/lib/analyticPhysics.ts` — add `paramsToAnalyticInput`, `computeAnalyticStats`, `sampleAnalyticPath`. Header comment on g convention.
- `src/lib/physics.ts` — remove `analyticStats` and `sampleAnalyticPath`. Keep `analyticStateAt` (used by simulation tick). Header comment on g convention.
- `src/hooks/useSimulation.ts` — import analytic helpers from `analyticPhysics.ts`. No behavior change.
- `src/components/SimulationCanvas.tsx` — if it imports `analyticStats` from physics.ts, repoint to analyticPhysics. (Need to verify with a quick read.)
- `src/components/ControlPanel.tsx` — add Educational/Physics mode Switch.
- `src/components/StatsHUD.tsx` — accept `displayMode` prop, use 2 or 4 decimals.
- `src/pages/Index.tsx` — add `displayMode` state, use `paramsToAnalyticInput`, pass mode to ControlPanel + StatsHUD, pass analytic stats to canvas.

### What stays the same
- All UI layout, colors, draggable HUD cards, target mode, controls.
- The simulation's animation behavior (drag on/off integrators).
- Public component prop shapes other than the additions above.

Awaiting approval to implement.

