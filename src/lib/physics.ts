/**
 * Simulation engine for projectile motion (animation only).
 *
 * Responsibilities:
 *   - Define the shared `ProjectileParams` shape (used by UI + analytic module).
 *   - Provide step-based integrators used by the animation loop:
 *       • `analyticStateAt` — exact closed-form state at time t (drag OFF tick).
 *       • `step`            — semi-implicit Euler tick (drag ON).
 *       • `simulateFullTrajectory` — full-path preview when drag is ON.
 *
 * NOT in this file: closed-form summary stats (range, max height, flight time)
 * or path sampling for the predicted dashed parabola. Those live in
 * `src/lib/analyticPhysics.ts` — the single source of truth for analytical math.
 *
 * Gravity convention: g is a POSITIVE scalar (default 9.8 m/s²), subtracted in
 * the equations (matches `analyticPhysics.ts`).
 *
 * World coordinates: x → right (m), y → up (m). Ground is y = 0.
 */
import { computeAnalyticStats } from "./analyticPhysics";

export type AngleUnit = "deg" | "rad";

export interface ProjectileParams {
  v0: number;            // initial speed (m/s)
  angleDeg: number;      // launch angle stored in the user's chosen unit
  angleUnit: AngleUnit;  // "deg" or "rad" — how to interpret angleDeg
  height: number;        // initial height (m)
  mass: number;          // mass (kg)
  gravity: number;       // gravitational acceleration (m/s^2)
  dragEnabled: boolean;
  dragCoefficient: number; // simple linear drag k (N·s/m), force = -k*v
}

/** Convert the stored angle to radians for use in sin/cos. */
export const angleToRadians = (p: ProjectileParams): number =>
  p.angleUnit === "rad" ? p.angleDeg : (p.angleDeg * Math.PI) / 180;

export interface State {
  t: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  landed: boolean;
}

export interface TrajectoryStats {
  range: number;
  maxHeight: number;
  flightTime: number;
  apex: { x: number; y: number };
  landing: { x: number; y: number };
}

export const initialState = (p: ProjectileParams): State => {
  const theta = angleToRadians(p);
  return {
    t: 0,
    x: 0,
    y: p.height,
    vx: p.v0 * Math.cos(theta),
    vy: p.v0 * Math.sin(theta),
    landed: false,
  };
};

/**
 * Exact analytic state at absolute time t (drag OFF).
 * x(t) = vx0 * t
 * y(t) = h + vy0*t - 0.5*g*t^2
 */
export function analyticStateAt(p: ProjectileParams, t: number): State {
  const theta = angleToRadians(p);
  const vx0 = p.v0 * Math.cos(theta);
  const vy0 = p.v0 * Math.sin(theta);
  const stats = analyticStats(p);
  const tf = stats.flightTime;
  const tc = Math.min(Math.max(0, t), tf);
  const x = vx0 * tc;
  const y = p.height + vy0 * tc - 0.5 * p.gravity * tc * tc;
  const vy = vy0 - p.gravity * tc;
  const landed = t >= tf;
  return { t: tc, x, y: landed ? 0 : Math.max(0, y), vx: vx0, vy, landed };
}

/** Advance the state by dt seconds using the appropriate integrator. */
export function step(state: State, p: ProjectileParams, dt: number): State {
  if (state.landed) return state;

  let { x, y, vx, vy, t } = state;

  if (!p.dragEnabled) {
    // Analytic-friendly Euler — exact for constant gravity within a small dt.
    const newVy = vy - p.gravity * dt;
    const newX = x + vx * dt;
    const newY = y + (vy + newVy) * 0.5 * dt;
    vy = newVy;
    x = newX;
    y = newY;
  } else {
    // Semi-implicit Euler with linear drag: a = -g·ĵ - (k/m)·v
    const k = Math.max(0, p.dragCoefficient);
    const ax = -(k / p.mass) * vx;
    const ay = -p.gravity - (k / p.mass) * vy;
    vx = vx + ax * dt;
    vy = vy + ay * dt;
    x = x + vx * dt;
    y = y + vy * dt;
  }

  t += dt;

  let landed = false;
  // Land only when the projectile actually crosses the ground.
  // - Strictly below ground (y < 0), OR
  // - Was above ground (state.y > 0) and now at/below it.
  // This prevents a ground-launch (h=0) from being flagged as landed
  // on the very first tick when dt is effectively 0.
  if (y < 0 || (state.y > 0 && y <= 0)) {
    const prevY = state.y;
    const denom = prevY - y;
    const frac = denom > 1e-9 ? prevY / denom : 1;
    x = state.x + (x - state.x) * frac;
    y = 0;
    t = state.t + dt * frac;
    landed = true;
  }

  return { t, x, y, vx, vy, landed };
}

/**
 * Compute analytic stats (drag OFF) for the predicted trajectory.
 * Used to draw the dashed predicted path and to auto-scale the canvas.
 */
export function analyticStats(p: ProjectileParams): TrajectoryStats {
  const theta = angleToRadians(p);
  const vx = p.v0 * Math.cos(theta);
  const vy = p.v0 * Math.sin(theta);
  const g = p.gravity;
  // y(t) = h + vy*t - 0.5*g*t^2 = 0 → t = (vy + sqrt(vy^2 + 2*g*h)) / g
  const flightTime = (vy + Math.sqrt(vy * vy + 2 * g * Math.max(0, p.height))) / g;
  const range = vx * flightTime;
  const tApex = Math.max(0, vy / g);
  const apexY = p.height + vy * tApex - 0.5 * g * tApex * tApex;
  const apexX = vx * tApex;
  return {
    range,
    maxHeight: Math.max(p.height, apexY),
    flightTime,
    apex: { x: apexX, y: apexY },
    landing: { x: range, y: 0 },
  };
}

/** Sample the predicted trajectory (drag OFF) for path preview. */
export function sampleAnalyticPath(p: ProjectileParams, samples = 80): { x: number; y: number }[] {
  const stats = analyticStats(p);
  const pts: { x: number; y: number }[] = [];
  const theta = angleToRadians(p);
  const vx = p.v0 * Math.cos(theta);
  const vy = p.v0 * Math.sin(theta);
  for (let i = 0; i <= samples; i++) {
    const t = (i / samples) * stats.flightTime;
    const x = vx * t;
    const y = p.height + vy * t - 0.5 * p.gravity * t * t;
    pts.push({ x, y: Math.max(0, y) });
  }
  return pts;
}

/** Simulate full trajectory (with drag) by stepping until landing. Used for preview when drag is ON. */
export function simulateFullTrajectory(
  p: ProjectileParams,
  dt = 0.016,
  maxTime = 120,
): { points: { x: number; y: number }[]; stats: TrajectoryStats } {
  let s = initialState(p);
  const pts: { x: number; y: number }[] = [{ x: s.x, y: s.y }];
  let maxH = s.y;
  let apex = { x: s.x, y: s.y };
  while (!s.landed && s.t < maxTime) {
    s = step(s, p, dt);
    pts.push({ x: s.x, y: s.y });
    if (s.y > maxH) {
      maxH = s.y;
      apex = { x: s.x, y: s.y };
    }
  }
  return {
    points: pts,
    stats: {
      range: s.x,
      maxHeight: maxH,
      flightTime: s.t,
      apex,
      landing: { x: s.x, y: 0 },
    },
  };
}
