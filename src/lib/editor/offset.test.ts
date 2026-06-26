import { describe, it, expect } from "vitest";
import {
  offsetClosedPolygon,
  offsetElement,
  signedArea,
  seamAllowanceByElement,
} from "./offset";
import { createRect, createEllipse, createPolyline, createLine } from "./document";

const L = "layer";

describe("offsetClosedPolygon", () => {
  it("pushes a square outward by the distance", () => {
    const sq = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
    ];
    const off = offsetClosedPolygon(sq, 2);
    const xs = off.map((p) => Math.round(p.x)).sort((a, b) => a - b);
    const ys = off.map((p) => Math.round(p.y)).sort((a, b) => a - b);
    expect(xs[0]).toBe(-2);
    expect(xs[3]).toBe(12);
    expect(ys[0]).toBe(-2);
    expect(ys[3]).toBe(12);
    expect(Math.abs(signedArea(off))).toBeGreaterThan(Math.abs(signedArea(sq)));
  });

  it("is a no-op for zero distance", () => {
    const sq = [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 4, y: 4 },
      { x: 0, y: 4 },
    ];
    expect(offsetClosedPolygon(sq, 0)).toEqual(sq);
  });
});

describe("offsetElement", () => {
  it("expands a rect on all sides", () => {
    expect(offsetElement(createRect(L, 2, 2, 6, 6), 1)).toEqual({
      kind: "rect",
      x: 1,
      y: 1,
      w: 8,
      h: 8,
    });
  });

  it("grows ellipse radii", () => {
    expect(offsetElement(createEllipse(L, 5, 5, 3, 2), 1)).toMatchObject({
      kind: "ellipse",
      rx: 4,
      ry: 3,
    });
  });

  it("offsets a closed polyline into a polygon", () => {
    const off = offsetElement(
      createPolyline(L, [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 },
      ], true),
      2,
    );
    expect(off?.kind).toBe("polygon");
  });

  it("returns null for open shapes and zero allowance", () => {
    expect(offsetElement(createLine(L, { x: 0, y: 0 }, { x: 1, y: 1 }), 1)).toBeNull();
    expect(offsetElement(createPolyline(L, [{ x: 0, y: 0 }, { x: 1, y: 0 }], false), 1)).toBeNull();
    expect(offsetElement(createRect(L, 0, 0, 4, 4), 0)).toBeNull();
  });
});

describe("seamAllowanceByElement", () => {
  it("maps element ids to their piece allowance when positive", () => {
    const map = seamAllowanceByElement(
      [
        { id: "p1", seamAllowance: 0.5 },
        { id: "p2", seamAllowance: 0 },
      ],
      [
        { id: "e1", pieceId: "p1" },
        { id: "e2", pieceId: "p2" },
        { id: "e3", pieceId: null },
      ],
    );
    expect(map.get("e1")).toBe(0.5);
    expect(map.has("e2")).toBe(false);
    expect(map.has("e3")).toBe(false);
  });
});
