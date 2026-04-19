/**
 * analyticPhysics.ts
 *
 * EXACT, formula-based projectile motion. No simulation, no integration.
 * This file is the single source of truth for analytical answers — no other
 * file in the project should re-derive these formulas.
 *
 * Gravity convention (project-wide): g is a POSITIVE scalar (default 9.8 m/s²).
 * It is subtracted in the kinematic equations (y = h + Vy·t − ½g·t²).
 *
 * Coordinate convention: x → right (m), y → up (m). Ground is y = 0.
 *
 * Formulas (h = 0 case used by computeAnalyticProjectile):
 *   Vx           = Vi · cos(θ)
 *   Vy           = Vi · sin(θ)
 *   timeOfFlight = (2 · Vy) / g
 *   maxHeight    = Vy² / (2g)
 *   range        = Vx · timeOfFlight
 *
 * Generalized (h ≥ 0 case used by computeAnalyticStats / sampleAnalyticPath):
 *   timeOfFlight = (Vy + √(Vy² + 2·g·h)) / g
 *   apexTime     = max(0, Vy / g)
 *   apexY        = h + Vy·tApex − ½g·tApex²
 */

import type { ProjectileParams } from "./physics";

export const GRAVITY = 9.8;

export interface AnalyticInput {
  /** Initial speed Vi (m/s) */
  initialVelocity: number;
  /** Launch angle θ in DEGREES */
  angleDegrees: number;
  /** Optional override for gravity (m/s²). Defaults to 9.8. */
  gravity?: number;
}

export interface AnalyticResult {
  vx: number;
  vy: number;
  timeOfFlight: number;
  maxHeight: number;
  range: number;
  gravity: number;
}

export interface AnalyticStats {
  range: number;
  maxHeight: number;
  flightTime: number;
  apex: { x: number; y: number };
  landing: { x: number; y: number };
}

const degToRad = (deg: number): number => (deg * Math.PI) / 180;
const round2 = (n: number): number => Math.round(n * 100) / 100;

/**
 * Adapter: turn the shared `ProjectileParams` (used by both UI and simulation)
 * into the analytic-input shape. Centralizes the deg/rad conversion so callers
 * never duplicate it.
 */
export function paramsToAnalyticInput(p: ProjectileParams): AnalyticInput {
  const angleDegrees =
    p.angleUnit === "rad" ? (p.angleDeg * 180) / Math.PI : p.angleDeg;
  return {
    initialVelocity: p.v0,
    angleDegrees,
    gravity: p.gravity,
  };
}

/**
 * Compute exact projectile motion results assuming launch and landing heights
 * are equal (h = 0).
 */
export function computeAnalyticProjectile(
  input: AnalyticInput,
  roundToTwoDecimals = false,
): AnalyticResult {
  const { initialVelocity: vi, angleDegrees } = input;
  const g = input.gravity ?? GRAVITY;

  const theta = degToRad(angleDegrees);
  const vx = vi * Math.cos(theta);
  const vy = vi * Math.sin(theta);

  const timeOfFlight = (2 * vy) / g;
  const maxHeight = (vy * vy) / (2 * g);
  const range = vx * timeOfFlight;

  const result: AnalyticResult = { vx, vy, timeOfFlight, maxHeight, range, gravity: g };
  if (!roundToTwoDecimals) return result;
  return {
    vx: round2(result.vx),
    vy: round2(result.vy),
    timeOfFlight: round2(result.timeOfFlight),
    maxHeight: round2(result.maxHeight),
    range: round2(result.range),
    gravity: round2(result.gravity),
  };
}

/**
 * Full analytic stats supporting non-zero launch height. Used for canvas
 * auto-scaling, the apex marker, and the predicted landing tick.
 */
export function computeAnalyticStats(p: ProjectileParams): AnalyticStats {
  const { initialVelocity: vi, angleDegrees } = paramsToAnalyticInput(p);
  const g = p.gravity;
  const h = Math.max(0, p.height);
  const theta = degToRad(angleDegrees);
  const vx = vi * Math.cos(theta);
  const vy = vi * Math.sin(theta);

  const flightTime = (vy + Math.sqrt(vy * vy + 2 * g * h)) / g;
  const range = vx * flightTime;
  const tApex = Math.max(0, vy / g);
  const apexY = h + vy * tApex - 0.5 * g * tApex * tApex;
  const apexX = vx * tApex;

  return {
    range,
    maxHeight: Math.max(h, apexY),
    flightTime,
    apex: { x: apexX, y: apexY },
    landing: { x: range, y: 0 },
  };
}

/** Sample the analytic trajectory (drag OFF) for the dashed predicted path. */
export function sampleAnalyticPath(
  p: ProjectileParams,
  samples = 80,
): { x: number; y: number }[] {
  const stats = computeAnalyticStats(p);
  const { initialVelocity: vi, angleDegrees } = paramsToAnalyticInput(p);
  const theta = degToRad(angleDegrees);
  const vx = vi * Math.cos(theta);
  const vy = vi * Math.sin(theta);
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i <= samples; i++) {
    const t = (i / samples) * stats.flightTime;
    const x = vx * t;
    const y = p.height + vy * t - 0.5 * p.gravity * t * t;
    pts.push({ x, y: Math.max(0, y) });
  }
  return pts;
}
