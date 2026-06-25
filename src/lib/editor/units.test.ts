import { describe, it, expect } from "vitest";
import { toMm, fromMm, convertValue, formatLength, roundForDisplay } from "./units";

describe("units", () => {
  it("converts to millimeters", () => {
    expect(toMm(1, "in")).toBeCloseTo(25.4);
    expect(toMm(1, "cm")).toBe(10);
    expect(toMm(1, "ft")).toBeCloseTo(304.8);
    expect(toMm(2, "m")).toBe(2000);
    expect(toMm(3, "mm")).toBe(3);
  });

  it("round-trips through millimeters", () => {
    expect(fromMm(toMm(5, "in"), "in")).toBeCloseTo(5);
    expect(fromMm(toMm(7.5, "cm"), "cm")).toBeCloseTo(7.5);
  });

  it("converts between units preserving physical size", () => {
    expect(convertValue(1, "in", "cm")).toBeCloseTo(2.54);
    expect(convertValue(12, "in", "ft")).toBeCloseTo(1);
    expect(convertValue(100, "cm", "m")).toBeCloseTo(1);
    expect(convertValue(5, "in", "in")).toBe(5);
  });

  it("formats and rounds", () => {
    expect(formatLength(2.5, "in")).toBe("2.5 in");
    expect(roundForDisplay(1.23456, 2)).toBe(1.23);
    expect(roundForDisplay(1.005, 2)).toBeCloseTo(1.0, 1);
  });
});
