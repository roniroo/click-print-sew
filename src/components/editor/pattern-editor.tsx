"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { PatternDocument } from "@/lib/types";
import { useEditor, type Tool } from "@/lib/editor/store";
import { useAutosave } from "@/lib/editor/use-autosave";
import { EditorTopbar } from "./editor-topbar";
import { Toolbar } from "./toolbar";
import { Canvas } from "./canvas";
import { RightPanel } from "./right-panel";
import { PrintDialog } from "@/components/print/print-dialog";

export interface InitialPattern {
  id: string;
  title: string;
  isPublic: boolean;
  document: PatternDocument;
}

const TOOL_KEYS: Record<string, Tool> = {
  v: "select",
  l: "line",
  p: "polyline",
  r: "rect",
  e: "ellipse",
  h: "pan",
};

export function PatternEditor({ initial }: { initial: InitialPattern }) {
  const [printOpen, setPrintOpen] = useState(false);
  const { saveNow } = useAutosave();

  // Initialize the store synchronously on first render (lazy initializer runs
  // before children mount, so the canvas measures the loaded document).
  useState(() => {
    useEditor.getState().init({
      patternId: initial.id,
      title: initial.title,
      isPublic: initial.isPublic,
      doc: initial.document,
    });
    return null;
  });

  // Re-initialize only when navigating to a different pattern (skip the mount
  // run so we don't clobber the canvas's initial fit-to-view).
  const mountedRef = useRef(false);
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    useEditor.getState().init({
      patternId: initial.id,
      title: initial.title,
      isPublic: initial.isPublic,
      doc: initial.document,
    });
  }, [initial]);

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
      const st = useEditor.getState();
      const meta = e.metaKey || e.ctrlKey;

      if (meta && e.key.toLowerCase() === "s") {
        e.preventDefault();
        saveNow();
        toast.success("Pattern saved");
        return;
      }
      if (meta && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) st.redo();
        else st.undo();
        return;
      }
      if (meta && e.key.toLowerCase() === "y") {
        e.preventDefault();
        st.redo();
        return;
      }
      if (isTyping()) return;

      if ((e.key === "Delete" || e.key === "Backspace") && st.selectedIds.length) {
        e.preventDefault();
        st.deleteSelected();
        return;
      }
      const tool = TOOL_KEYS[e.key.toLowerCase()];
      if (tool) st.setTool(tool);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [saveNow]);

  return (
    <div className="flex h-svh flex-col overflow-hidden">
      <EditorTopbar onPrint={() => setPrintOpen(true)} />
      <div className="flex min-h-0 flex-1">
        <Toolbar />
        <div className="relative min-w-0 flex-1">
          <Canvas />
        </div>
        <RightPanel />
      </div>
      <PrintDialog open={printOpen} onOpenChange={setPrintOpen} />
    </div>
  );
}
