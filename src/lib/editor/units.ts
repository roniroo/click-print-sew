import type { Unit } from "@/lib/types";
import { MM_PER_UNIT } from "@/lib/constants";

/** Convert a value in the given unit to millimeters. */
export function toMm(value: number, unit: Unit): number {
  return value * MM_PER_UNIT[unit];
}

/** Convert millimeters to the given unit. */
export function fromMm(mm: number, unit: Unit): number {
  return mm / MM_PER_UNIT[unit];
}

/** Convert a value from one unit to another. */
export function convertValue(value: number, from: Unit, to: Unit): number {
  if (from === to) return value;
  return fromMm(toMm(value, from), to);
}

/** Round to a sensible number of decimals for display. */
export function roundForDisplay(value: number, digits = 2): number {
  const f = 10 ** digits;
  return Math.round(value * f) / f;
}

/** Format a length with its unit abbreviation, e.g. "12.5 in". */
export function formatLength(value: number, unit: Unit, digits = 2): string {
  return `${roundForDisplay(value, digits)} ${unit}`;
}
