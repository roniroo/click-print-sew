"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { usernameToEmail } from "@/lib/auth-email";
import { passwordSchema } from "@/lib/validation";

export interface AccountState {
  error: string | null;
  success?: boolean;
}

export async function changePassword(
  _prev: AccountState,
  formData: FormData,
): Promise<AccountState> {
  const current = String(formData.get("current") ?? "");
  const parsed = passwordSchema.safeParse(formData.get("next"));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid new password" };
  }

  const user = await getCurrentUser();
  if (!user) return { error: "You're not signed in." };

  const supabase = await createClient();

  // Verify the current password by re-authenticating first.
  const { error: signInErr } = await supabase.auth.signInWithPassword({
    email: usernameToEmail(user.username),
    password: current,
  });
  if (signInErr) {
    return { error: "Current password is incorrect." };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data });
  if (error) {
    return { error: error.message };
  }

  return { error: null, success: true };
}
