import { describe, it, expect } from "vitest";
import { snapToGrid, constrainAngle, resolvePoint } from "./snap";

describe("snapToGrid", () => {
  it("rounds to the nearest grid intersection", () => {
    expect(snapToGrid({ x: 0.74, y: 0.76 }, 0.5)).toEqual({ x: 0.5, y: 1.0 });
    expect(snapToGrid({ x: 2.3, y: 4.9 }, 1)).toEqual({ x: 2, y: 5 });
  });

  it("is a no-op for non-positive grid sizes", () => {
    expect(snapToGrid({ x: 1.2, y: 3.4 }, 0)).toEqual({ x: 1.2, y: 3.4 });
  });
});

describe("constrainAngle", () => {
  it("locks a near-horizontal segment to horizontal", () => {
    const r = constrainAngle({ x: 0, y: 0 }, { x: 5, y: 0.3 });
    expect(r.x).toBeCloseTo(5);
    expect(r.y).toBeCloseTo(0);
  });

  it("locks a near-vertical segment to vertical", () => {
    const r = constrainAngle({ x: 2, y: 2 }, { x: 2.2, y: 7 });
    expect(r.x).toBeCloseTo(2);
    expect(r.y).toBeCloseTo(7);
  });

  it("keeps a true 45° diagonal", () => {
    const r = constrainAngle({ x: 0, y: 0 }, { x: 4, y: 4 });
    expect(r.x).toBeCloseTo(4);
    expect(r.y).toBeCloseTo(4);
  });

  it("projects the cursor onto the nearest ray", () => {
    const r = constrainAngle({ x: 0, y: 0 }, { x: 10, y: 1 });
    expect(r.x).toBeCloseTo(10);
    expect(r.y).toBeCloseTo(0);
  });
});

describe("resolvePoint", () => {
  it("uses angle lock when shift is held with an anchor", () => {
    const r = resolvePoint(
      { x: 5, y: 0.2 },
      { anchor: { x: 0, y: 0 }, shift: true, snap: true, gridSize: 1 },
    );
    expect(r.y).toBeCloseTo(0);
  });

  it("snaps to grid when shift is not held", () => {
    expect(
      resolvePoint({ x: 1.2, y: 0.9 }, { anchor: null, shift: false, snap: true, gridSize: 1 }),
    ).toEqual({ x: 1, y: 1 });
  });

  it("returns the raw point with neither shift nor snap", () => {
    expect(
      resolvePoint({ x: 1.2, y: 0.9 }, { anchor: null, shift: false, snap: false, gridSize: 1 }),
    ).toEqual({ x: 1.2, y: 0.9 });
  });
});
