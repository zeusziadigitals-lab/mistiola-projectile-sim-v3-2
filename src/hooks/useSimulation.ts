import { useCallback, useEffect, useRef, useState } from "react";
import {
  ProjectileParams,
  State,
  initialState,
  step,
  analyticStats,
  simulateFullTrajectory,
  TrajectoryStats,
} from "@/lib/physics";

export type SimStatus = "idle" | "running" | "paused" | "landed";

export interface UseSimulationReturn {
  state: State;
  status: SimStatus;
  trail: { x: number; y: number }[];
  predicted: { x: number; y: number }[];
  stats: TrajectoryStats;
  timeScale: number;
  setTimeScale: (s: number) => void;
  start: () => void;
  pause: () => void;
  reset: () => void;
  stepOnce: () => void;
}

export function useSimulation(params: ProjectileParams): UseSimulationReturn {
  const [timeScale, setTimeScale] = useState(0.5); // slower default so animation is visible
  const timeScaleRef = useRef(timeScale);
  timeScaleRef.current = timeScale;
  const [state, setState] = useState<State>(() => initialState(params));
  const [status, setStatus] = useState<SimStatus>("idle");
  const [trail, setTrail] = useState<{ x: number; y: number }[]>([]);

  const stateRef = useRef(state);
  const paramsRef = useRef(params);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  stateRef.current = state;
  paramsRef.current = params;

  // Predicted path + stats (recomputed when params change)
  const [predicted, setPredicted] = useState<{ x: number; y: number }[]>([]);
  const [stats, setStats] = useState<TrajectoryStats>(() => analyticStats(params));

  useEffect(() => {
    if (params.dragEnabled) {
      const r = simulateFullTrajectory(params);
      setPredicted(r.points);
      setStats(r.stats);
    } else {
      // Sample analytic path
      const s = analyticStats(params);
      setStats(s);
      const pts: { x: number; y: number }[] = [];
      const theta = (params.angleDeg * Math.PI) / 180;
      const vx = params.v0 * Math.cos(theta);
      const vy = params.v0 * Math.sin(theta);
      const N = 80;
      for (let i = 0; i <= N; i++) {
        const t = (i / N) * s.flightTime;
        pts.push({
          x: vx * t,
          y: Math.max(0, params.height + vy * t - 0.5 * params.gravity * t * t),
        });
      }
      setPredicted(pts);
    }
  }, [params]);

  // Reset state when params change while idle
  useEffect(() => {
    if (status === "idle") {
      setState(initialState(params));
      setTrail([]);
    }
  }, [params, status]);

  const tick = useCallback((now: number) => {
    if (lastTimeRef.current == null) lastTimeRef.current = now;
    const rawDt = (now - lastTimeRef.current) / 1000;
    lastTimeRef.current = now;
    // Clamp dt and substep for stability
    const dt = Math.min(rawDt, 0.05) * timeScaleRef.current;
    const SUBSTEPS = 4;
    let s = stateRef.current;
    for (let i = 0; i < SUBSTEPS; i++) {
      s = step(s, paramsRef.current, dt / SUBSTEPS);
      if (s.landed) break;
    }
    if (Math.random() < 0.04) console.log("[sim]", { dt: dt.toFixed(4), t: s.t.toFixed(2), x: s.x.toFixed(1), y: s.y.toFixed(1), landed: s.landed });
    setState(s);
    setTrail((prev) => {
      const next = [...prev, { x: s.x, y: s.y }];
      // cap trail length to avoid runaway memory
      if (next.length > 1200) next.splice(0, next.length - 1200);
      return next;
    });
    if (s.landed) {
      setStatus("landed");
      rafRef.current = null;
      lastTimeRef.current = null;
      return;
    }
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const start = useCallback(() => {
    if (status === "running") return;
    if (status === "landed" || status === "idle") {
      setState(initialState(paramsRef.current));
      setTrail([]);
    }
    setStatus("running");
    lastTimeRef.current = null;
    rafRef.current = requestAnimationFrame(tick);
  }, [status, tick]);

  const pause = useCallback(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    lastTimeRef.current = null;
    setStatus((prev) => (prev === "running" ? "paused" : prev));
  }, []);

  const reset = useCallback(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    lastTimeRef.current = null;
    setState(initialState(paramsRef.current));
    setTrail([]);
    setStatus("idle");
  }, []);

  const stepOnce = useCallback(() => {
    if (status === "running") return;
    let s = stateRef.current;
    if (s.landed) return;
    const dt = 0.05;
    s = step(s, paramsRef.current, dt);
    setState(s);
    setTrail((prev) => [...prev, { x: s.x, y: s.y }]);
    if (s.landed) setStatus("landed");
    else setStatus("paused");
  }, [status]);

  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return { state, status, trail, predicted, stats, timeScale, setTimeScale, start, pause, reset, stepOnce };
}
