import { describe, it, expect } from "vitest";
import { computeTiling, pageOriginMm } from "./tiling";

const LETTER = { paperWmm: 215.9, paperHmm: 279.4 };

describe("computeTiling", () => {
  it("fits small content on a single page", () => {
    const plan = computeTiling({
      contentWUnits: 5,
      contentHUnits: 5,
      units: "in",
      ...LETTER,
      marginMm: 6,
      overlapMm: 12,
    });
    expect(plan.cols).toBe(1);
    expect(plan.rows).toBe(1);
    expect(plan.pageCount).toBe(1);
  });

  it("tiles large content across multiple pages", () => {
    const plan = computeTiling({
      contentWUnits: 30,
      contentHUnits: 5,
      units: "in",
      ...LETTER,
      marginMm: 6,
      overlapMm: 12,
    });
    expect(plan.cols).toBeGreaterThan(1);
    expect(plan.rows).toBe(1);
    expect(plan.pageCount).toBe(plan.cols * plan.rows);
  });

  it("reflects the unit in mmPerUnit", () => {
    const plan = computeTiling({
      contentWUnits: 1,
      contentHUnits: 1,
      units: "cm",
      paperWmm: 210,
      paperHmm: 297,
      marginMm: 5,
      overlapMm: 10,
    });
    expect(plan.mmPerUnit).toBe(10);
  });

  it("advances page origins by the step size", () => {
    const plan = computeTiling({
      contentWUnits: 30,
      contentHUnits: 30,
      units: "in",
      ...LETTER,
      marginMm: 6,
      overlapMm: 12,
    });
    expect(pageOriginMm(plan, 0, 0)).toEqual({ xMm: 0, yMm: 0 });
    expect(pageOriginMm(plan, 1, 0).xMm).toBeCloseTo(plan.stepXmm);
    expect(pageOriginMm(plan, 0, 2).yMm).toBeCloseTo(plan.stepYmm * 2);
  });

  it("keeps the step smaller than the printable width (overlap)", () => {
    const plan = computeTiling({
      contentWUnits: 40,
      contentHUnits: 40,
      units: "in",
      ...LETTER,
      marginMm: 6,
      overlapMm: 12,
    });
    expect(plan.stepXmm).toBeCloseTo(plan.printableWmm - 12);
    expect(plan.stepXmm).toBeLessThan(plan.printableWmm);
  });
});
