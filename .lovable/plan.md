

## Plan

**1. Reduce sin/cos/tan display to 2 decimals**
In `src/components/StatsHUD.tsx`, change `fmt(sinV, 4)`, `fmt(cosV, 4)`, and `fmt(sinV/cosV, 4)` → `fmt(..., 2)`. The angle label for radians also uses 4 decimals — change to 2 for consistency. Calculations themselves stay at full precision; only the display rounds.

**2. Accuracy check (already verified in code)**
Yes — the math is correct and consistent:
- `vx = v0·cos θ`, `vy = v0·sin θ` ✓
- `y = h + vy·t − ½g·t²` ✓
- Flight time `(vy + √(vy² + 2gh)) / g` ✓
- Range `vx · t` ✓, Max height `h + vy²/(2g)` ✓
- Drag-OFF uses analytic formulas (zero drift), drag-ON uses semi-implicit Euler.
- Inputs snap to 2 decimals so what the student types = what is computed.

**3. Explanations (Grade 7 friendly) — to write in chat reply only, no code change**

**The Drag Window (Live Readouts floating card):**
Think of it as the projectile's "live report card" while flying:
- **Time** — seconds since launch (a stopwatch).
- **x** — how far sideways it has traveled (meters).
- **y** — how high it is right now (meters).
- **vₓ** — sideways speed (stays the same with no air).
- **vᵧ** — up/down speed. **Positive = going up**, **Negative = falling down**. That's why it turns negative after the top — gravity is pulling it down.
- **|v|** — total speed (combine vₓ and vᵧ like the long side of a right triangle).
- **Trig section (θ, sin θ, cos θ, tan θ)** — the launch angle and its trig values, which decide how much of v₀ becomes sideways vs. upward speed.

You can **drag it anywhere** on the screen so it doesn't cover the projectile's path.

**The Cursor Toggle (Target Mode):**
It's a "hit the target" mini-game.
- Turn it ON → a flag appears at a chosen distance (Target X meters).
- Adjust angle, velocity, or height to try to land the ball on the flag.
- After landing, the HUD shows **HIT! 🎯** if within ~1.5 m, otherwise tells you how many meters you missed by.
It teaches that small changes in angle/speed make a big difference in where things land.

**Files to edit:** `src/components/StatsHUD.tsx` (4 number-format changes).

