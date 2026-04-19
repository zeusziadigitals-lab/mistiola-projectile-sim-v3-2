import { useState } from "react";
import { SimulatorHeader } from "@/components/SimulatorHeader";
import { ControlPanel } from "@/components/ControlPanel";
import { SimulationCanvas } from "@/components/SimulationCanvas";
import { StatsHUD } from "@/components/StatsHUD";
import { useSimulation } from "@/hooks/useSimulation";
import { ProjectileParams } from "@/lib/physics";

const DEFAULT_PARAMS: ProjectileParams = {
  v0: 30,
  angleDeg: 45,
  angleUnit: "deg",
  height: 0,
  mass: 1,
  gravity: 9.8,
  dragEnabled: false,
  dragCoefficient: 0.05,
};

const Index = () => {
  const [params, setParams] = useState<ProjectileParams>(DEFAULT_PARAMS);
  const [showGrid, setShowGrid] = useState(true);
  const [showVectors, setShowVectors] = useState(true);
  const [showTrail, setShowTrail] = useState(true);
  const [targetMode, setTargetMode] = useState(false);
  const [targetX, setTargetX] = useState(60);

  const {
    state,
    status,
    trail,
    predicted,
    stats,
    timeScale,
    setTimeScale,
    start,
    pause,
    reset,
    stepOnce,
  } = useSimulation(params);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <SimulatorHeader />
      <main className="flex-1 min-h-0 px-3 py-3 grid gap-3 lg:grid-cols-[300px_1fr]">
        <aside className="min-h-0 lg:overflow-y-auto lg:pr-1">
          <ControlPanel
            params={params}
            setParams={setParams}
            status={status}
            timeScale={timeScale}
            setTimeScale={setTimeScale}
            onStart={start}
            onPause={pause}
            onReset={reset}
            onStep={stepOnce}
            showGrid={showGrid}
            showVectors={showVectors}
            showTrail={showTrail}
            targetMode={targetMode}
            targetX={targetX}
            setShowGrid={setShowGrid}
            setShowVectors={setShowVectors}
            setShowTrail={setShowTrail}
            setTargetMode={setTargetMode}
            setTargetX={setTargetX}
          />
        </aside>
        <section className="relative min-h-[420px] h-[68vh] lg:h-auto">
          <SimulationCanvas
            params={params}
            state={state}
            trail={trail}
            predicted={predicted}
            stats={stats}
            showGrid={showGrid}
            showVectors={showVectors}
            showTrail={showTrail}
            targetMode={targetMode}
            targetX={targetX}
            onTargetDrag={setTargetX}
          />
          <StatsHUD
            state={state}
            status={status}
            range={stats.range}
            maxHeight={stats.maxHeight}
            flightTime={stats.flightTime}
            targetMode={targetMode}
            targetX={targetMode ? targetX : null}
          />
        </section>
      </main>
    </div>
  );
};

export default Index;
