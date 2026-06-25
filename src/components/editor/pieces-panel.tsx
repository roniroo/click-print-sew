"use client";

import { useState } from "react";
import { Plus, Trash2, Target } from "lucide-react";
import { useEditor } from "@/lib/editor/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function PiecesPanel() {
  const pieces = useEditor((s) => s.doc.pieces);
  const fabrics = useEditor((s) => s.doc.materials.fabrics);
  const units = useEditor((s) => s.doc.units);
  const elements = useEditor((s) => s.doc.elements);
  const selectedIds = useEditor((s) => s.selectedIds);

  const addPiece = useEditor((s) => s.addPiece);
  const renamePiece = useEditor((s) => s.renamePiece);
  const deletePiece = useEditor((s) => s.deletePiece);
  const assignSelectionToPiece = useEditor((s) => s.assignSelectionToPiece);
  const setPieceFabric = useEditor((s) => s.setPieceFabric);
  const setPieceSeamAllowance = useEditor((s) => s.setPieceSeamAllowance);
  const select = useEditor((s) => s.select);

  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-3 py-2">
        <h3 className="text-sm font-semibold">Pieces</h3>
        <Button variant="ghost" size="icon" className="size-7" onClick={addPiece} aria-label="Add piece">
          <Plus className="size-4" />
        </Button>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto px-2 pb-2">
        {pieces.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs text-muted-foreground">
            Group shapes into pattern pieces. Add a piece, select shapes on the
            canvas, then assign them.
          </p>
        ) : null}

        {pieces.map((piece) => {
          const count = elements.filter((e) => e.pieceId === piece.id).length;
          const fabric = fabrics.find((f) => f.id === piece.fabricId) ?? null;
          return (
            <div key={piece.id} className="rounded-lg border border-border bg-card p-2.5">
              <div className="flex items-center gap-2">
                <span
                  className="size-3 shrink-0 rounded-full border border-border"
                  style={{ background: fabric?.color ?? "transparent" }}
                />
                {editingId === piece.id ? (
                  <Input
                    autoFocus
                    defaultValue={piece.name}
                    onBlur={(e) => {
                      renamePiece(piece.id, e.target.value.trim() || piece.name);
                      setEditingId(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    className="h-7 flex-1 px-1.5 py-0 text-sm"
                  />
                ) : (
                  <button
                    className="flex-1 truncate text-left text-sm font-medium"
                    onDoubleClick={() => setEditingId(piece.id)}
                    onClick={() =>
                      select(elements.filter((e) => e.pieceId === piece.id).map((e) => e.id))
                    }
                    title="Click to select its shapes · double-click to rename"
                  >
                    {piece.name}
                    <span className="ml-1 text-xs text-muted-foreground">({count})</span>
                  </button>
                )}
                <button
                  onClick={() => deletePiece(piece.id)}
                  className="grid size-6 place-items-center rounded text-muted-foreground hover:text-destructive"
                  aria-label="Delete piece"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>

              <div className="mt-2 grid grid-cols-2 gap-2">
                <Select
                  value={piece.fabricId ?? "none"}
                  onValueChange={(v) => setPieceFabric(piece.id, v === "none" ? null : v)}
                >
                  <SelectTrigger size="sm" className="w-full">
                    <SelectValue placeholder="Fabric" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No fabric</SelectItem>
                    {fabrics.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    step="0.05"
                    min="0"
                    value={piece.seamAllowance}
                    onChange={(e) =>
                      setPieceSeamAllowance(piece.id, Math.max(0, Number(e.target.value) || 0))
                    }
                    className="h-8 px-2"
                    aria-label="Seam allowance"
                    title="Seam allowance"
                  />
                  <span className="text-xs text-muted-foreground">{units} SA</span>
                </div>
              </div>

              <Button
                variant="secondary"
                size="sm"
                className="mt-2 w-full"
                disabled={selectedIds.length === 0}
                onClick={() => assignSelectionToPiece(piece.id)}
              >
                <Target className="size-3.5" />
                Assign selection ({selectedIds.length})
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
