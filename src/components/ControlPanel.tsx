import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ProjectileParams } from "@/lib/physics";
import { Pause, Play, RotateCcw, SkipForward, Target } from "lucide-react";
import { PresetSelector, Preset } from "./PresetSelector";
import { SimStatus } from "@/hooks/useSimulation";

interface Props {
  params: ProjectileParams;
  setParams: (p: ProjectileParams) => void;
  status: SimStatus;
  timeScale: number;
  setTimeScale: (s: number) => void;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onStep: () => void;
  showGrid: boolean;
  showVectors: boolean;
  showTrail: boolean;
  targetMode: boolean;
  targetX: number;
  setShowGrid: (b: boolean) => void;
  setShowVectors: (b: boolean) => void;
  setShowTrail: (b: boolean) => void;
  setTargetMode: (b: boolean) => void;
  setTargetX: (n: number) => void;
  displayMode: "educational" | "physics";
  setDisplayMode: (m: "educational" | "physics") => void;
}

interface FieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
}

// Snap any incoming numeric value to 2 decimals so inputs match what a
// student would write on paper. This is the SAME value used in calculations,
// guaranteeing displayed inputs and computed results stay consistent.
const round2 = (n: number) => Math.round(n * 100) / 100;

const Field = ({ label, value, min, max, step, unit, onChange }: FieldProps) => {
  const display = Number.isFinite(value) ? round2(value) : 0;
  const emit = (v: number) => onChange(round2(Math.max(min, Math.min(max, v))));
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-[11px] font-medium">{label}</Label>
        <div className="flex items-center gap-1">
          <Input
            type="number"
            value={display}
            min={min}
            max={max}
            step={step}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              if (!Number.isNaN(v)) emit(v);
            }}
            className="h-6 w-20 px-1.5 py-0 text-right text-[11px]"
          />
          <span className="text-[10px] text-muted-foreground w-7">{unit}</span>
        </div>
      </div>
      <Slider
        value={[display]}
        min={min}
        max={max}
        step={step}
        onValueChange={(v) => emit(v[0])}
      />
    </div>
  );
};

const SPEED_OPTIONS = [
  { v: 0.25, label: "0.25×" },
  { v: 0.5, label: "0.5×" },
  { v: 1, label: "1×" },
  { v: 2, label: "2×" },
];

export const ControlPanel = ({
  params,
  setParams,
  status,
  timeScale,
  setTimeScale,
  onStart,
  onPause,
  onReset,
  onStep,
  showGrid,
  showVectors,
  showTrail,
  targetMode,
  targetX,
  setShowGrid,
  setShowVectors,
  setShowTrail,
  setTargetMode,
  setTargetX,
  displayMode,
  setDisplayMode,
}: Props) => {
  const update = (k: keyof ProjectileParams, v: number | boolean) =>
    setParams({ ...params, [k]: v as never });

  const handlePreset = (preset: Preset) => {
    setParams({ ...params, ...preset.params });
  };

  const isRunning = status === "running";

  return (
    <Card className="panel-gradient p-3 space-y-3 animate-fade-in">
      <div className="space-y-1.5">
        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Preset Scenarios
        </Label>
        <PresetSelector onSelect={handlePreset} />
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        {!isRunning ? (
          <Button onClick={onStart} size="sm" className="col-span-2 animate-pulse-glow h-9">
            <Play className="mr-1 h-4 w-4" /> Launch
          </Button>
        ) : (
          <Button onClick={onPause} size="sm" variant="secondary" className="col-span-2 h-9">
            <Pause className="mr-1 h-4 w-4" /> Pause
          </Button>
        )}
        <Button onClick={onReset} size="sm" variant="outline" className="h-8">
          <RotateCcw className="mr-1 h-3.5 w-3.5" /> Reset
        </Button>
        <Button onClick={onStep} size="sm" variant="outline" disabled={isRunning} className="h-8">
          <SkipForward className="mr-1 h-3.5 w-3.5" /> Step
        </Button>
      </div>

      <div className="space-y-1">
        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Speed
        </Label>
        <div className="grid grid-cols-4 gap-1">
          {SPEED_OPTIONS.map((opt) => (
            <Button
              key={opt.v}
              size="sm"
              variant={timeScale === opt.v ? "default" : "outline"}
              className="h-7 px-1 text-[11px]"
              onClick={() => setTimeScale(opt.v)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2.5">
        <Field label="Initial Velocity" value={params.v0} min={0} max={100} step={0.01} unit="m/s" onChange={(v) => update("v0", v)} />
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Angle Unit</Label>
            <div className="flex gap-1">
              {(["deg", "rad"] as const).map((u) => (
                <Button
                  key={u}
                  size="sm"
                  variant={params.angleUnit === u ? "default" : "outline"}
                  className="h-6 px-2 text-[10px]"
                  onClick={() => {
                    if (params.angleUnit === u) return;
                    // Convert the stored angle so the physical launch angle is preserved.
                    const converted =
                      u === "rad"
                        ? (params.angleDeg * Math.PI) / 180
                        : (params.angleDeg * 180) / Math.PI;
                    setParams({ ...params, angleUnit: u, angleDeg: Number(converted.toFixed(4)) });
                  }}
                >
                  {u === "deg" ? "Degrees" : "Radians"}
                </Button>
              ))}
            </div>
          </div>
          <Field
            label={params.angleUnit === "deg" ? "Launch Angle" : "Launch Angle"}
            value={params.angleDeg}
            min={0}
            max={params.angleUnit === "deg" ? 90 : Number((Math.PI / 2).toFixed(4))}
            step={0.01}
            unit={params.angleUnit === "deg" ? "°" : "rad"}
            onChange={(v) => update("angleDeg", v)}
          />
        </div>
        <Field label="Initial Height" value={params.height} min={0} max={50} step={0.01} unit="m" onChange={(v) => update("height", v)} />
        <Field label="Mass" value={params.mass} min={0.1} max={50} step={0.01} unit="kg" onChange={(v) => update("mass", v)} />
        <Field label="Gravity" value={params.gravity} min={1} max={25} step={0.01} unit="m/s²" onChange={(v) => update("gravity", v)} />
        {params.dragEnabled && (
          <Field label="Drag Coefficient" value={params.dragCoefficient} min={0} max={1} step={0.01} unit="N·s/m" onChange={(v) => update("dragCoefficient", v)} />
        )}
      </div>

      <div className="space-y-1.5 rounded-lg border border-border/60 p-2">
        <ToggleRow label="Air Resistance" checked={params.dragEnabled} onChange={(b) => update("dragEnabled", b)} />
        <ToggleRow label="Show Grid / Axes" checked={showGrid} onChange={setShowGrid} />
        <ToggleRow label="Velocity Vectors" checked={showVectors} onChange={setShowVectors} />
        <ToggleRow label="Show Trail" checked={showTrail} onChange={setShowTrail} />
        <ToggleRow label="Target Mode" checked={targetMode} onChange={setTargetMode} icon={<Target className="h-3.5 w-3.5 text-sim-target" />} />
        {targetMode && (
          <Field label="Target X" value={targetX} min={1} max={500} step={1} unit="m" onChange={setTargetX} />
        )}
      </div>

      <div className="space-y-1.5 rounded-lg border border-border/60 p-2">
        <div className="flex items-center justify-between">
          <Label className="text-[11px] flex flex-col">
            <span>Display Mode</span>
            <span className="text-[9px] text-muted-foreground font-normal">
              {displayMode === "educational" ? "Educational · 2 dp" : "Physics · 4 dp"}
            </span>
          </Label>
          <Switch
            checked={displayMode === "physics"}
            onCheckedChange={(b) => setDisplayMode(b ? "physics" : "educational")}
          />
        </div>
      </div>
    </Card>
  );
};

const ToggleRow = ({
  label,
  checked,
  onChange,
  icon,
}: {
  label: string;
  checked: boolean;
  onChange: (b: boolean) => void;
  icon?: React.ReactNode;
}) => (
  <div className="flex items-center justify-between">
    <Label className="text-[11px] flex items-center gap-1.5">
      {icon}
      {label}
    </Label>
    <Switch checked={checked} onCheckedChange={onChange} />
  </div>
);
