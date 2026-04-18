import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProjectileParams } from "@/lib/physics";

export interface Preset {
  id: string;
  label: string;
  params: Partial<ProjectileParams>;
}

export const PRESETS: Preset[] = [
  { id: "cannon", label: "🎯 Cannon", params: { v0: 80, angleDeg: 45, height: 0, mass: 10, gravity: 9.8, dragEnabled: false } },
  { id: "basketball", label: "🏀 Basketball Shot", params: { v0: 8, angleDeg: 55, height: 2, mass: 0.6, gravity: 9.8, dragEnabled: false } },
  { id: "soccer", label: "⚽ Soccer Kick", params: { v0: 25, angleDeg: 30, height: 0, mass: 0.45, gravity: 9.8, dragEnabled: true, dragCoefficient: 0.05 } },
  { id: "rocket", label: "🚀 Rocket-ish", params: { v0: 100, angleDeg: 70, height: 0, mass: 5, gravity: 9.8, dragEnabled: false } },
];

interface Props {
  onSelect: (preset: Preset) => void;
}

export const PresetSelector = ({ onSelect }: Props) => {
  return (
    <Select
      onValueChange={(id) => {
        const p = PRESETS.find((x) => x.id === id);
        if (p) onSelect(p);
      }}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Load a preset…" />
      </SelectTrigger>
      <SelectContent>
        {PRESETS.map((p) => (
          <SelectItem key={p.id} value={p.id}>
            {p.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
