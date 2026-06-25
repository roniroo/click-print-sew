"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, signupSchema } from "@/lib/validation";
import { usernameToEmail } from "@/lib/auth-email";

export interface AuthState {
  error: string | null;
}

/** Only allow same-origin relative redirect targets. */
function safeRedirect(target: FormDataEntryValue | null): string {
  if (typeof target === "string" && target.startsWith("/") && !target.startsWith("//")) {
    return target;
  }
  return "/dashboard";
}

export async function signUp(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = signupSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { username, password } = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: usernameToEmail(username),
    password,
    options: { data: { username } },
  });

  if (error) {
    if (error.message.toLowerCase().includes("already")) {
      return { error: "That username is taken. Try another." };
    }
    return { error: error.message };
  }

  // Supabase returns a user with no identities when the account already exists.
  if (data.user && data.user.identities && data.user.identities.length === 0) {
    return { error: "That username is taken. Try another." };
  }

  redirect(safeRedirect(formData.get("redirect")));
}

export async function signIn(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "Enter your username and password" };
  }
  const { username, password } = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: usernameToEmail(username),
    password,
  });

  if (error) {
    return { error: "Incorrect username or password" };
  }

  redirect(safeRedirect(formData.get("redirect")));
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
