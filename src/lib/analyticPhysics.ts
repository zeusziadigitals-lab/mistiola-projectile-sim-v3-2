/**
 * analyticPhysics.ts
 *
 * Exact, formula-based projectile motion results for the case where the
 * launch and landing heights are equal (h = 0). No simulation, no drag.
 *
 * Formulas:
 *   Vx            = Vi * cos(θ)
 *   Vy            = Vi * sin(θ)
 *   timeOfFlight  = (2 * Vy) / g
 *   maxHeight     = Vy² / (2g)
 *   range         = Vx * timeOfFlight
 *
 * Conventions:
 *   - gravity g = 9.8 m/s² (positive scalar)
 *   - angle is provided in DEGREES and converted to radians internally
 */

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
  /** Horizontal velocity component Vx (m/s) */
  vx: number;
  /** Vertical velocity component Vy (m/s) */
  vy: number;
  /** Total time the projectile spends in the air (s) */
  timeOfFlight: number;
  /** Peak vertical height reached above launch level (m) */
  maxHeight: number;
  /** Horizontal distance traveled before landing (m) */
  range: number;
  /** Echo of the gravity used in the calculation (m/s²) */
  gravity: number;
}

const degToRad = (deg: number): number => (deg * Math.PI) / 180;

const round2 = (n: number): number => Math.round(n * 100) / 100;

/**
 * Compute exact projectile motion results.
 *
 * @param input              { initialVelocity, angleDegrees, gravity? }
 * @param roundToTwoDecimals If true, every numeric field in the result is
 *                           rounded to 2 decimal places (display-friendly).
 *                           Defaults to false (full precision).
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

  const result: AnalyticResult = {
    vx,
    vy,
    timeOfFlight,
    maxHeight,
    range,
    gravity: g,
  };

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
