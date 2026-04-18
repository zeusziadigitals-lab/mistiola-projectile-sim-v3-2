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

const Field = ({ label, value, min, max, step, unit, onChange }: FieldProps) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between gap-2">
      <Label className="text-xs font-medium">{label}</Label>
      <div className="flex items-center gap-1">
        <Input
          type="number"
          value={Number.isFinite(value) ? value : 0}
          min={min}
          max={max}
          step={step}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            if (!Number.isNaN(v)) onChange(Math.max(min, Math.min(max, v)));
          }}
          className="h-7 w-20 px-2 py-0 text-right text-xs"
        />
        <span className="text-[10px] text-muted-foreground w-8">{unit}</span>
      </div>
    </div>
    <Slider
      value={[value]}
      min={min}
      max={max}
      step={step}
      onValueChange={(v) => onChange(v[0])}
    />
  </div>
);

export const ControlPanel = ({
  params,
  setParams,
  status,
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
}: Props) => {
  const update = (k: keyof ProjectileParams, v: number | boolean) =>
    setParams({ ...params, [k]: v as never });

  const handlePreset = (preset: Preset) => {
    setParams({ ...params, ...preset.params });
  };

  const isRunning = status === "running";

  return (
    <Card className="panel-gradient p-4 sm:p-5 space-y-5 animate-fade-in">
      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">
          Preset Scenarios
        </Label>
        <PresetSelector onSelect={handlePreset} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        {!isRunning ? (
          <Button onClick={onStart} className="col-span-2 animate-pulse-glow">
            <Play className="mr-1" /> Start
          </Button>
        ) : (
          <Button onClick={onPause} variant="secondary" className="col-span-2">
            <Pause className="mr-1" /> Pause
          </Button>
        )}
        <Button onClick={onReset} variant="outline">
          <RotateCcw className="mr-1" /> Reset
        </Button>
        <Button onClick={onStep} variant="outline" disabled={isRunning}>
          <SkipForward className="mr-1" /> Step
        </Button>
      </div>

      <div className="space-y-4">
        <Field label="Initial Velocity" value={params.v0} min={0} max={100} step={1} unit="m/s" onChange={(v) => update("v0", v)} />
        <Field label="Launch Angle" value={params.angleDeg} min={0} max={90} step={1} unit="°" onChange={(v) => update("angleDeg", v)} />
        <Field label="Initial Height" value={params.height} min={0} max={50} step={0.5} unit="m" onChange={(v) => update("height", v)} />
        <Field label="Mass" value={params.mass} min={0.1} max={50} step={0.1} unit="kg" onChange={(v) => update("mass", v)} />
        <Field label="Gravity" value={params.gravity} min={1} max={25} step={0.1} unit="m/s²" onChange={(v) => update("gravity", v)} />
        {params.dragEnabled && (
          <Field label="Drag Coefficient" value={params.dragCoefficient} min={0} max={1} step={0.01} unit="N·s/m" onChange={(v) => update("dragCoefficient", v)} />
        )}
      </div>

      <div className="space-y-3 rounded-lg border border-border/60 p-3">
        <ToggleRow label="Air Resistance" checked={params.dragEnabled} onChange={(b) => update("dragEnabled", b)} />
        <ToggleRow label="Show Grid / Axes" checked={showGrid} onChange={setShowGrid} />
        <ToggleRow label="Show Velocity Vectors" checked={showVectors} onChange={setShowVectors} />
        <ToggleRow label="Show Trail" checked={showTrail} onChange={setShowTrail} />
        <ToggleRow label="Target Mode" checked={targetMode} onChange={setTargetMode} icon={<Target className="h-3.5 w-3.5 text-sim-target" />} />
        {targetMode && (
          <Field label="Target X" value={targetX} min={1} max={500} step={1} unit="m" onChange={setTargetX} />
        )}
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
    <Label className="text-xs flex items-center gap-1.5">
      {icon}
      {label}
    </Label>
    <Switch checked={checked} onCheckedChange={onChange} />
  </div>
);
