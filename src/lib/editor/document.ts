import { nanoid } from "nanoid";
import type {
  EllipseElement,
  Element,
  Layer,
  LineElement,
  PatternDocument,
  Point,
  PolylineElement,
  RectElement,
  Unit,
} from "@/lib/types";
import {
  DEFAULT_FILL,
  DEFAULT_GRID_SIZE,
  DEFAULT_STROKE,
  DEFAULT_STROKE_WIDTH,
} from "@/lib/constants";
import { convertValue } from "./units";

export function newId(): string {
  return nanoid(10);
}

export function createLayer(name: string): Layer {
  return { id: newId(), name, visible: true, locked: false };
}

const CANVAS_DEFAULTS: Record<Unit, { w: number; h: number; px: number }> = {
  in: { w: 36, h: 36, px: 24 },
  cm: { w: 90, h: 90, px: 10 },
  mm: { w: 900, h: 900, px: 1 },
  m: { w: 0.9, h: 0.9, px: 1000 },
  ft: { w: 3, h: 3, px: 96 },
};

export function createEmptyDocument(units: Unit = "in"): PatternDocument {
  const layer = createLayer("Layer 1");
  const d = CANVAS_DEFAULTS[units];
  return {
    version: 1,
    units,
    canvas: {
      widthUnits: d.w,
      heightUnits: d.h,
      gridSizeUnits: DEFAULT_GRID_SIZE[units],
      pxPerUnit: d.px,
    },
    layers: [layer],
    elements: [],
    pieces: [],
    seams: [],
    materials: { fabrics: [], notions: [] },
  };
}

interface StyleInit {
  stroke?: string;
  strokeWidth?: number;
  fill?: string;
}

function base(layerId: string, style?: StyleInit) {
  return {
    id: newId(),
    layerId,
    pieceId: null as string | null,
    stroke: style?.stroke ?? DEFAULT_STROKE,
    strokeWidth: style?.strokeWidth ?? DEFAULT_STROKE_WIDTH,
    fill: style?.fill ?? DEFAULT_FILL,
  };
}

export function createLine(
  layerId: string,
  a: Point,
  b: Point,
  style?: StyleInit,
): LineElement {
  return { ...base(layerId, style), type: "line", points: [a, b] };
}

export function createRect(
  layerId: string,
  x: number,
  y: number,
  w: number,
  h: number,
  style?: StyleInit,
): RectElement {
  return { ...base(layerId, style), type: "rect", x, y, w, h };
}

export function createEllipse(
  layerId: string,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  style?: StyleInit,
): EllipseElement {
  return { ...base(layerId, style), type: "ellipse", cx, cy, rx, ry };
}

export function createPolyline(
  layerId: string,
  points: Point[],
  closed: boolean,
  style?: StyleInit,
): PolylineElement {
  return { ...base(layerId, style), type: "polyline", points, closed };
}

/** Scale every coordinate of an element by `f`. */
function scaleElement(el: Element, f: number): Element {
  switch (el.type) {
    case "line":
      return {
        ...el,
        points: [
          { x: el.points[0].x * f, y: el.points[0].y * f },
          { x: el.points[1].x * f, y: el.points[1].y * f },
        ],
      };
    case "polyline":
      return {
        ...el,
        points: el.points.map((p) => ({ x: p.x * f, y: p.y * f })),
      };
    case "rect":
      return { ...el, x: el.x * f, y: el.y * f, w: el.w * f, h: el.h * f };
    case "ellipse":
      return {
        ...el,
        cx: el.cx * f,
        cy: el.cy * f,
        rx: el.rx * f,
        ry: el.ry * f,
      };
  }
}

/**
 * Re-express the whole document in a new unit, preserving physical size. All
 * geometry is scaled; the grid resets to a sensible spacing for the new unit.
 */
export function convertDocumentUnits(
  doc: PatternDocument,
  to: Unit,
): PatternDocument {
  if (doc.units === to) return doc;
  const f = convertValue(1, doc.units, to);
  return {
    ...doc,
    units: to,
    canvas: {
      widthUnits: doc.canvas.widthUnits * f,
      heightUnits: doc.canvas.heightUnits * f,
      gridSizeUnits: DEFAULT_GRID_SIZE[to],
      pxPerUnit: doc.canvas.pxPerUnit / f,
    },
    elements: doc.elements.map((el) => scaleElement(el, f)),
    seams: doc.seams,
    pieces: doc.pieces.map((pc) => ({
      ...pc,
      seamAllowance: pc.seamAllowance * f,
    })),
    materials: {
      fabrics: doc.materials.fabrics.map((fab) => ({
        ...fab,
        widthUnits: fab.widthUnits * f,
      })),
      notions: doc.materials.notions.map((n) => ({
        ...n,
        x: n.x * f,
        y: n.y * f,
      })),
    },
  };
}
