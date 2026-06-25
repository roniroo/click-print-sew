import { createClient } from "@/lib/supabase/server";
import type { ProfileRow } from "@/lib/types";

export interface CurrentUser {
  id: string;
  username: string;
  profile: ProfileRow | null;
}

/**
 * Returns the signed-in user with their profile, or null. Safe to call in any
 * Server Component or Server Action.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<ProfileRow>();

  return {
    id: user.id,
    username: profile?.username ?? "stitcher",
    profile: profile ?? null,
  };
}
