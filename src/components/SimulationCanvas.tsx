import { useEffect, useRef } from "react";
import { ProjectileParams, State, TrajectoryStats } from "@/lib/physics";

interface Props {
  params: ProjectileParams;
  state: State;
  trail: { x: number; y: number }[];
  predicted: { x: number; y: number }[];
  stats: TrajectoryStats;
  showGrid: boolean;
  showVectors: boolean;
  showTrail: boolean;
  targetMode: boolean;
  targetX: number;
  onTargetDrag: (x: number) => void;
}

const cssVar = (name: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();
const hsl = (name: string, alpha = 1) => `hsla(${cssVar(name)}, ${alpha})`;

export const SimulationCanvas = ({
  params,
  state,
  trail,
  predicted,
  stats,
  showGrid,
  showVectors,
  showTrail,
  targetMode,
  targetX,
  onTargetDrag,
}: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const stateRef = useRef(state);
  const trailRef = useRef(trail);
  const predictedRef = useRef(predicted);
  const statsRef = useRef(stats);
  const paramsRef = useRef(params);
  const flagsRef = useRef({ showGrid, showVectors, showTrail, targetMode, targetX });
  stateRef.current = state;
  trailRef.current = trail;
  predictedRef.current = predicted;
  statsRef.current = stats;
  paramsRef.current = params;
  flagsRef.current = { showGrid, showVectors, showTrail, targetMode, targetX };

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ro = new ResizeObserver(() => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    let raf = 0;
    const render = () => {
      draw();
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const worldFromPointer = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const transform = computeTransform(rect.width, rect.height);
      const worldX = (px - transform.offsetX) / transform.scale;
      const worldY = (transform.groundY - py) / transform.scale;
      return { worldX, worldY };
    };

    const onDown = (e: PointerEvent) => {
      if (!flagsRef.current.targetMode) return;
      const { worldX } = worldFromPointer(e);
      draggingRef.current = true;
      onTargetDrag(Math.max(1, worldX));
      canvas.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!draggingRef.current) return;
      const { worldX } = worldFromPointer(e);
      onTargetDrag(Math.max(1, worldX));
    };
    const onUp = (e: PointerEvent) => {
      draggingRef.current = false;
      try { canvas.releasePointerCapture(e.pointerId); } catch {}
    };
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    return () => {
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
    };
  }, [onTargetDrag]);

  const computeTransform = (w: number, h: number) => {
    const stats = statsRef.current;
    const flags = flagsRef.current;
    const padX = 50;
    const padTop = 30;
    const groundFromBottom = 50;
    const groundY = h - groundFromBottom;
    const usableW = Math.max(50, w - padX * 2);
    const usableH = Math.max(50, groundY - padTop);

    const worldW = Math.max(
      10,
      stats.range * 1.1,
      flags.targetMode ? flags.targetX * 1.15 : 0,
      stateRef.current.x * 1.1,
    );
    const worldH = Math.max(5, stats.maxHeight * 1.2, paramsRef.current.height * 1.2);
    const scale = Math.min(usableW / worldW, usableH / worldH);
    const offsetX = padX;
    return { scale, offsetX, groundY };
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const W = rect.width;
    const H = rect.height;

    const { scale, offsetX, groundY } = computeTransform(W, H);
    const toX = (wx: number) => offsetX + wx * scale;
    const toY = (wy: number) => groundY - wy * scale;

    const flags = flagsRef.current;
    const params = paramsRef.current;
    const state = stateRef.current;
    const trail = trailRef.current;
    const predicted = predictedRef.current;
    const stats = statsRef.current;

    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, hsl("--sky"));
    sky.addColorStop(1, hsl("--background"));
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    if (flags.showGrid) {
      ctx.strokeStyle = hsl("--grid", 0.6);
      ctx.lineWidth = 1;
      ctx.font = "10px ui-sans-serif, system-ui";
      ctx.fillStyle = hsl("--muted-foreground");
      const targetPx = 70;
      const rawStep = targetPx / scale;
      const pow = Math.pow(10, Math.floor(Math.log10(rawStep)));
      const candidates = [1, 2, 5, 10].map((m) => m * pow);
      const stepM = candidates.find((c) => c * scale >= targetPx) ?? candidates[candidates.length - 1];

      const maxX = (W - offsetX) / scale;
      for (let x = 0; x <= maxX; x += stepM) {
        const px = toX(x);
        ctx.beginPath();
        ctx.moveTo(px, 0);
        ctx.lineTo(px, groundY);
        ctx.stroke();
        if (x > 0) ctx.fillText(`${x.toFixed(stepM < 1 ? 1 : 0)}m`, px + 2, groundY - 2);
      }
      const maxY = groundY / scale;
      for (let y = 0; y <= maxY; y += stepM) {
        const py = toY(y);
        if (py < 0) break;
        ctx.beginPath();
        ctx.moveTo(offsetX, py);
        ctx.lineTo(W, py);
        ctx.stroke();
        if (y > 0) ctx.fillText(`${y.toFixed(stepM < 1 ? 1 : 0)}m`, 4, py - 2);
      }
    }

    ctx.fillStyle = hsl("--ground");
    ctx.fillRect(0, groundY, W, H - groundY);
    ctx.strokeStyle = hsl("--ground", 0.9);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(W, groundY);
    ctx.stroke();

    if (predicted.length > 1) {
      ctx.strokeStyle = hsl("--trajectory", 0.35);
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(toX(predicted[0].x), toY(predicted[0].y));
      for (let i = 1; i < predicted.length; i++) {
        ctx.lineTo(toX(predicted[i].x), toY(predicted[i].y));
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (stats.maxHeight > 0.1) {
      const ax = toX(stats.apex.x);
      const ay = toY(stats.apex.y);
      ctx.fillStyle = hsl("--apex");
      ctx.beginPath();
      ctx.arc(ax, ay, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = hsl("--foreground", 0.7);
      ctx.font = "10px ui-sans-serif, system-ui";
      ctx.fillText(`apex ${stats.maxHeight.toFixed(1)}m`, ax + 6, ay - 6);
    }

    {
      const lx = toX(stats.landing.x);
      ctx.strokeStyle = hsl("--accent", 0.7);
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(lx, groundY - 12);
      ctx.lineTo(lx, groundY + 6);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (flags.targetMode) {
      const tx = toX(flags.targetX);
      const ty = groundY;
      const radii = [14, 10, 6, 3];
      const colors = [
        hsl("--target", 1),
        hsl("--background", 1),
        hsl("--target", 1),
        hsl("--background", 1),
      ];
      for (let i = 0; i < radii.length; i++) {
        ctx.fillStyle = colors[i];
        ctx.beginPath();
        ctx.arc(tx, ty - radii[i], radii[i], 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = hsl("--target");
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(tx, ty - 14, 14, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (flags.showTrail && trail.length > 1) {
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      for (let i = 1; i < trail.length; i++) {
        const a = trail[i - 1];
        const b = trail[i];
        const alpha = i / trail.length;
        ctx.strokeStyle = hsl("--trajectory", 0.2 + 0.8 * alpha);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(toX(a.x), toY(a.y));
        ctx.lineTo(toX(b.x), toY(b.y));
        ctx.stroke();
      }
    }

    {
      const px = toX(state.x);
      const py = toY(state.y);
      const r = Math.max(5, Math.min(12, 4 + Math.cbrt(params.mass) * 2));
      const glow = ctx.createRadialGradient(px, py, 0, px, py, r * 3);
      glow.addColorStop(0, hsl("--trajectory", 0.6));
      glow.addColorStop(1, hsl("--trajectory", 0));
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(px, py, r * 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = hsl("--trajectory");
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = hsl("--background");
      ctx.lineWidth = 1.5;
      ctx.stroke();

      if (flags.showVectors) {
        const vScale = 0.25 * scale;
        drawArrow(ctx, px, py, px + state.vx * vScale, py, hsl("--vector-x"));
        drawArrow(ctx, px, py, px, py - state.vy * vScale, hsl("--vector-y"));
        drawArrow(ctx, px, py, px + state.vx * vScale, py - state.vy * vScale, hsl("--vector-r"), 2.5);
      }
    }

    {
      const ox = toX(0);
      const oy = toY(params.height);
      ctx.fillStyle = hsl("--accent");
      ctx.beginPath();
      ctx.arc(ox, oy, 3, 0, Math.PI * 2);
      ctx.fill();
      if (params.height > 0.01) {
        ctx.strokeStyle = hsl("--accent", 0.5);
        ctx.setLineDash([2, 3]);
        ctx.beginPath();
        ctx.moveTo(ox, oy);
        ctx.lineTo(ox, groundY);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[320px] rounded-xl overflow-hidden border border-border/60 panel-gradient animate-fade-in"
    >
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
};

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  width = 2,
) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (len < 4) return;
  const ang = Math.atan2(dy, dx);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  const head = 8;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - head * Math.cos(ang - 0.4), y2 - head * Math.sin(ang - 0.4));
  ctx.lineTo(x2 - head * Math.cos(ang + 0.4), y2 - head * Math.sin(ang + 0.4));
  ctx.closePath();
  ctx.fill();
}
