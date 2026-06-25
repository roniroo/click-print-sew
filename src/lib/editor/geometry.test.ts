import { describe, it, expect } from "vitest";
import {
  distance,
  elementBounds,
  elementEdges,
  edgeSegment,
  unionBounds,
  pointToSegment,
  hitTest,
  translateElement,
  elementLength,
} from "./geometry";
import { createLine, createRect, createEllipse, createPolyline } from "./document";

const L = "layer";

describe("elementBounds", () => {
  it("normalizes negative rect dimensions", () => {
    expect(elementBounds(createRect(L, 2, 3, 4, 5))).toEqual({ x: 2, y: 3, w: 4, h: 5 });
    expect(elementBounds(createRect(L, 5, 5, -3, -2))).toEqual({ x: 2, y: 3, w: 3, h: 2 });
  });

  it("computes ellipse and line bounds", () => {
    expect(elementBounds(createEllipse(L, 10, 10, 4, 2))).toEqual({ x: 6, y: 8, w: 8, h: 4 });
    expect(elementBounds(createLine(L, { x: 1, y: 5 }, { x: 4, y: 2 }))).toEqual({ x: 1, y: 2, w: 3, h: 3 });
  });
});

describe("unionBounds", () => {
  it("merges bounding boxes", () => {
    expect(
      unionBounds([
        { x: 0, y: 0, w: 2, h: 2 },
        { x: 5, y: 1, w: 2, h: 2 },
      ]),
    ).toEqual({ x: 0, y: 0, w: 7, h: 3 });
  });
  it("returns null for an empty list", () => {
    expect(unionBounds([])).toBeNull();
  });
});

describe("pointToSegment", () => {
  it("measures perpendicular distance", () => {
    expect(pointToSegment({ x: 0, y: 2 }, { x: -5, y: 0 }, { x: 5, y: 0 })).toBeCloseTo(2);
  });
  it("clamps beyond the endpoints", () => {
    expect(pointToSegment({ x: 10, y: 0 }, { x: -5, y: 0 }, { x: 5, y: 0 })).toBeCloseTo(5);
  });
});

describe("hitTest", () => {
  it("hits near a line but not far from it", () => {
    const line = createLine(L, { x: 0, y: 0 }, { x: 10, y: 0 });
    expect(hitTest(line, { x: 5, y: 0.1 }, 0.2)).toBe(true);
    expect(hitTest(line, { x: 5, y: 1 }, 0.2)).toBe(false);
  });

  it("hits an unfilled rect on its edge but not its interior", () => {
    const r = createRect(L, 0, 0, 10, 10);
    expect(hitTest(r, { x: 0, y: 5 }, 0.2)).toBe(true);
    expect(hitTest(r, { x: 5, y: 5 }, 0.2)).toBe(false);
  });

  it("hits the interior of a filled rect", () => {
    const r = { ...createRect(L, 0, 0, 10, 10), fill: "#ffffff" };
    expect(hitTest(r, { x: 5, y: 5 }, 0.2)).toBe(true);
  });
});

describe("translateElement", () => {
  it("moves a rect", () => {
    expect(translateElement(createRect(L, 1, 1, 2, 2), 3, 4)).toMatchObject({ x: 4, y: 5 });
  });
  it("moves polyline points", () => {
    const p = translateElement(createPolyline(L, [{ x: 0, y: 0 }, { x: 1, y: 1 }], false), 1, 1);
    expect(p.type === "polyline" && p.points).toEqual([{ x: 1, y: 1 }, { x: 2, y: 2 }]);
  });
});

describe("elementLength", () => {
  it("measures a line", () => {
    expect(elementLength(createLine(L, { x: 0, y: 0 }, { x: 3, y: 4 }))).toBeCloseTo(5);
  });
  it("measures a rect perimeter", () => {
    expect(elementLength(createRect(L, 0, 0, 2, 3))).toBeCloseTo(10);
  });
  it("measures a closed polyline perimeter", () => {
    const sq = createPolyline(L, [
      { x: 0, y: 0 },
      { x: 2, y: 0 },
      { x: 2, y: 2 },
      { x: 0, y: 2 },
    ], true);
    expect(elementLength(sq)).toBeCloseTo(8);
  });
});

describe("distance", () => {
  it("computes euclidean distance", () => {
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });
});

describe("elementEdges / edgeSegment", () => {
  it("returns four ordered edges for a rect", () => {
    const edges = elementEdges(createRect(L, 0, 0, 10, 6));
    expect(edges).toHaveLength(4);
    expect(edges[0]).toEqual({ a: { x: 0, y: 0 }, b: { x: 10, y: 0 } }); // top
    expect(edges[3]).toEqual({ a: { x: 0, y: 6 }, b: { x: 0, y: 0 } }); // left
  });

  it("counts segments for lines, open/closed polylines, and ellipses", () => {
    expect(elementEdges(createLine(L, { x: 0, y: 0 }, { x: 3, y: 4 }))).toHaveLength(1);
    const pts = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }];
    expect(elementEdges(createPolyline(L, pts, false))).toHaveLength(2);
    expect(elementEdges(createPolyline(L, pts, true))).toHaveLength(3);
    expect(elementEdges(createEllipse(L, 0, 0, 2, 2))).toHaveLength(0);
  });

  it("resolves an edge by index, or null when out of range", () => {
    const r = createRect(L, 0, 0, 4, 4);
    expect(edgeSegment(r, 1)).toEqual({ a: { x: 4, y: 0 }, b: { x: 4, y: 4 } });
    expect(edgeSegment(r, 9)).toBeNull();
  });
});
