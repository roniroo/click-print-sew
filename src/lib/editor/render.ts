import type { Element, PatternDocument, Point } from "@/lib/types";
import { elementBounds, elementsBounds, type Bounds } from "./geometry";

/** Allow only safe color syntax so generated SVG can't be an injection vector. */
function safeColor(input: string): string {
  return /^[#a-zA-Z0-9(),.\s%-]{0,40}$/.test(input) ? input : "none";
}

function pointsAttr(points: Point[]): string {
  return points.map((p) => `${round(p.x)},${round(p.y)}`).join(" ");
}

function round(n: number): number {
  return Math.round(n * 1000) / 1000;
}

export interface SvgStyleOptions {
  /** Override stroke width. */
  strokeWidth?: number;
  /** Keep stroke width constant regardless of scale (default true). */
  nonScaling?: boolean;
  /** Override fill (e.g. "none" for print). */
  fill?: string;
}

function styleAttrs(el: Element, o: SvgStyleOptions): string {
  const sw = o.strokeWidth ?? el.strokeWidth;
  const fill = o.fill ?? el.fill;
  const ve = o.nonScaling === false ? "" : `vector-effect="non-scaling-stroke" `;
  return (
    `stroke="${safeColor(el.stroke)}" stroke-width="${sw}" ` +
    `fill="${safeColor(fill)}" ${ve}` +
    `stroke-linejoin="round" stroke-linecap="round"`
  );
}

/** Render one element as an SVG fragment string (document-unit coordinates). */
export function elementToSvg(el: Element, o: SvgStyleOptions = {}): string {
  const s = styleAttrs(el, o);
  switch (el.type) {
    case "line": {
      const [a, b] = el.points;
      return `<line x1="${round(a.x)}" y1="${round(a.y)}" x2="${round(b.x)}" y2="${round(b.y)}" ${s}/>`;
    }
    case "polyline": {
      const pts = pointsAttr(el.points);
      return el.closed
        ? `<polygon points="${pts}" ${s}/>`
        : `<polyline points="${pts}" ${s}/>`;
    }
    case "rect": {
      const b = elementBounds(el);
      return `<rect x="${round(b.x)}" y="${round(b.y)}" width="${round(b.w)}" height="${round(b.h)}" ${s}/>`;
    }
    case "ellipse":
      return `<ellipse cx="${round(el.cx)}" cy="${round(el.cy)}" rx="${round(el.rx)}" ry="${round(el.ry)}" ${s}/>`;
  }
}

export interface DocumentSvgOptions {
  /** Extra space around the content, in document units. */
  padding?: number;
  /** Override stroke width (constant px due to non-scaling-stroke). */
  strokeWidth?: number;
  /** Background fill for the sheet. */
  background?: string;
}

/**
 * Serialize the whole pattern to a standalone SVG string, fit to its content
 * (or the canvas when empty). Used for library thumbnails and read-only views.
 */
export function documentToSvg(
  doc: PatternDocument,
  options: DocumentSvgOptions = {},
): string {
  const { padding, strokeWidth = 2, background = "#ffffff" } = options;

  const hiddenLayers = new Set(
    doc.layers.filter((l) => !l.visible).map((l) => l.id),
  );
  const visible = doc.elements.filter((el) => !hiddenLayers.has(el.layerId));

  const content: Bounds =
    elementsBounds(visible) ?? {
      x: 0,
      y: 0,
      w: doc.canvas.widthUnits,
      h: doc.canvas.heightUnits,
    };

  const pad = padding ?? Math.max(content.w, content.h, 1) * 0.04 + 0.25;
  const vb = {
    x: content.x - pad,
    y: content.y - pad,
    w: Math.max(content.w + pad * 2, 0.001),
    h: Math.max(content.h + pad * 2, 0.001),
  };

  const body = visible
    .map((el) => elementToSvg(el, { strokeWidth, nonScaling: true }))
    .join("");

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${round(vb.x)} ${round(vb.y)} ${round(vb.w)} ${round(vb.h)}" preserveAspectRatio="xMidYMid meet">` +
    `<rect x="${round(vb.x)}" y="${round(vb.y)}" width="${round(vb.w)}" height="${round(vb.h)}" fill="${safeColor(background)}"/>` +
    body +
    `</svg>`
  );
}
