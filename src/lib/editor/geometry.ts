import type { Element, Point } from "@/lib/types";

export interface Bounds {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function distance(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

export function boundsFromPoints(points: Point[]): Bounds {
  if (points.length === 0) return { x: 0, y: 0, w: 0, h: 0 };
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

/** Axis-aligned bounding box of a single element, in document units. */
export function elementBounds(el: Element): Bounds {
  switch (el.type) {
    case "line":
      return boundsFromPoints(el.points);
    case "polyline":
      return boundsFromPoints(el.points);
    case "rect": {
      // Normalize potential negative width/height.
      const x = Math.min(el.x, el.x + el.w);
      const y = Math.min(el.y, el.y + el.h);
      return { x, y, w: Math.abs(el.w), h: Math.abs(el.h) };
    }
    case "ellipse":
      return {
        x: el.cx - el.rx,
        y: el.cy - el.ry,
        w: el.rx * 2,
        h: el.ry * 2,
      };
  }
}

export function unionBounds(list: Bounds[]): Bounds | null {
  if (list.length === 0) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const b of list) {
    if (b.x < minX) minX = b.x;
    if (b.y < minY) minY = b.y;
    if (b.x + b.w > maxX) maxX = b.x + b.w;
    if (b.y + b.h > maxY) maxY = b.y + b.h;
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

export function elementsBounds(els: Element[]): Bounds | null {
  return unionBounds(els.map(elementBounds));
}

/** Shortest distance from a point to a line segment. */
export function pointToSegment(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return distance(p, a);
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return distance(p, { x: a.x + t * dx, y: a.y + t * dy });
}

function pointInPolygon(p: Point, pts: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = pts[i].x;
    const yi = pts[i].y;
    const xj = pts[j].x;
    const yj = pts[j].y;
    const intersect =
      yi > p.y !== yj > p.y &&
      p.x < ((xj - xi) * (p.y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/** True if the point is within `tol` (document units) of the element. */
export function hitTest(el: Element, p: Point, tol: number): boolean {
  switch (el.type) {
    case "line":
      return pointToSegment(p, el.points[0], el.points[1]) <= tol;
    case "polyline": {
      const pts = el.points;
      for (let i = 0; i < pts.length - 1; i++) {
        if (pointToSegment(p, pts[i], pts[i + 1]) <= tol) return true;
      }
      if (el.closed && pts.length > 2) {
        if (pointToSegment(p, pts[pts.length - 1], pts[0]) <= tol) return true;
        if (el.fill !== "none" && pointInPolygon(p, pts)) return true;
      }
      return false;
    }
    case "rect": {
      const b = elementBounds(el);
      const onEdge =
        p.x >= b.x - tol &&
        p.x <= b.x + b.w + tol &&
        p.y >= b.y - tol &&
        p.y <= b.y + b.h + tol &&
        (Math.abs(p.x - b.x) <= tol ||
          Math.abs(p.x - (b.x + b.w)) <= tol ||
          Math.abs(p.y - b.y) <= tol ||
          Math.abs(p.y - (b.y + b.h)) <= tol);
      if (onEdge) return true;
      if (el.fill !== "none") {
        return (
          p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h
        );
      }
      return false;
    }
    case "ellipse": {
      const rx = Math.max(el.rx, 1e-6);
      const ry = Math.max(el.ry, 1e-6);
      const norm =
        ((p.x - el.cx) / rx) ** 2 + ((p.y - el.cy) / ry) ** 2;
      if (el.fill !== "none") return norm <= 1 + tol / Math.min(rx, ry);
      // Near the ring: normalized radius close to 1.
      const ring = tol / Math.min(rx, ry);
      return Math.abs(Math.sqrt(norm) - 1) <= ring;
    }
  }
}

/**
 * Selection-oriented hit test: closed shapes (rect, ellipse, closed paths) are
 * grabbable anywhere inside, not just on their outline, so they're easy to pick
 * up and move. Open shapes (lines, open paths) still hit on the stroke only.
 */
export function hitTestSelect(el: Element, p: Point, tol: number): boolean {
  if (el.type === "line" || (el.type === "polyline" && !el.closed)) {
    return hitTest(el, p, tol);
  }
  // Treat closed shapes as filled so the interior counts as a hit.
  const filled = { ...el, fill: el.fill === "none" ? "#000000" : el.fill } as Element;
  return hitTest(filled, p, tol);
}

/** The snap-worthy vertices of an element (endpoints, corners, ellipse poles). */
export function elementVertices(el: Element): Point[] {
  switch (el.type) {
    case "line":
      return [el.points[0], el.points[1]];
    case "polyline":
      return el.points;
    case "rect": {
      const b = elementBounds(el);
      return [
        { x: b.x, y: b.y },
        { x: b.x + b.w, y: b.y },
        { x: b.x, y: b.y + b.h },
        { x: b.x + b.w, y: b.y + b.h },
        { x: b.x + b.w / 2, y: b.y + b.h / 2 },
      ];
    }
    case "ellipse":
      return [
        { x: el.cx, y: el.cy },
        { x: el.cx - el.rx, y: el.cy },
        { x: el.cx + el.rx, y: el.cy },
        { x: el.cx, y: el.cy - el.ry },
        { x: el.cx, y: el.cy + el.ry },
      ];
  }
}

export interface Segment {
  a: Point;
  b: Point;
}

/** Straight edges of an element, in segment-index order. Ellipses have none. */
export function elementEdges(el: Element): Segment[] {
  switch (el.type) {
    case "line":
      return [{ a: el.points[0], b: el.points[1] }];
    case "rect": {
      const b = elementBounds(el);
      const tl = { x: b.x, y: b.y };
      const tr = { x: b.x + b.w, y: b.y };
      const br = { x: b.x + b.w, y: b.y + b.h };
      const bl = { x: b.x, y: b.y + b.h };
      return [
        { a: tl, b: tr },
        { a: tr, b: br },
        { a: br, b: bl },
        { a: bl, b: tl },
      ];
    }
    case "polyline": {
      const segs: Segment[] = [];
      for (let i = 0; i < el.points.length - 1; i++) {
        segs.push({ a: el.points[i], b: el.points[i + 1] });
      }
      if (el.closed && el.points.length > 2) {
        segs.push({ a: el.points[el.points.length - 1], b: el.points[0] });
      }
      return segs;
    }
    case "ellipse":
      return [];
  }
}

/** Resolve one edge of an element by index, or null if out of range. */
export function edgeSegment(el: Element, edgeIndex: number): Segment | null {
  return elementEdges(el)[edgeIndex] ?? null;
}

/** Return a copy of the element translated by (dx, dy) document units. */
export function translateElement(el: Element, dx: number, dy: number): Element {
  switch (el.type) {
    case "line":
      return {
        ...el,
        points: [
          { x: el.points[0].x + dx, y: el.points[0].y + dy },
          { x: el.points[1].x + dx, y: el.points[1].y + dy },
        ],
      };
    case "polyline":
      return {
        ...el,
        points: el.points.map((pt) => ({ x: pt.x + dx, y: pt.y + dy })),
      };
    case "rect":
      return { ...el, x: el.x + dx, y: el.y + dy };
    case "ellipse":
      return { ...el, cx: el.cx + dx, cy: el.cy + dy };
  }
}

/** Total drawn length / perimeter of an element, in document units. */
export function elementLength(el: Element): number {
  switch (el.type) {
    case "line":
      return distance(el.points[0], el.points[1]);
    case "polyline": {
      let total = 0;
      for (let i = 0; i < el.points.length - 1; i++) {
        total += distance(el.points[i], el.points[i + 1]);
      }
      if (el.closed && el.points.length > 2) {
        total += distance(el.points[el.points.length - 1], el.points[0]);
      }
      return total;
    }
    case "rect":
      return 2 * (Math.abs(el.w) + Math.abs(el.h));
    case "ellipse": {
      // Ramanujan approximation of ellipse circumference.
      const a = el.rx;
      const b = el.ry;
      const h = ((a - b) ** 2) / ((a + b) ** 2 || 1);
      return Math.PI * (a + b) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h)));
    }
  }
}
