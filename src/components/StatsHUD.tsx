import { Card } from "@/components/ui/card";
import { State } from "@/lib/physics";
import { SimStatus } from "@/hooks/useSimulation";

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
    <div className="pointer-events-none absolute inset-0 p-3 sm:p-4 flex flex-col gap-3">
      {/* Live readouts */}
      <Card className="pointer-events-auto panel-gradient w-fit p-3 text-[11px] sm:text-xs space-y-1 animate-fade-in">
        <Row label="Time" value={`${fmt(state.t)} s`} />
        <Row label="Position" value={`(${fmt(state.x, 1)}, ${fmt(state.y, 1)}) m`} />
        <Row label="vₓ" value={`${fmt(state.vx)} m/s`} accent="text-sim-vectorX" />
        <Row label="vᵧ" value={`${fmt(state.vy)} m/s`} accent="text-sim-vectorY" />
        <Row label="|v|" value={`${fmt(speed)} m/s`} />
      </Card>

      <div className="flex-1" />

      {/* Final stats */}
      {status === "landed" && (
        <Card className="pointer-events-auto panel-gradient ml-auto w-fit p-3 text-[11px] sm:text-xs space-y-1 animate-scale-in">
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
        </Card>
      )}

      {miss === false && status !== "landed" && targetMode && targetX != null && (
        <Card className="pointer-events-auto panel-gradient ml-auto w-fit p-2 text-[11px] animate-fade-in">
          🎯 Target at <span className="font-bold text-sim-target">{fmt(targetX, 1)} m</span>
        </Card>
      )}
    </div>
  );
};

const Row = ({ label, value, accent }: { label: string; value: string; accent?: string }) => (
  <div className="flex items-center justify-between gap-3">
    <span className="text-muted-foreground">{label}</span>
    <span className={`font-mono font-medium ${accent ?? ""}`}>{value}</span>
  </div>
);
