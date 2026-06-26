"use client";

import { useMemo, useState } from "react";
import { Printer, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";
import { useEditor } from "@/lib/editor/store";
import { elementsBounds } from "@/lib/editor/geometry";
import { seamAllowanceByElement } from "@/lib/editor/offset";
import { formatLength } from "@/lib/editor/units";
import { PAPER_SIZES } from "@/lib/constants";
import { computeTiling } from "@/lib/pdf/tiling";
import { exportPatternPdf } from "@/lib/pdf/export";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export function PrintDialog({
  open,
  onOpenChange,
  doc: docProp,
  title: titleProp,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** When provided (e.g. on the read-only view page), print this document
   * instead of the editor store's. */
  doc?: import("@/lib/types").PatternDocument;
  title?: string;
}) {
  const storeDoc = useEditor((s) => s.doc);
  const doc = docProp ?? storeDoc;

  const [paperId, setPaperId] = useState("letter");
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");
  const [marginMm, setMarginMm] = useState(6);
  const [overlapMm, setOverlapMm] = useState(12);
  const [lineWidthMm, setLineWidthMm] = useState(0.4);
  const [testSquare, setTestSquare] = useState(true);
  const [includeSeams, setIncludeSeams] = useState(true);
  const [includeSeamAllowance, setIncludeSeamAllowance] = useState(true);
  const [busy, setBusy] = useState(false);

  const paper = PAPER_SIZES.find((p) => p.id === paperId) ?? PAPER_SIZES[0];
  const paperWmm = orientation === "portrait" ? paper.widthMm : paper.heightMm;
  const paperHmm = orientation === "portrait" ? paper.heightMm : paper.widthMm;

  const { plan, contentW, contentH } = useMemo(() => {
    const hidden = new Set(doc.layers.filter((l) => !l.visible).map((l) => l.id));
    const visible = doc.elements.filter((el) => !hidden.has(el.layerId));
    const b =
      elementsBounds(visible) ?? {
        x: 0,
        y: 0,
        w: doc.canvas.widthUnits,
        h: doc.canvas.heightUnits,
      };
    let maxSa = 0;
    if (includeSeamAllowance) {
      for (const v of seamAllowanceByElement(doc.pieces, visible).values()) {
        maxSa = Math.max(maxSa, v);
      }
    }
    const w = b.w + maxSa * 2;
    const h = b.h + maxSa * 2;
    return {
      plan: computeTiling({
        contentWUnits: w,
        contentHUnits: h,
        units: doc.units,
        paperWmm,
        paperHmm,
        marginMm,
        overlapMm,
      }),
      contentW: w,
      contentH: h,
    };
  }, [doc, paperWmm, paperHmm, marginMm, overlapMm, includeSeamAllowance]);

  async function handleExport() {
    setBusy(true);
    try {
      const result = await exportPatternPdf(docProp ?? useEditor.getState().doc, {
        paperWmm,
        paperHmm,
        marginMm,
        overlapMm,
        lineWidthMm,
        includeTestSquare: testSquare,
        includeSeams,
        includeSeamAllowance,
        title: titleProp ?? useEditor.getState().title,
      });
      toast.success(
        `Exported ${result.pageCount} page${result.pageCount > 1 ? "s" : ""} to PDF`,
      );
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error("Could not export the PDF");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-hand text-2xl">Print pattern</DialogTitle>
          <DialogDescription>
            Tile your pattern at true 1:1 scale across printer pages, then tape
            them together.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Paper size</Label>
            <Select value={paperId} onValueChange={setPaperId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAPER_SIZES.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Orientation</Label>
            <div className="grid grid-cols-2 gap-2">
              {(["portrait", "landscape"] as const).map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => setOrientation(o)}
                  className={cn(
                    "rounded-md border px-3 py-2 text-sm capitalize transition",
                    orientation === o
                      ? "border-primary bg-primary/10 font-medium text-primary"
                      : "border-border text-muted-foreground hover:bg-muted",
                  )}
                >
                  {o}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <label className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">Margin (mm)</span>
              <Input type="number" min="0" step="1" value={marginMm} onChange={(e) => setMarginMm(Math.max(0, Number(e.target.value) || 0))} className="h-9" />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">Overlap (mm)</span>
              <Input type="number" min="0" step="1" value={overlapMm} onChange={(e) => setOverlapMm(Math.max(0, Number(e.target.value) || 0))} className="h-9" />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">Line (mm)</span>
              <Input type="number" min="0.1" step="0.1" value={lineWidthMm} onChange={(e) => setLineWidthMm(Math.max(0.1, Number(e.target.value) || 0.1))} className="h-9" />
            </label>
          </div>

          <div className="space-y-2">
            <label className="flex items-center justify-between rounded-md border border-border px-3 py-2">
              <span className="text-sm">Seam allowance (cut line)</span>
              <Switch checked={includeSeamAllowance} onCheckedChange={setIncludeSeamAllowance} />
            </label>
            <label className="flex items-center justify-between rounded-md border border-border px-3 py-2">
              <span className="text-sm">Seam numbers &amp; notches</span>
              <Switch checked={includeSeams} onCheckedChange={setIncludeSeams} />
            </label>
            <label className="flex items-center justify-between rounded-md border border-border px-3 py-2">
              <span className="text-sm">Scale test square</span>
              <Switch checked={testSquare} onCheckedChange={setTestSquare} />
            </label>
          </div>

          <div className="flex items-center gap-3 rounded-md bg-muted px-3 py-2.5 text-sm">
            <FileText className="size-5 text-muted-foreground" />
            <div>
              <p className="font-medium">
                {plan.pageCount} page{plan.pageCount > 1 ? "s" : ""}
                <span className="font-normal text-muted-foreground">
                  {" "}
                  · {plan.cols} × {plan.rows}
                </span>
              </p>
              <p className="text-xs text-muted-foreground">
                Pattern {formatLength(contentW, doc.units)} ×{" "}
                {formatLength(contentH, doc.units)}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Printer className="size-4" />}
            Export PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
