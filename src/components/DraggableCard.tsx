import { Card } from "@/components/ui/card";
import { GripVertical } from "lucide-react";
import { useRef, useState, useCallback, useEffect, ReactNode } from "react";

interface Props {
  initial: { x: number; y: number };
  children: ReactNode;
  className?: string;
  storageKey?: string;
}

export const DraggableCard = ({ initial, children, className, storageKey }: Props) => {
  const [pos, setPos] = useState(() => {
    if (storageKey && typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return initial;
  });
  const dragRef = useRef<{ dx: number; dy: number; dragging: boolean }>({ dx: 0, dy: 0, dragging: false });
  const cardRef = useRef<HTMLDivElement>(null);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const parent = cardRef.current.parentElement?.getBoundingClientRect();
    if (!parent) return;
    dragRef.current = {
      dx: e.clientX - rect.left,
      dy: e.clientY - rect.top,
      dragging: true,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragRef.current.dragging || !cardRef.current) return;
      const parent = cardRef.current.parentElement?.getBoundingClientRect();
      if (!parent) return;
      const rect = cardRef.current.getBoundingClientRect();
      const nx = e.clientX - parent.left - dragRef.current.dx;
      const ny = e.clientY - parent.top - dragRef.current.dy;
      const maxX = parent.width - rect.width;
      const maxY = parent.height - rect.height;
      const next = {
        x: Math.max(0, Math.min(maxX, nx)),
        y: Math.max(0, Math.min(maxY, ny)),
      };
      setPos(next);
    },
    []
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      dragRef.current.dragging = false;
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
      if (storageKey) {
        try {
          localStorage.setItem(storageKey, JSON.stringify(pos));
        } catch {}
      }
    },
    [pos, storageKey]
  );

  // Re-clamp on window resize
  useEffect(() => {
    const onResize = () => {
      if (!cardRef.current) return;
      const parent = cardRef.current.parentElement?.getBoundingClientRect();
      const rect = cardRef.current.getBoundingClientRect();
      if (!parent) return;
      setPos((p: { x: number; y: number }) => ({
        x: Math.max(0, Math.min(parent.width - rect.width, p.x)),
        y: Math.max(0, Math.min(parent.height - rect.height, p.y)),
      }));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <Card
      ref={cardRef}
      className={`pointer-events-auto panel-gradient absolute select-none ${className ?? ""}`}
      style={{ left: pos.x, top: pos.y }}
    >
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="flex items-center gap-1 cursor-grab active:cursor-grabbing px-2 py-1 border-b border-border/50 text-muted-foreground hover:text-foreground transition-colors touch-none"
        title="Drag to move"
      >
        <GripVertical className="w-3 h-3" />
        <span className="text-[9px] uppercase tracking-wider">Drag</span>
      </div>
      <div className="p-3">{children}</div>
    </Card>
  );
};
