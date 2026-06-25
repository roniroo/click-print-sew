import { create } from "zustand";
import type {
  Element,
  Fabric,
  Notion,
  PatternDocument,
  Piece,
  Point,
  Unit,
} from "@/lib/types";
import { PIECE_COLORS } from "@/lib/constants";
import {
  convertDocumentUnits,
  createLayer,
  newId,
} from "./document";

export type Tool =
  | "select"
  | "pan"
  | "line"
  | "rect"
  | "ellipse"
  | "polyline"
  | "measure";
export type SaveStatus = "saved" | "saving" | "unsaved" | "error";

const HISTORY_LIMIT = 60;

interface InitPayload {
  patternId: string;
  title: string;
  isPublic: boolean;
  doc: PatternDocument;
}

interface EditorState {
  patternId: string;
  title: string;
  isPublic: boolean;
  doc: PatternDocument;

  tool: Tool;
  selectedIds: string[];
  activeLayerId: string;
  zoom: number;
  pan: Point;
  snapEnabled: boolean;
  gridVisible: boolean;

  saveStatus: SaveStatus;
  past: PatternDocument[];
  future: PatternDocument[];

  // lifecycle
  init: (p: InitPayload) => void;

  // history primitives
  commit: (updater: (d: PatternDocument) => PatternDocument) => void;
  beginCommit: () => void;
  live: (updater: (d: PatternDocument) => PatternDocument) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // view + tool ui
  setTool: (t: Tool) => void;
  toggleSnap: () => void;
  setGridVisible: (v: boolean) => void;
  setZoom: (z: number) => void;
  setPan: (p: Point) => void;

  // selection
  select: (ids: string[]) => void;
  addToSelection: (id: string) => void;
  clearSelection: () => void;

  // elements
  addElement: (el: Element) => void;
  updateElement: (id: string, patch: Partial<Element>) => void;
  deleteSelected: () => void;

  // layers
  setActiveLayer: (id: string) => void;
  addLayer: () => void;
  renameLayer: (id: string, name: string) => void;
  toggleLayerVisible: (id: string) => void;
  toggleLayerLock: (id: string) => void;
  deleteLayer: (id: string) => void;
  moveLayer: (id: string, dir: -1 | 1) => void;

  // pieces
  addPiece: () => void;
  renamePiece: (id: string, name: string) => void;
  deletePiece: (id: string) => void;
  assignSelectionToPiece: (pieceId: string | null) => void;
  setPieceFabric: (pieceId: string, fabricId: string | null) => void;
  setPieceSeamAllowance: (pieceId: string, value: number) => void;

  // materials
  addFabric: () => void;
  updateFabric: (id: string, patch: Partial<Fabric>) => void;
  removeFabric: (id: string) => void;
  addNotion: (at?: Point) => void;
  updateNotion: (id: string, patch: Partial<Notion>) => void;
  removeNotion: (id: string) => void;

  // document settings
  setUnits: (u: Unit) => void;
  setGridSize: (v: number) => void;
  setCanvasSize: (w: number, h: number) => void;

  // meta
  setTitle: (t: string) => void;
  setIsPublic: (v: boolean) => void;
  setSaveStatus: (s: SaveStatus) => void;
}

export const useEditor = create<EditorState>((set, get) => ({
  patternId: "",
  title: "Untitled Pattern",
  isPublic: false,
  doc: {
    version: 1,
    units: "in",
    canvas: { widthUnits: 36, heightUnits: 36, gridSizeUnits: 0.5, pxPerUnit: 24 },
    layers: [],
    elements: [],
    pieces: [],
    materials: { fabrics: [], notions: [] },
  },
  tool: "select",
  selectedIds: [],
  activeLayerId: "",
  zoom: 1,
  pan: { x: 0, y: 0 },
  snapEnabled: true,
  gridVisible: true,
  saveStatus: "saved",
  past: [],
  future: [],

  init: ({ patternId, title, isPublic, doc }) =>
    set({
      patternId,
      title,
      isPublic,
      doc,
      activeLayerId: doc.layers[0]?.id ?? "",
      tool: "select",
      selectedIds: [],
      zoom: 1,
      pan: { x: 0, y: 0 },
      saveStatus: "saved",
      past: [],
      future: [],
    }),

  commit: (updater) =>
    set((s) => ({
      past: [...s.past.slice(-HISTORY_LIMIT), s.doc],
      future: [],
      doc: updater(s.doc),
      saveStatus: "unsaved",
    })),

  beginCommit: () =>
    set((s) => ({ past: [...s.past.slice(-HISTORY_LIMIT), s.doc], future: [] })),

  live: (updater) =>
    set((s) => ({ doc: updater(s.doc), saveStatus: "unsaved" })),

  undo: () =>
    set((s) => {
      if (s.past.length === 0) return s;
      const prev = s.past[s.past.length - 1];
      return {
        doc: prev,
        past: s.past.slice(0, -1),
        future: [s.doc, ...s.future],
        saveStatus: "unsaved",
        selectedIds: [],
      };
    }),

  redo: () =>
    set((s) => {
      if (s.future.length === 0) return s;
      const next = s.future[0];
      return {
        doc: next,
        future: s.future.slice(1),
        past: [...s.past, s.doc],
        saveStatus: "unsaved",
        selectedIds: [],
      };
    }),

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,

  setTool: (tool) => set({ tool, selectedIds: tool === "select" ? get().selectedIds : [] }),
  toggleSnap: () => set((s) => ({ snapEnabled: !s.snapEnabled })),
  setGridVisible: (gridVisible) => set({ gridVisible }),
  setZoom: (zoom) => set({ zoom: Math.max(0.05, Math.min(40, zoom)) }),
  setPan: (pan) => set({ pan }),

  select: (selectedIds) => set({ selectedIds }),
  addToSelection: (id) =>
    set((s) => ({
      selectedIds: s.selectedIds.includes(id)
        ? s.selectedIds.filter((x) => x !== id)
        : [...s.selectedIds, id],
    })),
  clearSelection: () => set({ selectedIds: [] }),

  addElement: (el) => {
    get().commit((d) => ({ ...d, elements: [...d.elements, el] }));
    set({ selectedIds: [el.id] });
  },

  updateElement: (id, patch) =>
    get().commit((d) => ({
      ...d,
      elements: d.elements.map((e) =>
        e.id === id ? ({ ...e, ...patch } as Element) : e,
      ),
    })),

  deleteSelected: () => {
    const ids = get().selectedIds;
    if (ids.length === 0) return;
    get().commit((d) => ({
      ...d,
      elements: d.elements.filter((e) => !ids.includes(e.id)),
      pieces: d.pieces.map((pc) => ({
        ...pc,
        elementIds: pc.elementIds.filter((eid) => !ids.includes(eid)),
      })),
    }));
    set({ selectedIds: [] });
  },

  setActiveLayer: (activeLayerId) => set({ activeLayerId }),

  addLayer: () => {
    const layer = createLayer(`Layer ${get().doc.layers.length + 1}`);
    get().commit((d) => ({ ...d, layers: [...d.layers, layer] }));
    set({ activeLayerId: layer.id });
  },

  renameLayer: (id, name) =>
    get().commit((d) => ({
      ...d,
      layers: d.layers.map((l) => (l.id === id ? { ...l, name } : l)),
    })),

  toggleLayerVisible: (id) =>
    get().commit((d) => ({
      ...d,
      layers: d.layers.map((l) =>
        l.id === id ? { ...l, visible: !l.visible } : l,
      ),
    })),

  toggleLayerLock: (id) =>
    get().commit((d) => ({
      ...d,
      layers: d.layers.map((l) =>
        l.id === id ? { ...l, locked: !l.locked } : l,
      ),
    })),

  deleteLayer: (id) => {
    const { doc } = get();
    if (doc.layers.length <= 1) return;
    get().commit((d) => ({
      ...d,
      layers: d.layers.filter((l) => l.id !== id),
      elements: d.elements.filter((e) => e.layerId !== id),
    }));
    if (get().activeLayerId === id) {
      set({ activeLayerId: get().doc.layers[0]?.id ?? "" });
    }
  },

  moveLayer: (id, dir) =>
    get().commit((d) => {
      const idx = d.layers.findIndex((l) => l.id === id);
      const target = idx + dir;
      if (idx < 0 || target < 0 || target >= d.layers.length) return d;
      const layers = [...d.layers];
      [layers[idx], layers[target]] = [layers[target], layers[idx]];
      return { ...d, layers };
    }),

  addPiece: () => {
    const piece: Piece = {
      id: newId(),
      name: `Piece ${get().doc.pieces.length + 1}`,
      fabricId: null,
      elementIds: [],
      seamAllowance: 0,
    };
    get().commit((d) => ({ ...d, pieces: [...d.pieces, piece] }));
  },

  renamePiece: (id, name) =>
    get().commit((d) => ({
      ...d,
      pieces: d.pieces.map((p) => (p.id === id ? { ...p, name } : p)),
    })),

  deletePiece: (id) =>
    get().commit((d) => ({
      ...d,
      pieces: d.pieces.filter((p) => p.id !== id),
      elements: d.elements.map((e) =>
        e.pieceId === id ? { ...e, pieceId: null } : e,
      ),
    })),

  assignSelectionToPiece: (pieceId) => {
    const ids = get().selectedIds;
    if (ids.length === 0) return;
    get().commit((d) => ({
      ...d,
      elements: d.elements.map((e) =>
        ids.includes(e.id) ? { ...e, pieceId } : e,
      ),
      pieces: d.pieces.map((p) => {
        if (p.id === pieceId) {
          return {
            ...p,
            elementIds: Array.from(new Set([...p.elementIds, ...ids])),
          };
        }
        // remove these elements from any other piece
        return {
          ...p,
          elementIds: p.elementIds.filter((eid) => !ids.includes(eid)),
        };
      }),
    }));
  },

  setPieceFabric: (pieceId, fabricId) =>
    get().commit((d) => ({
      ...d,
      pieces: d.pieces.map((p) =>
        p.id === pieceId ? { ...p, fabricId } : p,
      ),
    })),

  setPieceSeamAllowance: (pieceId, value) =>
    get().commit((d) => ({
      ...d,
      pieces: d.pieces.map((p) =>
        p.id === pieceId ? { ...p, seamAllowance: value } : p,
      ),
    })),

  addFabric: () => {
    const idx = get().doc.materials.fabrics.length;
    const fabric: Fabric = {
      id: newId(),
      name: `Fabric ${idx + 1}`,
      widthUnits: get().doc.units === "cm" ? 140 : get().doc.units === "in" ? 54 : 54,
      color: PIECE_COLORS[idx % PIECE_COLORS.length],
    };
    get().commit((d) => ({
      ...d,
      materials: { ...d.materials, fabrics: [...d.materials.fabrics, fabric] },
    }));
  },

  updateFabric: (id, patch) =>
    get().commit((d) => ({
      ...d,
      materials: {
        ...d.materials,
        fabrics: d.materials.fabrics.map((f) =>
          f.id === id ? { ...f, ...patch } : f,
        ),
      },
    })),

  removeFabric: (id) =>
    get().commit((d) => ({
      ...d,
      materials: {
        ...d.materials,
        fabrics: d.materials.fabrics.filter((f) => f.id !== id),
      },
      pieces: d.pieces.map((p) =>
        p.fabricId === id ? { ...p, fabricId: null } : p,
      ),
    })),

  addNotion: (at) => {
    const notion: Notion = {
      id: newId(),
      name: "Button",
      qty: 1,
      note: "",
      x: at?.x ?? get().doc.canvas.widthUnits / 2,
      y: at?.y ?? get().doc.canvas.heightUnits / 2,
    };
    get().commit((d) => ({
      ...d,
      materials: { ...d.materials, notions: [...d.materials.notions, notion] },
    }));
  },

  updateNotion: (id, patch) =>
    get().commit((d) => ({
      ...d,
      materials: {
        ...d.materials,
        notions: d.materials.notions.map((n) =>
          n.id === id ? { ...n, ...patch } : n,
        ),
      },
    })),

  removeNotion: (id) =>
    get().commit((d) => ({
      ...d,
      materials: {
        ...d.materials,
        notions: d.materials.notions.filter((n) => n.id !== id),
      },
    })),

  setUnits: (u) => get().commit((d) => convertDocumentUnits(d, u)),

  setGridSize: (v) =>
    get().commit((d) => ({
      ...d,
      canvas: { ...d.canvas, gridSizeUnits: Math.max(0, v) },
    })),

  setCanvasSize: (w, h) =>
    get().commit((d) => ({
      ...d,
      canvas: {
        ...d.canvas,
        widthUnits: Math.max(1, w),
        heightUnits: Math.max(1, h),
      },
    })),

  setTitle: (title) => set({ title, saveStatus: "unsaved" }),
  setIsPublic: (isPublic) => set({ isPublic, saveStatus: "unsaved" }),
  setSaveStatus: (saveStatus) => set({ saveStatus }),
}));
