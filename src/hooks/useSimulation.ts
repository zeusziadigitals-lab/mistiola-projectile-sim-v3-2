import { useCallback, useEffect, useRef, useState } from "react";
import {
  ProjectileParams,
  State,
  initialState,
  step,
  analyticStateAt,
  simulateFullTrajectory,
  TrajectoryStats,
} from "@/lib/physics";
import { computeAnalyticStats, sampleAnalyticPath } from "@/lib/analyticPhysics";

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
  const [timeScale, setTimeScale] = useState(0.5);
  const [state, setState] = useState<State>(() => initialState(params));
  const [status, setStatus] = useState<SimStatus>("idle");
  const [trail, setTrail] = useState<{ x: number; y: number }[]>([]);

  // Refs: kept in sync with latest values for use inside RAF loop.
  const stateRef = useRef(state);
  const paramsRef = useRef(params);
  const statusRef = useRef(status);
  const timeScaleRef = useRef(timeScale);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  stateRef.current = state;
  paramsRef.current = params;
  statusRef.current = status;
  timeScaleRef.current = timeScale;

  // Predicted path + stats (recomputed when params change)
  const [predicted, setPredicted] = useState<{ x: number; y: number }[]>([]);
  const [stats, setStats] = useState<TrajectoryStats>(() => computeAnalyticStats(params));

  useEffect(() => {
    if (params.dragEnabled) {
      const r = simulateFullTrajectory(params);
      setPredicted(r.points);
      setStats(r.stats);
    } else {
      setStats(computeAnalyticStats(params));
      setPredicted(sampleAnalyticPath(params, 80));
    }
  }, [params]);

  // Reset state to initial only when params change while idle (not while running/paused/landed).
  useEffect(() => {
    if (statusRef.current === "idle") {
      setState(initialState(params));
      setTrail([]);
    }
  }, [params]);

  // Time-based RAF tick.
  // - Drag OFF: compute exact analytic state at elapsed time t (no per-frame integration drift).
  // - Drag ON:  use semi-implicit Euler substeps from the previous state.
  const elapsedRef = useRef(0);
  const tick = useCallback((now: number) => {
    if (lastTimeRef.current == null) lastTimeRef.current = now;
    const rawDt = (now - lastTimeRef.current) / 1000;
    lastTimeRef.current = now;
    const dt = Math.min(rawDt, 0.05) * timeScaleRef.current;
    elapsedRef.current += dt;

    const p = paramsRef.current;
    let s: State;
    if (!p.dragEnabled) {
      s = analyticStateAt(p, elapsedRef.current);
    } else {
      const SUBSTEPS = 4;
      s = stateRef.current;
      for (let i = 0; i < SUBSTEPS; i++) {
        s = step(s, p, dt / SUBSTEPS);
        if (s.landed) break;
      }
    }
    stateRef.current = s;
    setState(s);
    setTrail((prev) => {
      const next = prev.length > 1200 ? prev.slice(-1200) : [...prev];
      next.push({ x: s.x, y: s.y });
      return next;
    });
    if (s.landed) {
      statusRef.current = "landed";
      setStatus("landed");
      rafRef.current = null;
      lastTimeRef.current = null;
      return;
    }
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const start = useCallback(() => {
    if (statusRef.current === "running") return;
    if (statusRef.current === "landed" || statusRef.current === "idle") {
      const init = initialState(paramsRef.current);
      stateRef.current = init;
      setState(init);
      setTrail([]);
      elapsedRef.current = 0;
    }
    statusRef.current = "running";
    setStatus("running");
    lastTimeRef.current = null;
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  const pause = useCallback(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    lastTimeRef.current = null;
    if (statusRef.current === "running") {
      statusRef.current = "paused";
      setStatus("paused");
    }
  }, []);

  const reset = useCallback(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    lastTimeRef.current = null;
    elapsedRef.current = 0;
    const init = initialState(paramsRef.current);
    stateRef.current = init;
    setState(init);
    setTrail([]);
    statusRef.current = "idle";
    setStatus("idle");
  }, []);

  const stepOnce = useCallback(() => {
    if (statusRef.current === "running") return;
    let s = stateRef.current;
    if (s.landed) return;
    const dt = 0.05;
    const p = paramsRef.current;
    if (!p.dragEnabled) {
      elapsedRef.current += dt;
      s = analyticStateAt(p, elapsedRef.current);
    } else {
      s = step(s, p, dt);
    }
    stateRef.current = s;
    setState(s);
    setTrail((prev) => [...prev, { x: s.x, y: s.y }]);
    if (s.landed) {
      statusRef.current = "landed";
      setStatus("landed");
    } else {
      statusRef.current = "paused";
      setStatus("paused");
    }
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return { state, status, trail, predicted, stats, timeScale, setTimeScale, start, pause, reset, stepOnce };
}
