import { describe, it, expect } from "vitest";
import { createEmptyDocument, convertDocumentUnits, createRect } from "./document";

describe("createEmptyDocument", () => {
  it("creates one layer in the chosen units", () => {
    const d = createEmptyDocument("cm");
    expect(d.units).toBe("cm");
    expect(d.layers).toHaveLength(1);
    expect(d.elements).toHaveLength(0);
    expect(d.canvas.gridSizeUnits).toBeGreaterThan(0);
  });
});

describe("convertDocumentUnits", () => {
  it("preserves physical size when changing units", () => {
    const d = createEmptyDocument("in");
    d.elements.push(createRect(d.layers[0].id, 0, 0, 2, 2)); // a 2in square
    const cm = convertDocumentUnits(d, "cm");

    expect(cm.units).toBe("cm");
    const rect = cm.elements[0];
    expect(rect.type === "rect" && rect.w).toBeCloseTo(5.08); // 2in = 5.08cm
    expect(cm.canvas.widthUnits).toBeCloseTo(d.canvas.widthUnits * 2.54);
    // pxPerUnit shrinks so the on-screen size stays the same
    expect(cm.canvas.pxPerUnit).toBeCloseTo(d.canvas.pxPerUnit / 2.54);
  });

  it("returns the same document for a no-op conversion", () => {
    const d = createEmptyDocument("in");
    expect(convertDocumentUnits(d, "in")).toBe(d);
  });

  it("scales seam allowances and fabric widths", () => {
    const d = createEmptyDocument("in");
    d.materials.fabrics.push({ id: "f", name: "Cotton", widthUnits: 54, color: "#fff" });
    d.pieces.push({ id: "p", name: "Front", fabricId: "f", elementIds: [], seamAllowance: 0.5 });
    const cm = convertDocumentUnits(d, "cm");
    expect(cm.pieces[0].seamAllowance).toBeCloseTo(1.27);
    expect(cm.materials.fabrics[0].widthUnits).toBeCloseTo(137.16);
  });
});
