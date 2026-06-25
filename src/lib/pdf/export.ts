import { jsPDF } from "jspdf";
import { svg2pdf } from "svg2pdf.js";
import type { PatternDocument } from "@/lib/types";
import { elementsBounds } from "@/lib/editor/geometry";
import { elementToSvg } from "@/lib/editor/render";
import {
  computeTiling,
  pageOriginMm,
  type TilingPlan,
} from "./tiling";

export interface PrintOptions {
  /** Oriented paper dimensions in mm (width × height). */
  paperWmm: number;
  paperHmm: number;
  marginMm: number;
  overlapMm: number;
  /** Printed line weight in mm. */
  lineWidthMm: number;
  includeTestSquare: boolean;
  title: string;
}

function sanitizeFilename(title: string): string {
  const base = title.replace(/[^\w\- ]+/g, "").trim().replace(/\s+/g, "-");
  return base || "pattern";
}

function buildPageSvg(
  doc: PatternDocument,
  vb: { x: number; y: number; w: number; h: number },
  strokeUnits: number,
): string {
  const hidden = new Set(doc.layers.filter((l) => !l.visible).map((l) => l.id));
  const body = doc.elements
    .filter((el) => !hidden.has(el.layerId))
    .map((el) =>
      elementToSvg(el, { strokeWidth: strokeUnits, nonScaling: false, fill: "none" }),
    )
    .join("");
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${vb.w}" height="${vb.h}" ` +
    `viewBox="${vb.x} ${vb.y} ${vb.w} ${vb.h}" preserveAspectRatio="none">${body}</svg>`
  );
}

function drawPageChrome(
  pdf: jsPDF,
  plan: TilingPlan,
  col: number,
  row: number,
  opts: PrintOptions,
) {
  const m = opts.marginMm;
  const pw = plan.printableWmm;
  const ph = plan.printableHmm;
  const pageNum = row * plan.cols + col + 1;

  pdf.setDrawColor(150);
  pdf.setLineWidth(0.2);
  // trim / alignment border
  pdf.rect(m, m, pw, ph);

  // corner registration crosshairs
  const t = 4;
  const corners: [number, number][] = [
    [m, m],
    [m + pw, m],
    [m, m + ph],
    [m + pw, m + ph],
  ];
  for (const [x, y] of corners) {
    pdf.line(x - t, y, x + t, y);
    pdf.line(x, y - t, x, y + t);
  }

  // overlap guides (where the next tile begins)
  pdf.setDrawColor(190);
  pdf.setLineDashPattern([2, 1.5], 0);
  if (col < plan.cols - 1) {
    const x = m + (pw - plan.overlapMm);
    pdf.line(x, m, x, m + ph);
  }
  if (row < plan.rows - 1) {
    const y = m + (ph - plan.overlapMm);
    pdf.line(m, y, m + pw, y);
  }
  pdf.setLineDashPattern([], 0);

  // page label
  pdf.setFontSize(8);
  pdf.setTextColor(120);
  pdf.text(
    `${pageNum}/${plan.pageCount}  ·  row ${row + 1}, col ${col + 1}`,
    m + 2,
    m + 4,
  );
}

function drawTestSquare(pdf: jsPDF, plan: TilingPlan, units: string, opts: PrintOptions) {
  const imperial = units === "in" || units === "ft";
  const sideMm = imperial ? 25.4 : 50;
  const label = imperial ? "1 in" : "5 cm";
  const x = opts.marginMm + 8;
  const y = opts.marginMm + 8;

  pdf.setDrawColor(30);
  pdf.setLineWidth(0.3);
  pdf.rect(x, y, sideMm, sideMm);
  pdf.setFontSize(8);
  pdf.setTextColor(30);
  pdf.text(`Scale check: ${label}`, x, y - 1.5);
  pdf.text("Measure at 100% / no scaling", x, y + sideMm + 4);
}

/**
 * Build and download a tiled, 1:1-scale PDF of the pattern. Runs in the browser
 * (uses the DOM + svg2pdf). Returns the tiling plan that was used.
 */
export async function exportPatternPdf(
  doc: PatternDocument,
  opts: PrintOptions,
): Promise<TilingPlan> {
  const hidden = new Set(doc.layers.filter((l) => !l.visible).map((l) => l.id));
  const visible = doc.elements.filter((el) => !hidden.has(el.layerId));
  const bounds =
    elementsBounds(visible) ?? {
      x: 0,
      y: 0,
      w: doc.canvas.widthUnits,
      h: doc.canvas.heightUnits,
    };

  // small padding so edge strokes aren't clipped
  const padUnits = Math.max(bounds.w, bounds.h, 1) * 0.01;
  const content = {
    x: bounds.x - padUnits,
    y: bounds.y - padUnits,
    w: bounds.w + padUnits * 2,
    h: bounds.h + padUnits * 2,
  };

  const plan = computeTiling({
    contentWUnits: content.w,
    contentHUnits: content.h,
    units: doc.units,
    paperWmm: opts.paperWmm,
    paperHmm: opts.paperHmm,
    marginMm: opts.marginMm,
    overlapMm: opts.overlapMm,
  });

  const strokeUnits = opts.lineWidthMm / plan.mmPerUnit;
  const orientation = opts.paperWmm >= opts.paperHmm ? "landscape" : "portrait";
  const pdf = new jsPDF({
    unit: "mm",
    format: [opts.paperWmm, opts.paperHmm],
    orientation,
  });

  const host = document.createElement("div");
  host.setAttribute(
    "style",
    "position:fixed;left:-99999px;top:0;width:0;height:0;overflow:hidden;",
  );
  document.body.appendChild(host);

  try {
    let first = true;
    for (let r = 0; r < plan.rows; r++) {
      for (let c = 0; c < plan.cols; c++) {
        if (!first) {
          pdf.addPage([opts.paperWmm, opts.paperHmm], orientation);
        }
        first = false;

        const { xMm, yMm } = pageOriginMm(plan, c, r);
        const vb = {
          x: content.x + xMm / plan.mmPerUnit,
          y: content.y + yMm / plan.mmPerUnit,
          w: plan.printableWmm / plan.mmPerUnit,
          h: plan.printableHmm / plan.mmPerUnit,
        };

        const svgEl = new DOMParser().parseFromString(
          buildPageSvg(doc, vb, strokeUnits),
          "image/svg+xml",
        ).documentElement as unknown as SVGElement;
        host.appendChild(svgEl);
        await svg2pdf(svgEl, pdf, {
          x: opts.marginMm,
          y: opts.marginMm,
          width: plan.printableWmm,
          height: plan.printableHmm,
        });
        host.removeChild(svgEl);

        drawPageChrome(pdf, plan, c, r, opts);
        if (c === 0 && r === 0 && opts.includeTestSquare) {
          drawTestSquare(pdf, plan, doc.units, opts);
        }
      }
    }

    pdf.save(`${sanitizeFilename(opts.title)}.pdf`);
  } finally {
    document.body.removeChild(host);
  }

  return plan;
}
