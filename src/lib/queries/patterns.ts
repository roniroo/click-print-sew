import { createClient } from "@/lib/supabase/server";
import { createEmptyDocument } from "@/lib/editor/document";
import type { PatternDocument, PatternRow, Unit } from "@/lib/types";

/** A stored document may be empty/legacy; fall back to a fresh one. */
export function ensureDocument(raw: unknown, units: Unit): PatternDocument {
  const doc = raw as Partial<PatternDocument> | null | undefined;
  if (doc && Array.isArray(doc.layers) && doc.layers.length > 0) {
    return doc as PatternDocument;
  }
  return createEmptyDocument(units);
}

/** Create a blank pattern owned by the current user; returns its id. */
export async function createPattern(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const document = createEmptyDocument("in");
  const { data, error } = await supabase
    .from("patterns")
    .insert({
      owner_id: user.id,
      title: "Untitled Pattern",
      units: "in",
      document,
      is_public: false,
    })
    .select("id")
    .single();

  if (error || !data) return null;
  return data.id as string;
}

/** Load a pattern for editing — only if the current user owns it. */
export async function getEditablePattern(id: string): Promise<PatternRow | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("patterns")
    .select("*")
    .eq("id", id)
    .maybeSingle<PatternRow>();

  if (!data || data.owner_id !== user.id) return null;
  return data;
}
