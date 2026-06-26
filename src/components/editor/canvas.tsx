"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Maximize2, Minus, Plus } from "lucide-react";
import type { EdgeRef, Element, Point, Unit } from "@/lib/types";
import { useEditor } from "@/lib/editor/store";
import {
  distance,
  edgeSegment,
  elementBounds,
  elementEdges,
  elementLength,
  elementVertices,
  hitTestSelect,
  pointToSegment,
  translateElement,
  unionBounds,
  type Bounds,
} from "@/lib/editor/geometry";
import { constrainAngle, resolvePoint, snapToGrid } from "@/lib/editor/snap";
import {
  offsetElement,
  seamAllowanceByElement,
  type OffsetShape,
} from "@/lib/editor/offset";
import {
  createEllipse,
  createLine,
  createPolyline,
  createRect,
} from "@/lib/editor/document";
import { formatLength } from "@/lib/editor/units";
import { ElementShape } from "./element-shape";

const SELECT_TOL_PX = 6;
const CLOSE_TOL_PX = 10;
const MIN_DRAW_PX = 3;

type Interaction =
  | { kind: "draw"; start: Point; current: Point }
  | { kind: "move"; current: Point }
  | { kind: "marquee"; start: Point; current: Point }
  | { kind: "notion"; id: string }
  | null;

function boundsIntersect(a: Bounds, b: Bounds): boolean {
  return !(
    a.x + a.w < b.x ||
    b.x + b.w < a.x ||
    a.y + a.h < b.y ||
    b.y + b.h < a.y
  );
}

export function Canvas() {
  const containerRef = useRef<HTMLDivElement>(null);

  const doc = useEditor((s) => s.doc);
  const tool = useEditor((s) => s.tool);
  const selectedIds = useEditor((s) => s.selectedIds);
  const zoom = useEditor((s) => s.zoom);
  const pan = useEditor((s) => s.pan);
  const snapEnabled = useEditor((s) => s.snapEnabled);
  const gridVisible = useEditor((s) => s.gridVisible);
  const notions = useEditor((s) => s.doc.materials.notions);

  const scale = doc.canvas.pxPerUnit * zoom;
  const grid = doc.canvas.gridSizeUnits;

  const [interaction, setInteraction] = useState<Interaction>(null);
  const [pendingPoly, setPendingPoly] = useState<Point[] | null>(null);
  const [polyCursor, setPolyCursor] = useState<Point | null>(null);

  const moveOriginRef = useRef<{ start: Point; originals: Element[] } | null>(null);
  const movedRef = useRef(false);
  const panRef = useRef<{ cx: number; cy: number; startPan: Point } | null>(null);
  const notionDragRef = useRef<string | null>(null);
  const spaceRef = useRef(false);

  const [measure, setMeasure] = useState<{ start: Point; current: Point } | null>(null);
  const measuringRef = useRef(false);
  const [hoverMovable, setHoverMovable] = useState(false);
  const [pendingSeam, setPendingSeam] = useState<EdgeRef | null>(null);

  const screenToDoc = useCallback(
    (clientX: number, clientY: number): Point => {
      const rect = containerRef.current!.getBoundingClientRect();
      return {
        x: (clientX - rect.left - pan.x) / scale,
        y: (clientY - rect.top - pan.y) / scale,
      };
    },
    [pan, scale],
  );

  const docToScreen = useCallback(
    (p: Point) => ({ x: p.x * scale + pan.x, y: p.y * scale + pan.y }),
    [pan, scale],
  );

  const fitView = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    const st = useEditor.getState();
    const { widthUnits, heightUnits, pxPerUnit } = st.doc.canvas;
    const need = Math.min((width * 0.9) / widthUnits, (height * 0.9) / heightUnits);
    const z = Math.max(0.05, Math.min(40, need / pxPerUnit));
    const sc = pxPerUnit * z;
    st.setZoom(z);
    st.setPan({
      x: (width - widthUnits * sc) / 2,
      y: (height - heightUnits * sc) / 2,
    });
  }, []);

  const zoomBy = useCallback((factor: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const sx = rect.width / 2;
    const sy = rect.height / 2;
    const st = useEditor.getState();
    const oldScale = st.doc.canvas.pxPerUnit * st.zoom;
    const docX = (sx - st.pan.x) / oldScale;
    const docY = (sy - st.pan.y) / oldScale;
    const z = Math.max(0.05, Math.min(40, st.zoom * factor));
    const newScale = st.doc.canvas.pxPerUnit * z;
    st.setZoom(z);
    st.setPan({ x: sx - docX * newScale, y: sy - docY * newScale });
  }, []);

  // ----- fit to view on first mount -----
  useEffect(() => {
    fitView();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ----- wheel zoom (non-passive) -----
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const st = useEditor.getState();
      const rect = el.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const oldScale = st.doc.canvas.pxPerUnit * st.zoom;
      const docX = (sx - st.pan.x) / oldScale;
      const docY = (sy - st.pan.y) / oldScale;
      const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
      const z = Math.max(0.05, Math.min(40, st.zoom * factor));
      const newScale = st.doc.canvas.pxPerUnit * z;
      st.setZoom(z);
      st.setPan({ x: sx - docX * newScale, y: sy - docY * newScale });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // ----- keyboard: space-pan, polyline finish/cancel -----
  useEffect(() => {
    const isTyping = () => {
      const a = document.activeElement;
      return (
        a instanceof HTMLInputElement ||
        a instanceof HTMLTextAreaElement ||
        a instanceof HTMLSelectElement ||
        (a as HTMLElement | null)?.isContentEditable === true
      );
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (isTyping()) return;
      if (e.code === "Space") spaceRef.current = true;
      if (e.key === "Enter" && pendingPoly && pendingPoly.length >= 2) {
        finishPolyline(false);
      }
      if (e.key === "Escape") {
        if (pendingPoly) {
          setPendingPoly(null);
          setPolyCursor(null);
        } else if (pendingSeam) {
          setPendingSeam(null);
        } else {
          useEditor.getState().clearSelection();
        }
        setInteraction(null);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") spaceRef.current = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingPoly, pendingSeam]);

  const hitTopmost = useCallback(
    (p: Point): string | null => {
      const hidden = new Set(
        doc.layers.filter((l) => !l.visible).map((l) => l.id),
      );
      const locked = new Set(
        doc.layers.filter((l) => l.locked).map((l) => l.id),
      );
      const tol = SELECT_TOL_PX / scale;
      for (let i = doc.elements.length - 1; i >= 0; i--) {
        const el = doc.elements[i];
        if (hidden.has(el.layerId) || locked.has(el.layerId)) continue;
        if (hitTestSelect(el, p, tol)) return el.id;
      }
      return null;
    },
    [doc, scale],
  );

  const selectableElements = useCallback((): Element[] => {
    const blocked = new Set(
      doc.layers.filter((l) => !l.visible || l.locked).map((l) => l.id),
    );
    return doc.elements.filter((el) => !blocked.has(el.layerId));
  }, [doc]);

  const selectionBounds = useCallback((): Bounds | null => {
    const sel = doc.elements.filter((el) => selectedIds.includes(el.id));
    return sel.length ? unionBounds(sel.map(elementBounds)) : null;
  }, [doc, selectedIds]);

  /** Resolve a measure endpoint: snap to a nearby element vertex, else grid/45°. */
  const snapMeasurePoint = useCallback(
    (raw: Point, shift: boolean, anchor: Point | null): Point => {
      const thr = 10 / scale;
      let best: Point | null = null;
      let bestD = thr;
      for (const el of selectableElements()) {
        for (const v of elementVertices(el)) {
          const d = distance(raw, v);
          if (d <= bestD) {
            bestD = d;
            best = v;
          }
        }
      }
      if (best) return best;
      if (shift && anchor) return constrainAngle(anchor, raw);
      if (snapEnabled) return snapToGrid(raw, grid);
      return raw;
    },
    [selectableElements, scale, snapEnabled, grid],
  );

  /** Nearest straight edge (segment) to a point, across all elements. */
  const nearestEdge = useCallback(
    (p: Point, tol: number): EdgeRef | null => {
      let best: EdgeRef | null = null;
      let bestD = tol;
      for (const el of selectableElements()) {
        const edges = elementEdges(el);
        for (let i = 0; i < edges.length; i++) {
          const d = pointToSegment(p, edges[i].a, edges[i].b);
          if (d <= bestD) {
            bestD = d;
            best = { elementId: el.id, edgeIndex: i };
          }
        }
      }
      return best;
    },
    [selectableElements],
  );

  function finishPolyline(close: boolean) {
    const poly = pendingPoly;
    if (poly && poly.length >= 2) {
      const st = useEditor.getState();
      const layerId = st.activeLayerId || st.doc.layers[0]?.id;
      if (layerId) st.addElement(createPolyline(layerId, poly, close));
    }
    setPendingPoly(null);
    setPolyCursor(null);
  }

  function constrainDraft(start: Point, raw: Point, shift: boolean): Point {
    if (tool === "line") {
      return resolvePoint(raw, { anchor: start, shift, snap: snapEnabled, gridSize: grid });
    }
    // rect / ellipse
    if (shift) {
      const dx = raw.x - start.x;
      const dy = raw.y - start.y;
      const s = Math.max(Math.abs(dx), Math.abs(dy));
      return { x: start.x + (dx < 0 ? -s : s), y: start.y + (dy < 0 ? -s : s) };
    }
    if (snapEnabled) return snapToGrid(raw, grid);
    return raw;
  }

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.button !== 1) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    const docPt = screenToDoc(e.clientX, e.clientY);
    const shift = e.shiftKey;

    if (e.button === 1 || spaceRef.current || tool === "pan") {
      panRef.current = { cx: e.clientX, cy: e.clientY, startPan: pan };
      return;
    }

    if (tool === "measure") {
      const start = snapMeasurePoint(docPt, shift, null);
      measuringRef.current = true;
      setMeasure({ start, current: start });
      return;
    }

    if (tool === "seam") {
      const edge = nearestEdge(docPt, (SELECT_TOL_PX + 5) / scale);
      if (!edge) {
        setPendingSeam(null);
        return;
      }
      // first click picks an edge; second click on a different edge pairs them
      const stale =
        !!pendingSeam && !doc.elements.some((el) => el.id === pendingSeam.elementId);
      if (!pendingSeam || stale) {
        setPendingSeam(edge);
        return;
      }
      if (pendingSeam.elementId === edge.elementId && pendingSeam.edgeIndex === edge.edgeIndex) {
        setPendingSeam(null);
        return;
      }
      useEditor.getState().addSeam(pendingSeam, edge);
      setPendingSeam(null);
      return;
    }

    if (tool === "select") {
      // notion pins take priority — they're editing aids on top of the artwork
      const nr = 10 / scale;
      const notion = [...notions].reverse().find((n) => distance(docPt, n) <= nr);
      if (notion) {
        notionDragRef.current = notion.id;
        movedRef.current = false;
        setInteraction({ kind: "notion", id: notion.id });
        return;
      }
      const st = useEditor.getState();
      const hitId = hitTopmost(docPt);
      if (hitId) {
        if (shift) st.addToSelection(hitId);
        else if (!st.selectedIds.includes(hitId)) st.select([hitId]);
        const ids = useEditor.getState().selectedIds;
        moveOriginRef.current = {
          start: docPt,
          originals: doc.elements.filter((el) => ids.includes(el.id)),
        };
        movedRef.current = false;
        setInteraction({ kind: "move", current: docPt });
        return;
      }
      // empty space inside the current selection's box → move the whole selection
      const selB = selectionBounds();
      if (!shift && selB) {
        const pad = SELECT_TOL_PX / scale;
        const inside =
          docPt.x >= selB.x - pad &&
          docPt.x <= selB.x + selB.w + pad &&
          docPt.y >= selB.y - pad &&
          docPt.y <= selB.y + selB.h + pad;
        if (inside) {
          moveOriginRef.current = {
            start: docPt,
            originals: doc.elements.filter((el) => st.selectedIds.includes(el.id)),
          };
          movedRef.current = false;
          setInteraction({ kind: "move", current: docPt });
          return;
        }
      }
      if (!shift) st.clearSelection();
      setInteraction({ kind: "marquee", start: docPt, current: docPt });
      return;
    }

    if (tool === "line" || tool === "rect" || tool === "ellipse") {
      const start = snapEnabled && !shift ? snapToGrid(docPt, grid) : docPt;
      setInteraction({ kind: "draw", start, current: start });
      return;
    }

    if (tool === "polyline") {
      const last = pendingPoly?.length ? pendingPoly[pendingPoly.length - 1] : null;
      const pt = resolvePoint(docPt, { anchor: last, shift, snap: snapEnabled, gridSize: grid });
      if (!pendingPoly) {
        setPendingPoly([pt]);
      } else if (
        pendingPoly.length >= 2 &&
        distance(pt, pendingPoly[0]) <= CLOSE_TOL_PX / scale
      ) {
        finishPolyline(true);
      } else {
        setPendingPoly([...pendingPoly, pt]);
      }
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (panRef.current) {
      useEditor.getState().setPan({
        x: panRef.current.startPan.x + (e.clientX - panRef.current.cx),
        y: panRef.current.startPan.y + (e.clientY - panRef.current.cy),
      });
      return;
    }

    const docPt = screenToDoc(e.clientX, e.clientY);
    const shift = e.shiftKey;

    if (tool === "polyline" && pendingPoly?.length) {
      const last = pendingPoly[pendingPoly.length - 1];
      setPolyCursor(resolvePoint(docPt, { anchor: last, shift, snap: snapEnabled, gridSize: grid }));
      return;
    }

    if (tool === "measure" && measuringRef.current) {
      setMeasure((prev) =>
        prev ? { start: prev.start, current: snapMeasurePoint(docPt, shift, prev.start) } : prev,
      );
      return;
    }

    // hover affordance: show a move cursor over grabbable shapes
    if (tool === "select" && !interaction && e.buttons === 0) {
      const pad = SELECT_TOL_PX / scale;
      const b = selectionBounds();
      const overSelection =
        !!b &&
        docPt.x >= b.x - pad &&
        docPt.x <= b.x + b.w + pad &&
        docPt.y >= b.y - pad &&
        docPt.y <= b.y + b.h + pad;
      const over = overSelection || !!hitTopmost(docPt);
      if (over !== hoverMovable) setHoverMovable(over);
    }

    if (!interaction) return;

    if (interaction.kind === "draw") {
      setInteraction({ ...interaction, current: constrainDraft(interaction.start, docPt, shift) });
    } else if (interaction.kind === "move" && moveOriginRef.current) {
      const { start, originals } = moveOriginRef.current;
      let target = docPt;
      if (shift) {
        const dx = docPt.x - start.x;
        const dy = docPt.y - start.y;
        target = Math.abs(dx) > Math.abs(dy) ? { x: docPt.x, y: start.y } : { x: start.x, y: docPt.y };
      }
      let dx = target.x - start.x;
      let dy = target.y - start.y;
      if (snapEnabled) {
        const s0 = snapToGrid(start, grid);
        const s1 = snapToGrid(target, grid);
        dx = s1.x - s0.x;
        dy = s1.y - s0.y;
      }
      if (dx !== 0 || dy !== 0 || movedRef.current) {
        if (!movedRef.current) {
          movedRef.current = true;
          useEditor.getState().beginCommit();
        }
        const moved = new Map(originals.map((o) => [o.id, translateElement(o, dx, dy)]));
        useEditor.getState().live((d) => ({
          ...d,
          elements: d.elements.map((el) => moved.get(el.id) ?? el),
        }));
      }
      setInteraction({ kind: "move", current: docPt });
    } else if (interaction.kind === "marquee") {
      setInteraction({ ...interaction, current: docPt });
    } else if (interaction.kind === "notion" && notionDragRef.current) {
      const target = snapEnabled ? snapToGrid(docPt, grid) : docPt;
      if (!movedRef.current) {
        movedRef.current = true;
        useEditor.getState().beginCommit();
      }
      const id = notionDragRef.current;
      useEditor.getState().live((d) => ({
        ...d,
        materials: {
          ...d.materials,
          notions: d.materials.notions.map((n) =>
            n.id === id ? { ...n, x: target.x, y: target.y } : n,
          ),
        },
      }));
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    if (panRef.current) {
      panRef.current = null;
      return;
    }
    if (measuringRef.current) {
      measuringRef.current = false;
      return;
    }
    if (!interaction) return;

    if (interaction.kind === "draw") {
      commitDraw(interaction.start, interaction.current);
    } else if (interaction.kind === "marquee") {
      selectInMarquee(interaction.start, interaction.current, e.shiftKey);
    }
    moveOriginRef.current = null;
    notionDragRef.current = null;
    movedRef.current = false;
    setInteraction(null);
  };

  function commitDraw(start: Point, current: Point) {
    const st = useEditor.getState();
    const layerId = st.activeLayerId || st.doc.layers[0]?.id;
    if (!layerId) return;
    const min = MIN_DRAW_PX / scale;
    if (tool === "line") {
      if (distance(start, current) < min) return;
      st.addElement(createLine(layerId, start, current));
    } else if (tool === "rect") {
      const w = Math.abs(current.x - start.x);
      const h = Math.abs(current.y - start.y);
      if (w < min || h < min) return;
      st.addElement(createRect(layerId, Math.min(start.x, current.x), Math.min(start.y, current.y), w, h));
    } else if (tool === "ellipse") {
      const rx = Math.abs(current.x - start.x) / 2;
      const ry = Math.abs(current.y - start.y) / 2;
      if (rx < min || ry < min) return;
      st.addElement(createEllipse(layerId, (start.x + current.x) / 2, (start.y + current.y) / 2, rx, ry));
    }
  }

  function selectInMarquee(start: Point, current: Point, additive: boolean) {
    const box: Bounds = {
      x: Math.min(start.x, current.x),
      y: Math.min(start.y, current.y),
      w: Math.abs(current.x - start.x),
      h: Math.abs(current.y - start.y),
    };
    if (box.w < 1e-6 && box.h < 1e-6) return;
    const hidden = new Set(doc.layers.filter((l) => !l.visible).map((l) => l.id));
    const locked = new Set(doc.layers.filter((l) => l.locked).map((l) => l.id));
    const ids = doc.elements
      .filter(
        (el) =>
          !hidden.has(el.layerId) &&
          !locked.has(el.layerId) &&
          boundsIntersect(elementBounds(el), box),
      )
      .map((el) => el.id);
    const st = useEditor.getState();
    st.select(additive ? Array.from(new Set([...st.selectedIds, ...ids])) : ids);
  }

  // ----- render helpers -----
  const hiddenLayers = new Set(doc.layers.filter((l) => !l.visible).map((l) => l.id));
  const visibleElements = doc.elements.filter((el) => !hiddenLayers.has(el.layerId));
  const selected = new Set(selectedIds);
  const saMap = seamAllowanceByElement(doc.pieces, visibleElements);

  const gridLines = gridVisible && grid > 0 ? buildGrid(doc.canvas.widthUnits, doc.canvas.heightUnits, grid) : null;

  const cursorClass =
    tool === "pan"
      ? "cursor-grab"
      : tool === "select"
        ? hoverMovable
          ? "cursor-move"
          : "cursor-default"
        : "cursor-crosshair";

  const selectedEl =
    selectedIds.length === 1
      ? visibleElements.find((e) => e.id === selectedIds[0]) ?? null
      : null;

  // live measurement label during a draw
  const measurement = getMeasurement(interaction, tool, doc.units);
  const measureScreen =
    interaction?.kind === "draw" ? docToScreen(interaction.current) : null;

  return (
    <div
      ref={containerRef}
      className={`relative h-full w-full overflow-hidden bg-muted/40 ${cursorClass} touch-none select-none`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onDoubleClick={() => pendingPoly && finishPolyline(false)}
    >
      <svg className="absolute inset-0 h-full w-full">
        <g transform={`translate(${pan.x} ${pan.y}) scale(${scale})`}>
          {/* artboard / paper */}
          <rect
            x={0}
            y={0}
            width={doc.canvas.widthUnits}
            height={doc.canvas.heightUnits}
            fill="#ffffff"
            stroke="#cbd5e1"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
          {gridLines}
          {/* seam-allowance (cut) lines, dashed, outside the outline */}
          {visibleElements.map((el) => {
            const sa = saMap.get(el.id);
            if (!sa) return null;
            return <OffsetShapeView key={`sa-${el.id}`} shape={offsetElement(el, sa)} />;
          })}
          {/* elements */}
          {visibleElements.map((el) => (
            <ElementShape key={el.id} el={el} />
          ))}
          {/* selection highlight */}
          {visibleElements
            .filter((el) => selected.has(el.id))
            .map((el) => {
              const b = elementBounds(el);
              return (
                <g key={`sel-${el.id}`}>
                  <ElementShape el={el} stroke="#2563eb" strokeWidthOverride={el.strokeWidth + 1} />
                  <rect
                    x={b.x}
                    y={b.y}
                    width={b.w}
                    height={b.h}
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth={1}
                    strokeDasharray="4 3"
                    vectorEffect="non-scaling-stroke"
                  />
                </g>
              );
            })}
          {/* seams (matched edges + notches) */}
          {doc.seams.map((seam) => {
            const elA = doc.elements.find((e) => e.id === seam.a.elementId);
            const elB = doc.elements.find((e) => e.id === seam.b.elementId);
            const segs = [
              elA ? edgeSegment(elA, seam.a.edgeIndex) : null,
              elB ? edgeSegment(elB, seam.b.edgeIndex) : null,
            ];
            return (
              <g key={`seam-${seam.id}`}>
                {segs.map((seg, i) =>
                  seg ? (
                    <g key={i}>
                      <line
                        x1={seg.a.x}
                        y1={seg.a.y}
                        x2={seg.b.x}
                        y2={seg.b.y}
                        stroke={seam.color}
                        strokeWidth={3.5}
                        strokeLinecap="round"
                        opacity={0.85}
                        vectorEffect="non-scaling-stroke"
                      />
                      <NotchTicks a={seg.a} b={seg.b} scale={scale} color={seam.color} />
                    </g>
                  ) : null,
                )}
              </g>
            );
          })}
          {tool === "seam" && pendingSeam
            ? (() => {
                const el = doc.elements.find((e) => e.id === pendingSeam.elementId);
                const seg = el ? edgeSegment(el, pendingSeam.edgeIndex) : null;
                return seg ? (
                  <line
                    x1={seg.a.x}
                    y1={seg.a.y}
                    x2={seg.b.x}
                    y2={seg.b.y}
                    stroke="#0d9488"
                    strokeWidth={3.5}
                    strokeDasharray="5 3"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                  />
                ) : null;
              })()
            : null}
          {/* notion pins */}
          {notions.map((n) => (
            <g key={`notion-${n.id}`}>
              <circle cx={n.x} cy={n.y} r={7 / scale} fill="#ffffff" stroke="#dc2626" strokeWidth={2} vectorEffect="non-scaling-stroke" />
              <circle cx={n.x} cy={n.y} r={2.5 / scale} fill="#dc2626" />
            </g>
          ))}
          {/* draft preview */}
          {interaction?.kind === "draw" ? (
            <DraftPreview tool={tool} start={interaction.start} current={interaction.current} />
          ) : null}
          {/* pending polyline */}
          {pendingPoly?.length ? (
            <PolylinePreview points={pendingPoly} cursor={polyCursor} scale={scale} />
          ) : null}
          {/* marquee */}
          {interaction?.kind === "marquee" ? (
            <rect
              x={Math.min(interaction.start.x, interaction.current.x)}
              y={Math.min(interaction.start.y, interaction.current.y)}
              width={Math.abs(interaction.current.x - interaction.start.x)}
              height={Math.abs(interaction.current.y - interaction.start.y)}
              fill="#2563eb22"
              stroke="#2563eb"
              strokeWidth={1}
              strokeDasharray="4 3"
              vectorEffect="non-scaling-stroke"
            />
          ) : null}
          {/* measure overlay */}
          {tool === "measure" && measure ? (
            <g>
              <line
                x1={measure.start.x}
                y1={measure.start.y}
                x2={measure.current.x}
                y2={measure.current.y}
                stroke="#0d9488"
                strokeWidth={1.5}
                strokeDasharray="5 3"
                vectorEffect="non-scaling-stroke"
              />
              {[measure.start, measure.current].map((p, i) => (
                <circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r={3.5 / scale}
                  fill="#ffffff"
                  stroke="#0d9488"
                  strokeWidth={1.5}
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            </g>
          ) : null}
        </g>
      </svg>

      {measurement && measureScreen ? (
        <div
          className="pointer-events-none absolute z-10 rounded bg-foreground px-1.5 py-0.5 text-xs font-medium text-background shadow"
          style={{ left: measureScreen.x + 12, top: measureScreen.y + 12 }}
        >
          {measurement}
        </div>
      ) : null}

      {/* notion labels */}
      {notions.map((n) => {
        const s = docToScreen(n);
        return (
          <div
            key={`label-${n.id}`}
            className="pointer-events-none absolute z-10 -translate-y-1/2 whitespace-nowrap rounded bg-card/90 px-1.5 py-0.5 text-[11px] font-medium text-foreground shadow-sm"
            style={{ left: s.x + 10, top: s.y }}
          >
            {n.name}
            {n.qty > 1 ? <span className="text-muted-foreground"> ×{n.qty}</span> : null}
          </div>
        );
      })}

      {/* seam labels */}
      {doc.seams.flatMap((seam) =>
        [seam.a, seam.b].map((ref, i) => {
          const el = doc.elements.find((e) => e.id === ref.elementId);
          const seg = el ? edgeSegment(el, ref.edgeIndex) : null;
          if (!seg) return null;
          const s = docToScreen({ x: (seg.a.x + seg.b.x) / 2, y: (seg.a.y + seg.b.y) / 2 });
          return (
            <div
              key={`${seam.id}-${i}`}
              className="pointer-events-none absolute z-10 grid h-4 min-w-4 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full px-1 text-[10px] font-bold text-white shadow"
              style={{ left: s.x, top: s.y, background: seam.color }}
            >
              {seam.label}
            </div>
          );
        }),
      )}

      {/* measure readout */}
      {tool === "measure" && measure
        ? (() => {
            const mid = docToScreen({
              x: (measure.start.x + measure.current.x) / 2,
              y: (measure.start.y + measure.current.y) / 2,
            });
            return (
              <div
                className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded bg-teal-600 px-1.5 py-0.5 text-xs font-semibold text-white shadow"
                style={{ left: mid.x, top: mid.y - 14 }}
              >
                {formatLength(distance(measure.start, measure.current), doc.units)}
              </div>
            );
          })()
        : null}

      {/* dimensions of the selected shape */}
      {selectedEl
        ? dimensionLabelsFor(selectedEl, doc.units).map((d, i) => {
            const s = docToScreen(d.at);
            return (
              <div
                key={i}
                className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded bg-blue-600 px-1 py-0.5 text-[10px] font-semibold text-white shadow-sm"
                style={{ left: s.x, top: s.y }}
              >
                {d.text}
              </div>
            );
          })
        : null}

      {/* zoom controls */}
      <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1 rounded-lg border border-border bg-card/90 p-1 shadow-sm backdrop-blur">
        <button
          type="button"
          onClick={() => zoomBy(1 / 1.2)}
          className="grid size-7 place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Zoom out"
        >
          <Minus className="size-4" />
        </button>
        <button
          type="button"
          onClick={fitView}
          className="min-w-12 rounded px-1 text-center text-xs font-medium tabular-nums text-muted-foreground hover:text-foreground"
          aria-label="Fit to view"
          title="Fit to view"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          type="button"
          onClick={() => zoomBy(1.2)}
          className="grid size-7 place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Zoom in"
        >
          <Plus className="size-4" />
        </button>
        <button
          type="button"
          onClick={fitView}
          className="grid size-7 place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Fit"
        >
          <Maximize2 className="size-4" />
        </button>
      </div>
    </div>
  );
}

function buildGrid(w: number, h: number, grid: number) {
  // keep the number of lines reasonable when zoomed out / fine grids
  let step = grid;
  while (w / step > 160 || h / step > 160) step *= 2;
  const lines: React.ReactNode[] = [];
  for (let x = 0; x <= w + 1e-9; x += step) {
    lines.push(
      <line
        key={`v${x}`}
        x1={x}
        y1={0}
        x2={x}
        y2={h}
        stroke="#dbeafe"
        strokeWidth={1}
        vectorEffect="non-scaling-stroke"
      />,
    );
  }
  for (let y = 0; y <= h + 1e-9; y += step) {
    lines.push(
      <line
        key={`h${y}`}
        x1={0}
        y1={y}
        x2={w}
        y2={y}
        stroke="#dbeafe"
        strokeWidth={1}
        vectorEffect="non-scaling-stroke"
      />,
    );
  }
  return <g>{lines}</g>;
}

function DraftPreview({
  tool,
  start,
  current,
}: {
  tool: string;
  start: Point;
  current: Point;
}) {
  const common = {
    stroke: "#2563eb",
    strokeWidth: 1.5,
    fill: "none",
    vectorEffect: "non-scaling-stroke" as const,
    strokeDasharray: "5 3",
  };
  if (tool === "line") {
    return <line x1={start.x} y1={start.y} x2={current.x} y2={current.y} {...common} />;
  }
  if (tool === "rect") {
    return (
      <rect
        x={Math.min(start.x, current.x)}
        y={Math.min(start.y, current.y)}
        width={Math.abs(current.x - start.x)}
        height={Math.abs(current.y - start.y)}
        {...common}
      />
    );
  }
  if (tool === "ellipse") {
    return (
      <ellipse
        cx={(start.x + current.x) / 2}
        cy={(start.y + current.y) / 2}
        rx={Math.abs(current.x - start.x) / 2}
        ry={Math.abs(current.y - start.y) / 2}
        {...common}
      />
    );
  }
  return null;
}

function PolylinePreview({
  points,
  cursor,
  scale,
}: {
  points: Point[];
  cursor: Point | null;
  scale: number;
}) {
  const all = cursor ? [...points, cursor] : points;
  const d = all.map((p) => `${p.x},${p.y}`).join(" ");
  return (
    <g>
      <polyline
        points={d}
        fill="none"
        stroke="#2563eb"
        strokeWidth={1.5}
        strokeDasharray="5 3"
        vectorEffect="non-scaling-stroke"
      />
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={4 / scale}
          fill="#fff"
          stroke="#2563eb"
          strokeWidth={1.5}
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </g>
  );
}

/** Dashed seam-allowance (cut) outline. */
function OffsetShapeView({ shape }: { shape: OffsetShape }) {
  if (!shape) return null;
  const common = {
    fill: "none",
    stroke: "#64748b",
    strokeWidth: 1.25,
    strokeDasharray: "6 4",
    vectorEffect: "non-scaling-stroke" as const,
  };
  if (shape.kind === "rect") {
    return <rect x={shape.x} y={shape.y} width={shape.w} height={shape.h} {...common} />;
  }
  if (shape.kind === "ellipse") {
    return <ellipse cx={shape.cx} cy={shape.cy} rx={shape.rx} ry={shape.ry} {...common} />;
  }
  return <polygon points={shape.points.map((p) => `${p.x},${p.y}`).join(" ")} {...common} />;
}

/** Perpendicular notch ticks along a seam edge. */
function NotchTicks({
  a,
  b,
  scale,
  color,
}: {
  a: Point;
  b: Point;
  scale: number;
  color: string;
}) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const half = 6 / scale / 2;
  return (
    <>
      {[0.25, 0.5, 0.75].map((t, i) => {
        const px = a.x + dx * t;
        const py = a.y + dy * t;
        return (
          <line
            key={i}
            x1={px + nx * half}
            y1={py + ny * half}
            x2={px - nx * half}
            y2={py - ny * half}
            stroke={color}
            strokeWidth={2}
            vectorEffect="non-scaling-stroke"
          />
        );
      })}
    </>
  );
}

/** On-canvas dimension labels for a single selected element. */
function dimensionLabelsFor(el: Element, units: Unit): { text: string; at: Point }[] {
  switch (el.type) {
    case "line": {
      const [a, b] = el.points;
      return [
        {
          text: formatLength(distance(a, b), units),
          at: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
        },
      ];
    }
    case "rect": {
      const b = elementBounds(el);
      return [
        { text: formatLength(b.w, units), at: { x: b.x + b.w / 2, y: b.y } },
        { text: formatLength(b.h, units), at: { x: b.x, y: b.y + b.h / 2 } },
      ];
    }
    case "ellipse": {
      const b = elementBounds(el);
      return [
        { text: formatLength(b.w, units), at: { x: el.cx, y: el.cy - el.ry } },
        { text: formatLength(b.h, units), at: { x: el.cx - el.rx, y: el.cy } },
      ];
    }
    case "polyline": {
      const b = elementBounds(el);
      return [
        {
          text: formatLength(elementLength(el), units),
          at: { x: b.x + b.w / 2, y: b.y + b.h / 2 },
        },
      ];
    }
  }
}

function getMeasurement(
  interaction: Interaction,
  tool: string,
  units: Unit,
): string | null {
  if (interaction?.kind !== "draw") return null;
  const { start, current } = interaction;
  if (tool === "line") {
    return formatLength(distance(start, current), units);
  }
  if (tool === "rect" || tool === "ellipse") {
    const w = Math.abs(current.x - start.x);
    const h = Math.abs(current.y - start.y);
    return `${formatLength(w, units)} × ${formatLength(h, units)}`;
  }
  return null;
}
