import type { Point } from "@/lib/types";

/** Snap a point to the nearest grid intersection. */
export function snapToGrid(p: Point, gridSize: number): Point {
  if (gridSize <= 0) return p;
  return {
    x: Math.round(p.x / gridSize) * gridSize,
    y: Math.round(p.y / gridSize) * gridSize,
  };
}

/**
 * Constrain `end` to the nearest 45° ray from `start` (the "hold Shift"
 * behavior). The cursor is projected onto that ray, so the point stays under
 * the pointer along the locked direction.
 */
export function constrainAngle(start: Point, end: Point): Point {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  if (dx === 0 && dy === 0) return { ...end };

  const step = Math.PI / 4; // 45°
  const angle = Math.atan2(dy, dx);
  const snapped = Math.round(angle / step) * step;
  const cos = Math.cos(snapped);
  const sin = Math.sin(snapped);
  // Scalar projection of the cursor vector onto the locked ray.
  const proj = dx * cos + dy * sin;
  return { x: start.x + cos * proj, y: start.y + sin * proj };
}

/**
 * Resolve a freshly-pointed location given the editor modifiers. Shift locks to
 * 45° (relative to an anchor); otherwise grid snapping applies when enabled.
 */
export function resolvePoint(
  raw: Point,
  opts: {
    anchor?: Point | null;
    shift: boolean;
    snap: boolean;
    gridSize: number;
  },
): Point {
  if (opts.shift && opts.anchor) {
    return constrainAngle(opts.anchor, raw);
  }
  if (opts.snap) {
    return snapToGrid(raw, opts.gridSize);
  }
  return raw;
}
