import { useEffect, useRef, useState } from "react";
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

// Build a valid CSS color from an HSL token like "222 50% 10%".
// Uses modern hsl(H S L / A) syntax which accepts space-separated values.
const hsl = (name: string, alpha = 1) => {
  const v = cssVar(name);
  if (!v) return `hsl(0 0% 0% / ${alpha})`;
  return `hsl(${v} / ${alpha})`;
};

interface HoverInfo {
  px: number;
  py: number;
  t: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

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
  const [hover, setHover] = useState<HoverInfo | null>(null);

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

  // Resize the canvas to its container with DPR scaling.
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    let raf = 0;
    const ro = new ResizeObserver(() => {
      // Avoid the "ResizeObserver loop" warning by deferring.
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(resize);
    });
    ro.observe(container);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  const hoverRef = useRef<HoverInfo | null>(null);
  hoverRef.current = hover;

  useEffect(() => {
    let raf = 0;
    const render = () => {
      drawRef.current?.();
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, []);

  const drawRef = useRef<() => void>();

  // Pointer interaction: dragging target, plus hovering trajectory for details.
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
      return { worldX, worldY, px, py };
    };

    const onDown = (e: PointerEvent) => {
      if (!flagsRef.current.targetMode) return;
      const { worldX } = worldFromPointer(e);
      draggingRef.current = true;
      onTargetDrag(Math.max(1, worldX));
      canvas.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      const { worldX, px, py } = worldFromPointer(e);
      if (draggingRef.current) {
        onTargetDrag(Math.max(1, worldX));
        return;
      }
      // Hover over predicted/trail path → find closest point and show tooltip.
      const path = predictedRef.current;
      if (!path.length) {
        setHover(null);
        return;
      }
      const transform = computeTransform(canvas.getBoundingClientRect().width, canvas.getBoundingClientRect().height);
      let bestI = -1;
      let bestD = Infinity;
      for (let i = 0; i < path.length; i++) {
        const dxp = transform.offsetX + path[i].x * transform.scale - px;
        const dyp = transform.groundY - path[i].y * transform.scale - py;
        const d = dxp * dxp + dyp * dyp;
        if (d < bestD) {
          bestD = d;
          bestI = i;
        }
      }
      if (bestI >= 0 && bestD < 32 * 32) {
        const p = path[bestI];
        const stats = statsRef.current;
        const t = (bestI / (path.length - 1)) * stats.flightTime;
        // Approximate velocity from neighbors.
        const a = path[Math.max(0, bestI - 1)];
        const b = path[Math.min(path.length - 1, bestI + 1)];
        const dt = (2 / (path.length - 1)) * stats.flightTime || 1;
        const vx = (b.x - a.x) / dt;
        const vy = (b.y - a.y) / dt;
        setHover({
          px: transform.offsetX + p.x * transform.scale,
          py: transform.groundY - p.y * transform.scale,
          t,
          x: p.x,
          y: p.y,
          vx,
          vy,
        });
      } else {
        setHover(null);
      }
    };
    const onUp = (e: PointerEvent) => {
      draggingRef.current = false;
      try { canvas.releasePointerCapture(e.pointerId); } catch {}
    };
    const onLeave = () => setHover(null);
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    canvas.addEventListener("pointerleave", onLeave);
    return () => {
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      canvas.removeEventListener("pointerleave", onLeave);
    };
  }, [onTargetDrag]);

  const computeTransform = (w: number, h: number) => {
    const stats = statsRef.current;
    const flags = flagsRef.current;
    const padX = 50;
    const padTop = 30;
    const groundFromBottom = 60;
    const groundY = h - groundFromBottom;
    const usableW = Math.max(50, w - padX * 2);
    const usableH = Math.max(50, groundY - padTop);

    const worldW = Math.max(
      10,
      stats.range * 1.15,
      flags.targetMode ? flags.targetX * 1.15 : 0,
      stateRef.current.x * 1.1,
    );
    const worldH = Math.max(5, stats.maxHeight * 1.25, paramsRef.current.height * 1.25);
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

    // Sky gradient.
    const sky = ctx.createLinearGradient(0, 0, 0, groundY);
    sky.addColorStop(0, hsl("--sky", 1));
    sky.addColorStop(1, hsl("--sky", 0.4));
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, groundY);

    // Sun / decorative element
    ctx.fillStyle = hsl("--apex", 0.35);
    ctx.beginPath();
    ctx.arc(W - 60, 60, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = hsl("--apex", 0.7);
    ctx.beginPath();
    ctx.arc(W - 60, 60, 18, 0, Math.PI * 2);
    ctx.fill();

    if (flags.showGrid) {
      ctx.strokeStyle = hsl("--grid", 0.55);
      ctx.lineWidth = 1;
      ctx.font = "10px ui-sans-serif, system-ui";
      ctx.fillStyle = hsl("--muted-foreground", 1);
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

    // Ground (grass) + dashed road line.
    const groundGrad = ctx.createLinearGradient(0, groundY, 0, H);
    groundGrad.addColorStop(0, hsl("--ground", 1));
    groundGrad.addColorStop(1, hsl("--ground", 0.7));
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, groundY, W, H - groundY);
    ctx.strokeStyle = hsl("--foreground", 0.4);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(W, groundY);
    ctx.stroke();
    // Dashed center line on ground
    ctx.strokeStyle = hsl("--apex", 0.7);
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(0, groundY + 14);
    ctx.lineTo(W, groundY + 14);
    ctx.stroke();
    ctx.setLineDash([]);

    // Predicted dashed parabola
    if (predicted.length > 1) {
      ctx.strokeStyle = hsl("--trajectory", 0.45);
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.moveTo(toX(predicted[0].x), toY(predicted[0].y));
      for (let i = 1; i < predicted.length; i++) {
        ctx.lineTo(toX(predicted[i].x), toY(predicted[i].y));
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Apex marker
    if (stats.maxHeight > 0.1) {
      const ax = toX(stats.apex.x);
      const ay = toY(stats.apex.y);
      ctx.fillStyle = hsl("--apex", 1);
      ctx.beginPath();
      ctx.arc(ax, ay, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = hsl("--foreground", 0.85);
      ctx.font = "10px ui-sans-serif, system-ui";
      ctx.fillText(`apex ${stats.maxHeight.toFixed(1)}m`, ax + 6, ay - 6);
    }

    // Landing tick
    {
      const lx = toX(stats.landing.x);
      ctx.strokeStyle = hsl("--accent", 0.85);
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(lx, groundY - 12);
      ctx.lineTo(lx, groundY + 6);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = hsl("--foreground", 0.8);
      ctx.font = "10px ui-sans-serif, system-ui";
      ctx.fillText(`${stats.range.toFixed(1)}m`, lx + 4, groundY - 14);
    }

    // Cannon at origin (PhET-style)
    drawCannon(ctx, toX(0), toY(0), toY(params.height), params.angleDeg, scale);

    // Target (bullseye)
    if (flags.targetMode) {
      const tx = toX(flags.targetX);
      const ty = groundY;
      const radii = [16, 12, 8, 4];
      const palette = [
        hsl("--target", 1),
        "hsl(0 0% 100% / 1)",
        hsl("--target", 1),
        "hsl(0 0% 100% / 1)",
      ];
      for (let i = 0; i < radii.length; i++) {
        ctx.fillStyle = palette[i];
        ctx.beginPath();
        ctx.ellipse(tx, ty - 2, radii[i], radii[i] * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = hsl("--target", 1);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(tx, ty - 2, 16, 8, 0, 0, Math.PI * 2);
      ctx.stroke();
      // distance label
      ctx.fillStyle = hsl("--foreground", 0.9);
      ctx.font = "11px ui-sans-serif, system-ui";
      ctx.fillText(`${flags.targetX.toFixed(1)} m`, tx - 18, ty + 26);
    }

    // Trail (solid, after launch)
    if (flags.showTrail && trail.length > 1) {
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      for (let i = 1; i < trail.length; i++) {
        const a = trail[i - 1];
        const b = trail[i];
        const alpha = i / trail.length;
        ctx.strokeStyle = hsl("--trajectory", 0.3 + 0.7 * alpha);
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(toX(a.x), toY(a.y));
        ctx.lineTo(toX(b.x), toY(b.y));
        ctx.stroke();
      }
    }

    // Projectile (cannonball)
    {
      const px = toX(state.x);
      const py = toY(state.y);
      const r = Math.max(6, Math.min(14, 5 + Math.cbrt(params.mass) * 2));
      // Glow
      const glow = ctx.createRadialGradient(px, py, 0, px, py, r * 3);
      glow.addColorStop(0, hsl("--trajectory", 0.55));
      glow.addColorStop(1, hsl("--trajectory", 0));
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(px, py, r * 3, 0, Math.PI * 2);
      ctx.fill();
      // Ball with shading
      const ballGrad = ctx.createRadialGradient(px - r * 0.35, py - r * 0.35, r * 0.2, px, py, r);
      ballGrad.addColorStop(0, "hsl(0 0% 95% / 1)");
      ballGrad.addColorStop(0.4, hsl("--trajectory", 1));
      ballGrad.addColorStop(1, "hsl(220 60% 12% / 1)");
      ctx.fillStyle = ballGrad;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "hsl(0 0% 0% / 0.35)";
      ctx.lineWidth = 1;
      ctx.stroke();

      if (flags.showVectors) {
        const vScale = 0.25 * scale;
        drawArrow(ctx, px, py, px + state.vx * vScale, py, hsl("--vector-x", 1), 2.5);
        drawArrow(ctx, px, py, px, py - state.vy * vScale, hsl("--vector-y", 1), 2.5);
        drawArrow(ctx, px, py, px + state.vx * vScale, py - state.vy * vScale, hsl("--vector-r", 1), 3);
      }
    }

    // Hover tooltip on predicted path
    const hover = hoverRef.current;
    if (hover) {
      ctx.fillStyle = hsl("--apex", 1);
      ctx.beginPath();
      ctx.arc(hover.px, hover.py, 5, 0, Math.PI * 2);
      ctx.fill();
      const lines = [
        `t = ${hover.t.toFixed(2)} s`,
        `x = ${hover.x.toFixed(2)} m`,
        `y = ${hover.y.toFixed(2)} m`,
        `vₓ = ${hover.vx.toFixed(2)} m/s`,
        `vᵧ = ${hover.vy.toFixed(2)} m/s`,
        `|v| = ${Math.hypot(hover.vx, hover.vy).toFixed(2)} m/s`,
      ];
      ctx.font = "11px ui-sans-serif, system-ui";
      const padBox = 6;
      const lineH = 14;
      const w = Math.max(...lines.map((l) => ctx.measureText(l).width)) + padBox * 2;
      const h = lines.length * lineH + padBox * 2;
      let bx = hover.px + 10;
      let by = hover.py - h - 10;
      if (bx + w > W) bx = hover.px - w - 10;
      if (by < 4) by = hover.py + 12;
      ctx.fillStyle = "hsl(0 0% 0% / 0.78)";
      roundRect(ctx, bx, by, w, h, 6);
      ctx.fill();
      ctx.strokeStyle = hsl("--apex", 0.9);
      ctx.lineWidth = 1;
      roundRect(ctx, bx, by, w, h, 6);
      ctx.stroke();
      ctx.fillStyle = "hsl(0 0% 100% / 1)";
      lines.forEach((l, i) => ctx.fillText(l, bx + padBox, by + padBox + lineH * (i + 1) - 3));
    }
  };

  drawRef.current = draw;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 rounded-xl overflow-hidden border border-border/60 panel-gradient animate-fade-in"
    >
      <canvas
        ref={canvasRef}
        className="block w-full h-full cursor-crosshair"
        style={{ touchAction: "none" }}
      />
    </div>
  );
};

function drawCannon(
  ctx: CanvasRenderingContext2D,
  baseX: number,
  baseY: number,
  muzzleY: number,
  angleDeg: number,
  scale: number,
) {
  // Wheels / base sit on ground (baseY). Barrel pivots at platform top (muzzleY if elevated).
  const pivotX = baseX;
  const pivotY = muzzleY;
  const barrelLen = 38;
  const barrelW = 14;
  const ang = -(angleDeg * Math.PI) / 180;

  // Platform leg if height > 0
  if (baseY - muzzleY > 6) {
    ctx.fillStyle = "hsl(220 15% 30% / 1)";
    ctx.fillRect(pivotX - 12, pivotY, 24, baseY - pivotY);
    ctx.strokeStyle = "hsl(220 20% 12% / 1)";
    ctx.lineWidth = 1;
    ctx.strokeRect(pivotX - 12, pivotY, 24, baseY - pivotY);
  }

  // Barrel
  ctx.save();
  ctx.translate(pivotX, pivotY);
  ctx.rotate(ang);
  const barrelGrad = ctx.createLinearGradient(0, -barrelW / 2, 0, barrelW / 2);
  barrelGrad.addColorStop(0, "hsl(0 70% 45% / 1)");
  barrelGrad.addColorStop(0.5, "hsl(0 80% 55% / 1)");
  barrelGrad.addColorStop(1, "hsl(0 70% 35% / 1)");
  ctx.fillStyle = barrelGrad;
  roundRect(ctx, 0, -barrelW / 2, barrelLen, barrelW, 3);
  ctx.fill();
  ctx.strokeStyle = "hsl(0 0% 10% / 0.6)";
  ctx.lineWidth = 1;
  roundRect(ctx, 0, -barrelW / 2, barrelLen, barrelW, 3);
  ctx.stroke();
  // Muzzle ring
  ctx.fillStyle = "hsl(0 0% 12% / 1)";
  ctx.beginPath();
  ctx.arc(barrelLen, 0, barrelW / 2 + 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Pivot / hub
  ctx.fillStyle = "hsl(45 80% 55% / 1)";
  ctx.beginPath();
  ctx.arc(pivotX, pivotY, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "hsl(0 0% 10% / 0.7)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Wheel on ground
  ctx.fillStyle = "hsl(220 15% 18% / 1)";
  ctx.beginPath();
  ctx.arc(baseX, baseY - 8, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "hsl(45 80% 55% / 1)";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Angle label
  ctx.fillStyle = "hsl(0 0% 100% / 0.95)";
  ctx.font = "bold 11px ui-sans-serif, system-ui";
  ctx.fillText(`${angleDeg.toFixed(0)}°`, baseX + 22, pivotY - 16);
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

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
  const head = 9;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - head * Math.cos(ang - 0.4), y2 - head * Math.sin(ang - 0.4));
  ctx.lineTo(x2 - head * Math.cos(ang + 0.4), y2 - head * Math.sin(ang + 0.4));
  ctx.closePath();
  ctx.fill();
}
