import { createClient } from "@/lib/supabase/server";
import { createEmptyDocument } from "@/lib/editor/document";
import type { PatternDocument, PatternRow, Unit } from "@/lib/types";

export interface PatternCardData {
  id: string;
  title: string;
  is_public: boolean;
  thumbnail: string | null;
  updated_at: string;
  owner_username?: string;
}

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

/** The current user's patterns, newest first. */
export async function getMyPatterns(): Promise<PatternCardData[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("patterns")
    .select("id,title,is_public,thumbnail,updated_at")
    .eq("owner_id", user.id)
    .order("updated_at", { ascending: false });

  return (data ?? []) as PatternCardData[];
}

/** Public patterns for the Explore gallery, with owner usernames attached. */
export async function getPublicPatterns(search?: string): Promise<PatternCardData[]> {
  const supabase = await createClient();
  let query = supabase
    .from("patterns")
    .select("id,title,is_public,thumbnail,updated_at,owner_id")
    .eq("is_public", true)
    .order("updated_at", { ascending: false })
    .limit(60);

  const term = search?.trim();
  if (term) query = query.ilike("title", `%${term}%`);

  const { data } = await query;
  const rows = (data ?? []) as (PatternCardData & { owner_id: string })[];
  if (rows.length === 0) return [];

  // profiles has no FK to patterns, so resolve usernames in a second query.
  const ownerIds = [...new Set(rows.map((r) => r.owner_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id,username")
    .in("id", ownerIds);
  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.username as string]));

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    is_public: r.is_public,
    thumbnail: r.thumbnail,
    updated_at: r.updated_at,
    owner_username: nameById.get(r.owner_id),
  }));
}

export interface PatternView {
  pattern: PatternRow;
  ownerUsername: string;
  isOwner: boolean;
}

/** Load a pattern for read-only viewing (public, or owned). RLS does the gating. */
export async function getPatternView(id: string): Promise<PatternView | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("patterns")
    .select("*")
    .eq("id", id)
    .maybeSingle<PatternRow>();
  if (!data) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", data.owner_id)
    .maybeSingle<{ username: string }>();

  return {
    pattern: data,
    ownerUsername: profile?.username ?? "stitcher",
    isOwner: user?.id === data.owner_id,
  };
}
