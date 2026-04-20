import { useMemo, useState, useCallback } from "react";
import { SimulatorHeader, ViewMode } from "@/components/SimulatorHeader";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal } from "lucide-react";
import { ControlPanel } from "@/components/ControlPanel";
import { SimulationCanvas } from "@/components/SimulationCanvas";
import { StatsHUD } from "@/components/StatsHUD";
import { useSimulation } from "@/hooks/useSimulation";
import { ProjectileParams } from "@/lib/physics";
import {
  computeAnalyticProjectile,
  paramsToAnalyticInput,
} from "@/lib/analyticPhysics";

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

type DisplayMode = "educational" | "physics";

const Index = () => {
  const [params, setParams] = useState<ProjectileParams>(DEFAULT_PARAMS);
  const [showGrid, setShowGrid] = useState(true);
  const [showVectors, setShowVectors] = useState(true);
  const [showTrail, setShowTrail] = useState(true);
  const [targetMode, setTargetMode] = useState(false);
  const [targetX, setTargetX] = useState(60);
  const [displayMode, setDisplayMode] = useState<DisplayMode>("educational");
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window === "undefined") return "desktop";
    const saved = localStorage.getItem("pm-view-mode");
    if (saved === "mobile" || saved === "desktop") return saved;
    return window.innerWidth < 768 ? "mobile" : "desktop";
  });
  const [mobileControlsOpen, setMobileControlsOpen] = useState(false);

  const setViewModePersist = (m: ViewMode) => {
    setViewMode(m);
    try { localStorage.setItem("pm-view-mode", m); } catch {}
  };

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

  // Authoritative displayed stats come ONLY from analyticPhysics.ts.
  // The simulation hook is used purely for visualization (animation, trail, predicted path).
  // Educational mode pre-rounds the result to 2 dp; Physics mode keeps full precision.
  const analytic = useMemo(
    () =>
      computeAnalyticProjectile(
        paramsToAnalyticInput(params),
        displayMode === "educational",
      ),
    [params, displayMode],
  );

  const controlPanel = (
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
      displayMode={displayMode}
      setDisplayMode={setDisplayMode}
    />
  );

  const canvasSection = (
    <section
      className={
        viewMode === "mobile"
          ? "relative flex-1 min-h-0"
          : "relative min-h-[420px] h-[68vh] lg:h-auto"
      }
    >
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
        params={params}
        state={state}
        status={status}
        range={analytic.range}
        maxHeight={analytic.maxHeight}
        flightTime={analytic.timeOfFlight}
        targetMode={targetMode}
        targetX={targetMode ? targetX : null}
        displayMode={displayMode}
      />
    </section>
  );

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <SimulatorHeader viewMode={viewMode} setViewMode={setViewModePersist} />
      {viewMode === "mobile" ? (
        <main className="flex-1 min-h-0 flex flex-col px-2 py-2 gap-2">
          <div className="flex items-center justify-between gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button size="sm" variant="outline" className="h-9 flex-1">
                  <SlidersHorizontal className="mr-2 h-4 w-4" /> Controls
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[85vh] overflow-y-auto p-3">
                {controlPanel}
              </SheetContent>
            </Sheet>
          </div>
          {canvasSection}
        </main>
      ) : (
        <main className="flex-1 min-h-0 px-3 py-3 grid gap-3 lg:grid-cols-[300px_1fr]">
          <aside className="min-h-0 lg:overflow-y-auto lg:pr-1">{controlPanel}</aside>
          {canvasSection}
        </main>
      )}
    </div>
  );
};

export default Index;
