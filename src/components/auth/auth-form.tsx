"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { signIn, signUp, type AuthState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RecoveryCodeCard } from "@/components/account/recovery-code-card";

interface AuthFormProps {
  mode: "login" | "signup";
  redirectTo: string;
}

const initialState: AuthState = { error: null };

export function AuthForm({ mode, redirectTo }: AuthFormProps) {
  const action = mode === "login" ? signIn : signUp;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [showPassword, setShowPassword] = useState(false);

  const isSignup = mode === "signup";
  const router = useRouter();

  // After signup, show the one-time recovery code before continuing.
  if (isSignup && state.recoveryCode) {
    return (
      <div className="space-y-4">
        <h2 className="font-hand text-2xl font-bold tracking-tight">
          Save your recovery code
        </h2>
        <p className="text-sm text-muted-foreground">
          There&apos;s no email on file, so this is the only way to reset your
          password if you ever forget it.
        </p>
        <RecoveryCodeCard code={state.recoveryCode} />
        <Button className="w-full" onClick={() => router.push(redirectTo)}>
          I&apos;ve saved it — continue
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="redirect" value={redirectTo} />

      <div className="space-y-1.5">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="thread_wizard"
          required
          autoFocus
        />
        {isSignup ? (
          <p className="text-xs text-muted-foreground">
            3–24 characters: lowercase letters, numbers, underscores.
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete={isSignup ? "new-password" : "current-password"}
            placeholder={isSignup ? "At least 8 characters" : "Your password"}
            required
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="absolute inset-y-0 right-0 grid w-10 place-items-center text-muted-foreground hover:text-foreground"
            aria-label={showPassword ? "Hide password" : "Show password"}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>

      {!isSignup ? (
        <div className="-mt-2 text-right">
          <Link
            href="/forgot"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Forgot your password?
          </Link>
        </div>
      ) : null}

      {state.error ? (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {state.error}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : null}
        {isSignup ? "Create account" : "Log in"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {isSignup ? (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Log in
            </Link>
          </>
        ) : (
          <>
            New here?{" "}
            <Link href="/signup" className="font-medium text-primary hover:underline">
              Create an account
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
