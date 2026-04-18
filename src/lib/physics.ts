/**
 * Physics engine for projectile motion.
 * - Analytic equations when drag is OFF.
 * - Semi-implicit Euler integration when drag is ON.
 *
 * World coordinates: x → right (m), y → up (m). Ground is y = 0.
 */

export interface ProjectileParams {
  v0: number;            // initial speed (m/s)
  angleDeg: number;      // launch angle (degrees, 0–90)
  height: number;        // initial height (m)
  mass: number;          // mass (kg)
  gravity: number;       // gravitational acceleration (m/s^2)
  dragEnabled: boolean;
  dragCoefficient: number; // simple linear drag k (N·s/m), force = -k*v
}

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
  const theta = (p.angleDeg * Math.PI) / 180;
  return {
    t: 0,
    x: 0,
    y: p.height,
    vx: p.v0 * Math.cos(theta),
    vy: p.v0 * Math.sin(theta),
    landed: false,
  };
};

/** Advance the state by dt seconds using the appropriate integrator. */
export function step(state: State, p: ProjectileParams, dt: number): State {
  if (state.landed) return state;

  let { x, y, vx, vy, t } = state;

  if (!p.dragEnabled) {
    // Analytic-friendly Euler — exact for constant gravity within a small dt.
    const newVy = vy - p.gravity * dt;
    const newX = x + vx * dt;
    const newY = y + (vy + newVy) * 0.5 * dt;
    vx = vx; // unchanged
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
  if (y <= 0) {
    // Linear interpolate to find ground crossing for nicer landing
    const prevY = state.y;
    const frac = prevY / (prevY - y || 1);
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
  const theta = (p.angleDeg * Math.PI) / 180;
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
  const theta = (p.angleDeg * Math.PI) / 180;
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
