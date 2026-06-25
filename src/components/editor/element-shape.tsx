import type { Element } from "@/lib/types";
import { elementBounds } from "@/lib/editor/geometry";

interface ElementShapeProps {
  el: Element;
  /** Override stroke (e.g. for selection highlight). */
  stroke?: string;
  strokeWidthOverride?: number;
  opacity?: number;
}

/**
 * Presentational SVG for one pattern element, drawn in document-unit
 * coordinates. Strokes use non-scaling-stroke so line weight stays constant at
 * any zoom. Hit-testing is done geometrically in the canvas, so no pointer
 * handlers live here.
 */
export function ElementShape({
  el,
  stroke,
  strokeWidthOverride,
  opacity,
}: ElementShapeProps) {
  const common = {
    stroke: stroke ?? el.stroke,
    strokeWidth: strokeWidthOverride ?? el.strokeWidth,
    fill: el.fill,
    opacity,
    vectorEffect: "non-scaling-stroke" as const,
    strokeLinejoin: "round" as const,
    strokeLinecap: "round" as const,
  };

  switch (el.type) {
    case "line":
      return (
        <line
          x1={el.points[0].x}
          y1={el.points[0].y}
          x2={el.points[1].x}
          y2={el.points[1].y}
          {...common}
        />
      );
    case "polyline": {
      const pts = el.points.map((p) => `${p.x},${p.y}`).join(" ");
      return el.closed ? (
        <polygon points={pts} {...common} />
      ) : (
        <polyline points={pts} {...common} fill="none" />
      );
    }
    case "rect": {
      const b = elementBounds(el);
      return <rect x={b.x} y={b.y} width={b.w} height={b.h} {...common} />;
    }
    case "ellipse":
      return (
        <ellipse cx={el.cx} cy={el.cy} rx={el.rx} ry={el.ry} {...common} />
      );
  }
}
