import { describe, it, expect } from "vitest";
import { estimateYardage } from "./yardage";
import { createEmptyDocument, createRect } from "@/lib/editor/document";

describe("estimateYardage", () => {
  it("estimates fabric length for a single assigned piece", () => {
    const d = createEmptyDocument("in");
    const layer = d.layers[0].id;
    d.materials.fabrics.push({ id: "f1", name: "Cotton", widthUnits: 54, color: "#fff" });
    const rect = createRect(layer, 0, 0, 10, 20);
    rect.pieceId = "p1";
    d.elements.push(rect);
    d.pieces.push({ id: "p1", name: "Front", fabricId: "f1", elementIds: [rect.id], seamAllowance: 0 });

    const est = estimateYardage(d);
    expect(est.fabrics).toHaveLength(1);
    // 20in long piece → 20in / 36 ≈ 0.556 yd
    expect(est.fabrics[0].lengthYards).toBeCloseTo(20 / 36, 2);
    expect(est.fabrics[0].pieceCount).toBe(1);
  });

  it("includes seam allowance in the estimate", () => {
    const d = createEmptyDocument("in");
    const layer = d.layers[0].id;
    d.materials.fabrics.push({ id: "f1", name: "Cotton", widthUnits: 54, color: "#fff" });
    const rect = createRect(layer, 0, 0, 10, 20);
    rect.pieceId = "p1";
    d.elements.push(rect);
    d.pieces.push({ id: "p1", name: "Front", fabricId: "f1", elementIds: [rect.id], seamAllowance: 1 });

    const est = estimateYardage(d);
    // height becomes 20 + 2*1 = 22in
    expect(est.fabrics[0].lengthYards).toBeCloseTo(22 / 36, 2);
  });

  it("flags pieces with shapes but no fabric", () => {
    const d = createEmptyDocument("in");
    const layer = d.layers[0].id;
    const rect = createRect(layer, 0, 0, 5, 5);
    rect.pieceId = "p1";
    d.elements.push(rect);
    d.pieces.push({ id: "p1", name: "Loose", fabricId: null, elementIds: [rect.id], seamAllowance: 0 });

    const est = estimateYardage(d);
    expect(est.fabrics).toHaveLength(0);
    expect(est.unassignedPieceNames).toContain("Loose");
  });
});
