import type { Element, Point } from "@/lib/types";
import { elementBounds } from "./geometry";

export type OffsetShape =
  | { kind: "rect"; x: number; y: number; w: number; h: number }
  | { kind: "ellipse"; cx: number; cy: number; rx: number; ry: number }
  | { kind: "polygon"; points: Point[] }
  | null;

export function signedArea(pts: Point[]): number {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const q = pts[(i + 1) % pts.length];
    a += p.x * q.y - q.x * p.y;
  }
  return a / 2;
}

/** Intersection of two infinite lines (p1p2) and (p3p4), or null if parallel. */
function lineIntersect(
  p1: Point,
  p2: Point,
  p3: Point,
  p4: Point,
): Point | null {
  const d = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);
  if (Math.abs(d) < 1e-9) return null;
  const a = p1.x * p2.y - p1.y * p2.x;
  const b = p3.x * p4.y - p3.y * p4.x;
  return {
    x: (a * (p3.x - p4.x) - (p1.x - p2.x) * b) / d,
    y: (a * (p3.y - p4.y) - (p1.y - p2.y) * b) / d,
  };
}

/**
 * Outward miter offset of a closed polygon by `dist` document units. Each edge
 * is pushed out along its normal and consecutive edges are re-intersected. The
 * sign is chosen so the result enlarges the shape, regardless of winding.
 */
export function offsetClosedPolygon(pts: Point[], dist: number): Point[] {
  if (pts.length < 3 || dist === 0) return pts.slice();

  const build = (sign: number): Point[] => {
    const n = pts.length;
    const lines = pts.map((p, i) => {
      const q = pts[(i + 1) % n];
      let dx = q.x - p.x;
      let dy = q.y - p.y;
      const len = Math.hypot(dx, dy) || 1;
      dx /= len;
      dy /= len;
      const nx = sign * dy;
      const ny = sign * -dx;
      return {
        p: { x: p.x + nx * dist, y: p.y + ny * dist },
        q: { x: q.x + nx * dist, y: q.y + ny * dist },
      };
    });
    const res: Point[] = [];
    for (let i = 0; i < n; i++) {
      const prev = lines[(i - 1 + n) % n];
      const cur = lines[i];
      res.push(lineIntersect(prev.p, prev.q, cur.p, cur.q) ?? cur.p);
    }
    return res;
  };

  const positive = build(1);
  return Math.abs(signedArea(positive)) >= Math.abs(signedArea(pts))
    ? positive
    : build(-1);
}

/** The seam-allowance (cut) outline for an element, or null if it has no area. */
export function offsetElement(el: Element, dist: number): OffsetShape {
  if (dist <= 0) return null;
  switch (el.type) {
    case "rect": {
      const b = elementBounds(el);
      return { kind: "rect", x: b.x - dist, y: b.y - dist, w: b.w + dist * 2, h: b.h + dist * 2 };
    }
    case "ellipse":
      return { kind: "ellipse", cx: el.cx, cy: el.cy, rx: el.rx + dist, ry: el.ry + dist };
    case "polyline":
      return el.closed
        ? { kind: "polygon", points: offsetClosedPolygon(el.points, dist) }
        : null;
    case "line":
      return null;
  }
}

/** Map of elementId → seam allowance (document units), derived from pieces. */
export function seamAllowanceByElement(
  pieces: { id: string; seamAllowance: number }[],
  elements: { id: string; pieceId: string | null }[],
): Map<string, number> {
  const saByPiece = new Map(pieces.map((p) => [p.id, p.seamAllowance]));
  const map = new Map<string, number>();
  for (const el of elements) {
    const sa = el.pieceId ? saByPiece.get(el.pieceId) : undefined;
    if (sa && sa > 0) map.set(el.id, sa);
  }
  return map;
}
