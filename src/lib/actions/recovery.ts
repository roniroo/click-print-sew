"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import {
  generateRecoveryCode,
  hashRecoveryCode,
  verifyRecoveryCode,
} from "@/lib/recovery";
import { passwordSchema, usernameSchema } from "@/lib/validation";

export interface RecoveryState {
  code: string | null;
  error: string | null;
}

/** Generate + store a new recovery code for the signed-in user; returns it once. */
export async function regenerateRecoveryCode(
  _prev: RecoveryState,
  _formData: FormData,
): Promise<RecoveryState> {
  const user = await getCurrentUser();
  if (!user) return { code: null, error: "You're not signed in." };

  const code = generateRecoveryCode();
  const hash = await hashRecoveryCode(code);
  const supabase = await createClient();
  // delete+insert (not upsert): the write-only table has no SELECT policy,
  // which upsert's conflict lookup would require.
  await supabase.from("recovery_codes").delete().eq("user_id", user.id);
  const { error } = await supabase
    .from("recovery_codes")
    .insert({ user_id: user.id, hash });
  if (error) return { code: null, error: error.message };

  return { code, error: null };
}

export interface ResetState {
  error: string | null;
  newCode?: string | null;
}

/** Reset a password using username + recovery code (logged out, admin-powered). */
export async function resetWithRecoveryCode(
  _prev: ResetState,
  formData: FormData,
): Promise<ResetState> {
  const username = usernameSchema.safeParse(formData.get("username"));
  const code = String(formData.get("code") ?? "");
  const pw = passwordSchema.safeParse(formData.get("password"));

  if (!username.success) return { error: "Enter your username." };
  if (!code.trim()) return { error: "Enter your recovery code." };
  if (!pw.success) {
    return { error: pw.error.issues[0]?.message ?? "Invalid new password" };
  }

  // Same generic error throughout so we never reveal whether a username exists.
  const generic = "That username and recovery code don't match.";
  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("username", username.data)
    .maybeSingle<{ id: string }>();
  if (!profile) return { error: generic };

  const { data: rec } = await admin
    .from("recovery_codes")
    .select("hash")
    .eq("user_id", profile.id)
    .maybeSingle<{ hash: string }>();
  if (!rec) return { error: generic };

  const valid = await verifyRecoveryCode(code, rec.hash);
  if (!valid) return { error: generic };

  const { error: updErr } = await admin.auth.admin.updateUserById(profile.id, {
    password: pw.data,
  });
  if (updErr) return { error: "Couldn't reset the password. Please try again." };

  // Rotate the code (one-time use) and hand back a fresh one to save.
  const newCode = generateRecoveryCode();
  const newHash = await hashRecoveryCode(newCode);
  await admin
    .from("recovery_codes")
    .upsert({ user_id: profile.id, hash: newHash, updated_at: new Date().toISOString() });

  return { error: null, newCode };
}
