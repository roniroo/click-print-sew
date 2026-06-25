"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { PatternRow } from "@/lib/types";

export async function deletePattern(id: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("patterns").delete().eq("id", id);
  revalidatePath("/dashboard");
}

export async function setPatternPublic(id: string, isPublic: boolean): Promise<void> {
  const supabase = await createClient();
  await supabase.from("patterns").update({ is_public: isPublic }).eq("id", id);
  revalidatePath("/dashboard");
  revalidatePath("/explore");
}

/**
 * Copy a pattern the user can read (their own, or a public one) into their own
 * library as a new private pattern, then open it in the editor.
 */
async function copyPattern(id: string, suffix: string): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: source } = await supabase
    .from("patterns")
    .select("*")
    .eq("id", id)
    .maybeSingle<PatternRow>();
  if (!source) return null;

  const { data: inserted, error } = await supabase
    .from("patterns")
    .insert({
      owner_id: user.id,
      title: `${source.title} ${suffix}`.slice(0, 120),
      description: source.description,
      units: source.units,
      document: source.document,
      thumbnail: source.thumbnail,
      is_public: false,
    })
    .select("id")
    .single();

  if (error || !inserted) return null;
  return inserted.id as string;
}

export async function duplicatePattern(id: string): Promise<void> {
  const newId = await copyPattern(id, "(copy)");
  if (!newId) redirect("/dashboard");
  revalidatePath("/dashboard");
  redirect(`/patterns/${newId}/edit`);
}

export async function clonePattern(id: string): Promise<void> {
  const newId = await copyPattern(id, "(clone)");
  if (!newId) redirect(`/login?redirect=/patterns/${id}`);
  revalidatePath("/dashboard");
  redirect(`/patterns/${newId}/edit`);
}
