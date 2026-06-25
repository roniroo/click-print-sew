"use client";

import { useCallback, useEffect, useRef } from "react";
import { useEditor } from "./store";
import { documentToSvg } from "./render";
import { createClient } from "@/lib/supabase/client";

const DEBOUNCE_MS = 1200;

/**
 * Persists the editor document to Supabase shortly after edits stop. Returns a
 * `saveNow` function for explicit saves (e.g. ⌘S). RLS ensures only the owner
 * can update the row.
 */
export function useAutosave() {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savingRef = useRef(false);

  const doSave = useCallback(async () => {
    const st = useEditor.getState();
    if (!st.patternId || savingRef.current) return;
    savingRef.current = true;

    const snapshotDoc = st.doc;
    const snapshotTitle = st.title;
    const snapshotPublic = st.isPublic;

    st.setSaveStatus("saving");
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("patterns")
        .update({
          title: snapshotTitle.trim() || "Untitled Pattern",
          units: snapshotDoc.units,
          document: snapshotDoc,
          is_public: snapshotPublic,
          thumbnail: documentToSvg(snapshotDoc),
        })
        .eq("id", st.patternId);

      const now = useEditor.getState();
      if (error) {
        now.setSaveStatus("error");
      } else if (
        now.doc === snapshotDoc &&
        now.title === snapshotTitle &&
        now.isPublic === snapshotPublic
      ) {
        now.setSaveStatus("saved");
      }
      // else: more edits arrived during save; the subscription will reschedule.
    } finally {
      savingRef.current = false;
    }
  }, []);

  const saveNow = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    void doSave();
  }, [doSave]);

  useEffect(() => {
    const unsub = useEditor.subscribe((state, prev) => {
      const changed =
        state.doc !== prev.doc ||
        state.title !== prev.title ||
        state.isPublic !== prev.isPublic;
      if (changed && state.patternId) {
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => void doSave(), DEBOUNCE_MS);
      }
    });
    return () => {
      unsub();
      if (timer.current) clearTimeout(timer.current);
      // Best-effort flush of any pending edits on unmount.
      const st = useEditor.getState();
      if (st.saveStatus === "unsaved") void doSave();
    };
  }, [doSave]);

  return { saveNow };
}
