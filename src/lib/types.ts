/**
 * Core domain types for Cut Sew Print.
 *
 * The full editor state for a pattern is stored as a single JSONB `document`
 * on the `patterns` table. All geometry is expressed in the document's chosen
 * real-world `units` (inches, cm, etc.) with the origin at the top-left.
 */

export type Unit = "in" | "cm" | "mm" | "m" | "ft";

export interface Point {
  x: number;
  y: number;
}

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
}

export type ElementType = "line" | "polyline" | "rect" | "ellipse";

interface BaseElement {
  id: string;
  layerId: string;
  /** Pattern piece this element belongs to, if grouped. */
  pieceId: string | null;
  stroke: string;
  strokeWidth: number;
  fill: string;
}

export interface LineElement extends BaseElement {
  type: "line";
  points: [Point, Point];
}

/** Open or closed multi-point path. Freeform paths and polygons both use this. */
export interface PolylineElement extends BaseElement {
  type: "polyline";
  points: Point[];
  closed: boolean;
}

export interface RectElement extends BaseElement {
  type: "rect";
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface EllipseElement extends BaseElement {
  type: "ellipse";
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

export type Element =
  | LineElement
  | PolylineElement
  | RectElement
  | EllipseElement;

export interface Fabric {
  id: string;
  name: string;
  /** Usable bolt width in document units. */
  widthUnits: number;
  color: string;
}

export interface Notion {
  id: string;
  name: string;
  qty: number;
  note: string;
  /** Marker position on the canvas, in document units. */
  x: number;
  y: number;
}

export interface Piece {
  id: string;
  name: string;
  fabricId: string | null;
  elementIds: string[];
  /** Seam allowance in document units, for yardage estimates. */
  seamAllowance: number;
}

export interface PatternCanvas {
  /** Working area size in document units. */
  widthUnits: number;
  heightUnits: number;
  /** Grid spacing in document units. */
  gridSizeUnits: number;
  /** Screen pixels per document unit at 100% zoom. */
  pxPerUnit: number;
}

export interface PatternDocument {
  version: number;
  units: Unit;
  canvas: PatternCanvas;
  layers: Layer[];
  elements: Element[];
  pieces: Piece[];
  materials: {
    fabrics: Fabric[];
    notions: Notion[];
  };
}

/** Row shape of the `patterns` table. */
export interface PatternRow {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  is_public: boolean;
  units: Unit;
  document: PatternDocument;
  thumbnail: string | null;
  created_at: string;
  updated_at: string;
}

/** A pattern joined with its owner's username, for listings. */
export interface PatternWithOwner extends PatternRow {
  profiles: { username: string } | null;
}

/** Row shape of the `profiles` table. */
export interface ProfileRow {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  created_at: string;
}
