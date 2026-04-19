import { ProjectileParams, State, angleToRadians } from "@/lib/physics";
import { SimStatus } from "@/hooks/useSimulation";
import { DraggableCard } from "./DraggableCard";

export type DisplayMode = "educational" | "physics";

interface Props {
  params: ProjectileParams;
  state: State;
  status: SimStatus;
  range: number;
  maxHeight: number;
  flightTime: number;
  targetMode: boolean;
  targetX: number | null;
  displayMode?: DisplayMode;
}

const fmt = (n: number, d = 2) => (Number.isFinite(n) ? n.toFixed(d) : "—");

export const StatsHUD = ({ params, state, status, range, maxHeight, flightTime, targetMode, targetX, displayMode = "educational" }: Props) => {
  // Educational mode: 2 dp everywhere. Physics mode: 4 dp for finer inspection.
  const dp = displayMode === "educational" ? 2 : 4;
  const f = (n: number) => fmt(n, dp);
  const speed = Math.hypot(state.vx, state.vy);
  const theta = angleToRadians(params);
  const sinV = Math.sin(theta);
  const cosV = Math.cos(theta);
  const angleLabel = params.angleUnit === "rad"
    ? `${f(params.angleDeg)} rad`
    : `${f(params.angleDeg)}°`;
  const hit = targetMode && targetX != null && status === "landed" ? Math.abs(state.x - targetX) <= 1.5 : false;

  return (
    <div className="pointer-events-none absolute inset-0">
      {/* Live readouts — draggable */}
      <DraggableCard
        initial={{ x: 12, y: 12 }}
        storageKey="hud-live-pos"
        className="w-[210px] text-[11px] sm:text-xs animate-fade-in"
      >
        <div className="space-y-1">
          <Row label="Time" value={`${f(state.t)} s`} />
          <Row label="x" value={`${f(state.x)} m`} />
          <Row label="y" value={`${f(state.y)} m`} />
          <Row label="vₓ" value={`${f(state.vx)} m/s`} accent="text-sim-vectorX" />
          <Row label="vᵧ" value={`${f(state.vy)} m/s`} accent="text-sim-vectorY" />
          <div className="text-[9px] text-muted-foreground italic leading-tight">
            vᵧ sign: + up, − down (gravity)
          </div>
          <Row label="|v|" value={`${f(speed)} m/s`} />
          <div className="mt-1 pt-1 border-t border-border/50 space-y-1">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Trig (launch θ)</div>
            <Row label="θ" value={angleLabel} />
            <Row label="sin θ" value={f(sinV)} accent="text-sim-vectorY" />
            <Row label="cos θ" value={f(cosV)} accent="text-sim-vectorX" />
            <Row label="tan θ" value={Math.abs(cosV) < 1e-9 ? "—" : f(sinV / cosV)} />
          </div>
        </div>
      </DraggableCard>

      {/* Final stats — draggable */}
      {status === "landed" && (
        <DraggableCard
          initial={{ x: 9999, y: 9999 }}
          storageKey="hud-final-pos"
          className="w-[200px] text-[11px] sm:text-xs animate-scale-in"
        >
          <div className="space-y-1">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Final Stats</div>
            <Row label="Range" value={`${f(range)} m`} />
            <Row label="Max Height" value={`${f(maxHeight)} m`} />
            <Row label="Flight Time" value={`${f(flightTime)} s`} />
            {targetMode && targetX != null && (
              <div
                className={`mt-1 rounded px-2 py-1 text-center font-bold ${
                  hit ? "bg-sim-target/20 text-sim-target" : "bg-muted text-muted-foreground"
                }`}
              >
                {hit ? "HIT! 🎯" : `Missed by ${f(Math.abs(state.x - targetX))} m`}
              </div>
            )}
          </div>
        </DraggableCard>
      )}

      {status !== "landed" && targetMode && targetX != null && (
        <DraggableCard
          initial={{ x: 9999, y: 12 }}
          storageKey="hud-target-pos"
          className="w-[160px] text-[11px] animate-fade-in"
        >
          🎯 Target at <span className="font-bold text-sim-target">{fmt(targetX, 1)} m</span>
        </DraggableCard>
      )}
    </div>
  );
};

function Row({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-mono font-medium ${accent ?? ""}`}>{value}</span>
    </div>
  );
}
