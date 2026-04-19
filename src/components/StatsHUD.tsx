import { Card } from "@/components/ui/card";
import { State } from "@/lib/physics";
import { SimStatus } from "@/hooks/useSimulation";
import { DraggableCard } from "./DraggableCard";

interface Props {
  state: State;
  status: SimStatus;
  range: number;
  maxHeight: number;
  flightTime: number;
  targetMode: boolean;
  targetX: number | null;
}

const fmt = (n: number, d = 2) => (Number.isFinite(n) ? n.toFixed(d) : "—");

export const StatsHUD = ({ state, status, range, maxHeight, flightTime, targetMode, targetX }: Props) => {
  const speed = Math.hypot(state.vx, state.vy);
  const hit = targetMode && targetX != null && status === "landed" ? Math.abs(state.x - targetX) <= 1.5 : false;
  const miss = targetMode && targetX != null && status === "landed" && !hit;

  return (
    <div className="pointer-events-none absolute inset-0">
      {/* Live readouts — draggable */}
      <DraggableCard
        initial={{ x: 12, y: 12 }}
        storageKey="hud-live-pos"
        className="w-[180px] text-[11px] sm:text-xs animate-fade-in"
      >
        <div className="space-y-1">
          <Row label="Time" value={`${fmt(state.t)} s`} />
          <Row label="x" value={`${fmt(state.x)} m`} />
          <Row label="y" value={`${fmt(state.y)} m`} />
          <Row label="vₓ" value={`${fmt(state.vx)} m/s`} accent="text-sim-vectorX" />
          <Row label="vᵧ" value={`${fmt(state.vy)} m/s`} accent="text-sim-vectorY" />
          <Row label="|v|" value={`${fmt(speed)} m/s`} />
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
            <Row label="Range" value={`${fmt(range, 2)} m`} />
            <Row label="Max Height" value={`${fmt(maxHeight, 2)} m`} />
            <Row label="Flight Time" value={`${fmt(flightTime, 2)} s`} />
            {targetMode && targetX != null && (
              <div
                className={`mt-1 rounded px-2 py-1 text-center font-bold ${
                  hit ? "bg-sim-target/20 text-sim-target" : "bg-muted text-muted-foreground"
                }`}
              >
                {hit ? "HIT! 🎯" : `Missed by ${fmt(Math.abs(state.x - targetX), 2)} m`}
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
