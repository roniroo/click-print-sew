import { describe, it, expect, beforeEach } from "vitest";
import { useEditor } from "./store";
import { createEmptyDocument, createRect } from "./document";

function init() {
  useEditor.getState().init({
    patternId: "p1",
    title: "Test",
    isPublic: false,
    doc: createEmptyDocument("in"),
  });
}

describe("editor store", () => {
  beforeEach(init);

  it("adds an element, selecting it, with undo/redo", () => {
    const st = useEditor.getState();
    st.addElement(createRect(st.doc.layers[0].id, 0, 0, 2, 2));
    expect(useEditor.getState().doc.elements).toHaveLength(1);
    expect(useEditor.getState().selectedIds).toHaveLength(1);

    useEditor.getState().undo();
    expect(useEditor.getState().doc.elements).toHaveLength(0);

    useEditor.getState().redo();
    expect(useEditor.getState().doc.elements).toHaveLength(1);
  });

  it("deletes the selection", () => {
    const st = useEditor.getState();
    st.addElement(createRect(st.doc.layers[0].id, 0, 0, 2, 2));
    useEditor.getState().deleteSelected();
    expect(useEditor.getState().doc.elements).toHaveLength(0);
  });

  it("converts units, preserving physical size", () => {
    const st = useEditor.getState();
    st.addElement(createRect(st.doc.layers[0].id, 0, 0, 2, 2));
    useEditor.getState().setUnits("cm");
    const rect = useEditor.getState().doc.elements[0];
    expect(rect.type === "rect" && rect.w).toBeCloseTo(5.08);
    expect(useEditor.getState().doc.units).toBe("cm");
  });

  it("assigns the selection to a piece", () => {
    const st = useEditor.getState();
    st.addElement(createRect(st.doc.layers[0].id, 0, 0, 2, 2));
    st.addPiece();
    const pieceId = useEditor.getState().doc.pieces[0].id;
    useEditor.getState().assignSelectionToPiece(pieceId);
    expect(useEditor.getState().doc.elements[0].pieceId).toBe(pieceId);
  });

  it("marks the document unsaved after an edit", () => {
    const st = useEditor.getState();
    expect(useEditor.getState().saveStatus).toBe("saved");
    st.addElement(createRect(st.doc.layers[0].id, 0, 0, 2, 2));
    expect(useEditor.getState().saveStatus).toBe("unsaved");
  });
});
